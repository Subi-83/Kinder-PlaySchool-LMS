from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.book import BookTitle, BookCopy, BookLevel, BookCategory, BookLevelSequence
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, get_current_user
from app.services.settings_service import SettingsService
import requests
import json

import re

books_bp = Blueprint('books', __name__, url_prefix='/api/books')

def _to_int(val):
    if val is None or val == '': return None
    try: return int(val)
    except (ValueError, TypeError): return None

def _to_float(val):
    if val is None or val == '': return None
    try: return float(val)
    except (ValueError, TypeError): return None

def generate_book_id_for_level(level_id):
    """Generate unique Book ID in format: <LEVEL><5-DIGIT-SEQUENCE> (e.g. 100001, 200001)"""
    level_num = 1
    if level_id:
        lvl = BookLevel.query.get(level_id)
        if lvl:
            digits = re.findall(r'\d+', lvl.level_code or lvl.level_name or '')
            if digits:
                level_num = int(digits[0])
            elif lvl.sort_order and lvl.sort_order > 0:
                level_num = lvl.sort_order
            else:
                level_num = lvl.level_id

    target_level_id = level_id or 1
    seq_rec = BookLevelSequence.query.filter_by(level_id=target_level_id).with_for_update().first()
    if not seq_rec:
        # Check existing copies for highest sequence if any
        prefix_pattern = f"{level_num}%"
        existing_copies = BookCopy.query.filter(BookCopy.barcode.like(prefix_pattern)).all()
        max_seq = 0
        for c in existing_copies:
            if c.barcode and c.barcode.startswith(str(level_num)) and len(c.barcode) == 6 and c.barcode[1:].isdigit():
                max_seq = max(max_seq, int(c.barcode[1:]))
        seq_rec = BookLevelSequence(level_id=target_level_id, last_sequence=max_seq)
        db.session.add(seq_rec)
        db.session.flush()

    seq_rec.last_sequence += 1
    candidate_id = f"{level_num}{seq_rec.last_sequence:05d}"

    while BookCopy.query.filter_by(barcode=candidate_id).first():
        seq_rec.last_sequence += 1
        candidate_id = f"{level_num}{seq_rec.last_sequence:05d}"

    return candidate_id

def _generate_default_barcode(level_id, book_id, copy_num=1):
    return generate_book_id_for_level(level_id)

@books_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('book.view')
def get_books():
    """Get all books with inventory summary"""
    books = BookTitle.query.order_by(BookTitle.title).all()
    return jsonify([b.to_dict() for b in books]), 200

@books_bp.route('/copies', methods=['GET'])
@jwt_required()
@permission_required('book.view')
def get_book_copies():
    """Get all book copies"""
    copies = BookCopy.query.all()
    return jsonify([c.to_dict() for c in copies]), 200

@books_bp.route('/copies/search', methods=['GET'])
@jwt_required()
@permission_required('book.view')
def search_book_copies():
    """Search book copies by barcode/book_id, title, author, level, category, isbn"""
    q = (request.args.get('q') or '').strip()
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    
    query = BookCopy.query.join(BookTitle, BookCopy.book_title_id == BookTitle.book_title_id)
    if available_only:
        query = query.filter(BookCopy.status == 'AVAILABLE')
        
    if q:
        query = query.filter(
            db.or_(
                BookCopy.barcode.like(f'%{q}%'),
                BookTitle.title.like(f'%{q}%'),
                BookTitle.author.like(f'%{q}%'),
                BookTitle.isbn.like(f'%{q}%')
            )
        )
    copies = query.limit(50).all()
    return jsonify([c.to_dict() for c in copies]), 200

@books_bp.route('/<int:book_id>', methods=['GET'])
@jwt_required()
@permission_required('book.view')
def get_book(book_id):
    """Get a specific book by ID"""
    book = BookTitle.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    return jsonify(book.to_dict()), 200

@books_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('book.create')
def create_book():
    """Create a new book title or add copy to existing book title"""
    data = request.get_json() or {}
    create_physical_copy = data.get('create_physical_copy', True)
    if isinstance(create_physical_copy, str):
        create_physical_copy = create_physical_copy.lower() in ('true', '1', 'yes')
    
    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    isbn = (data.get('isbn') or '').strip() or None
    level_id = _to_int(data.get('level_id'))
    ebook_count = max(0, _to_int(data.get('ebook_count')) or 0)
    if not create_physical_copy and ebook_count == 0:
        return jsonify({'error': 'Enter an e-book count when no physical copy is being added.'}), 400
    
    # 1. Check if book title already exists by ISBN or exact Title+Author
    existing = None
    if isbn:
        existing = BookTitle.query.filter_by(isbn=isbn).first()
    if not existing and title and author:
        existing = BookTitle.query.filter(
            db.func.lower(BookTitle.title) == title.lower(),
            db.func.lower(BookTitle.author) == author.lower()
        ).first()

    if existing:
        # Update e-book inventory without inventing a physical copy when this
        # submission represents an e-book-only holding.
        if not create_physical_copy:
            if data.get('ebook_count') not in (None, ''):
                existing.ebook_count = ebook_count
            if _to_float(data.get('mrp')) is not None:
                existing.mrp = _to_float(data.get('mrp'))
            db.session.commit()
            current_user = get_current_user()
            AuditLog.log_action(
                user_id=current_user.user_id if current_user else None,
                username=current_user.username if current_user else 'system',
                action='UPDATE_EBOOK_INVENTORY', module='Book', record_id=str(existing.book_title_id),
                details=f'Updated e-book inventory for {existing.title} to {existing.ebook_count}; no physical copy added.'
            )
            return jsonify(existing.to_dict()), 200

        # Add a new physical copy under the existing title.
        copy_count = existing.copies.count()
        gen_barcode = _generate_default_barcode(existing.level_id or level_id, existing.book_title_id, copy_count + 1)
        copy = BookCopy(
            book_title_id=existing.book_title_id,
            copy_number=copy_count + 1,
            barcode=data.get('barcode') or gen_barcode,
            purchase_year=_to_int(data.get('purchase_year')),
            purchase_price=_to_float(data.get('purchase_price')),
            location=data.get('location') or 'Main Shelf',
            status='AVAILABLE',
            notes=data.get('copy_notes') or None
        )
        if _to_int(data.get('publication_year')) and not existing.publication_year:
            existing.publication_year = _to_int(data.get('publication_year'))
        if level_id and not existing.level_id:
            existing.level_id = level_id
        if _to_float(data.get('mrp')) is not None:
            existing.mrp = _to_float(data.get('mrp'))
        if data.get('ebook_count') not in (None, ''):
            existing.ebook_count = max(0, _to_int(data.get('ebook_count')) or 0)

        db.session.add(copy)
        db.session.commit()
        
        current_user = get_current_user()
        AuditLog.log_action(
            user_id=current_user.user_id if current_user else None,
            username=current_user.username if current_user else 'system',
            action='ADD_BOOK_COPY',
            module='Book',
            record_id=str(existing.book_title_id),
            details=f'Added copy #{copy_count + 1} to existing book: {existing.title}'
        )
        return jsonify(existing.to_dict()), 201

    try:
        # Create new book title
        book = BookTitle(
            title=title,
            author=author,
            isbn=isbn,
            level_id=level_id,
            mrp=_to_float(data.get('mrp')),
            ebook_count=ebook_count,
            category_id=_to_int(data.get('category_id')),
            publication_year=_to_int(data.get('publication_year')),
            publisher=data.get('publisher') or None,
            description=data.get('description') or None,
            cover_image=data.get('cover_image') or None
        )
        db.session.add(book)
        db.session.flush()

        if create_physical_copy:
            gen_barcode = _generate_default_barcode(level_id, book.book_title_id, 1)
            copy = BookCopy(
                book_title_id=book.book_title_id,
                copy_number=1,
                barcode=data.get('barcode') or gen_barcode,
                accession_number=data.get('accession_number') or None,
                purchase_year=_to_int(data.get('purchase_year')),
                purchase_price=_to_float(data.get('purchase_price')),
                location=data.get('location') or 'Main Shelf',
                status='AVAILABLE',
                notes=data.get('copy_notes') or None
            )
            db.session.add(copy)
        db.session.commit()

        current_user = get_current_user()
        AuditLog.log_action(
            user_id=current_user.user_id if current_user else None,
            username=current_user.username if current_user else 'system',
            action='CREATE_BOOK',
            module='Book',
            record_id=str(book.book_title_id),
            details=f'Created book: {book.title} by {book.author}' + (' with first physical copy' if create_physical_copy else ' as e-book only')
        )
        return jsonify(book.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create book: {str(e)}'}), 500

@books_bp.route('/<int:book_id>', methods=['PUT'])
@jwt_required()
@permission_required('book.edit')
def update_book(book_id):
    """Update a book"""
    book = BookTitle.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    data = request.get_json() or {}
    tracked_fields = ('title', 'author', 'isbn', 'level_id', 'mrp', 'ebook_count', 'category_id', 'publication_year', 'publisher', 'description')
    before_values = {field: getattr(book, field, None) for field in tracked_fields}
    
    try:
        if 'title' in data:
            book.title = data['title']
        if 'author' in data:
            book.author = data['author']
        if 'isbn' in data:
            book.isbn = data['isbn'] or None
        if 'level_id' in data:
            book.level_id = _to_int(data['level_id'])
        if 'mrp' in data:
            book.mrp = _to_float(data['mrp'])
        if 'ebook_count' in data:
            book.ebook_count = max(0, _to_int(data['ebook_count']) or 0)
        if 'category_id' in data:
            book.category_id = _to_int(data['category_id'])
        if 'publication_year' in data:
            book.publication_year = _to_int(data['publication_year'])
        if 'publisher' in data:
            book.publisher = data['publisher'] or None
        if 'description' in data:
            book.description = data['description'] or None
        if 'cover_image' in data:
            book.cover_image = data['cover_image'] or None
        
        # Update copy details for all copies associated with this book title
        copies = BookCopy.query.filter_by(book_title_id=book_id).all()
        for copy in copies:
            if 'barcode' in data and data['barcode']:
                copy.barcode = data['barcode']
            if 'location' in data and data['location']:
                copy.location = data['location']
            if 'purchase_year' in data:
                copy.purchase_year = _to_int(data['purchase_year'])
            if 'purchase_price' in data:
                copy.purchase_price = _to_float(data['purchase_price'])

        db.session.commit()
        
        current_user = get_current_user()
        user_id = current_user.user_id if current_user else None
        username = current_user.username if current_user else 'system'
        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action='UPDATE_BOOK',
            module='Book',
            record_id=str(book_id),
            details='Updated book fields: ' + json.dumps({
                field: {'from': str(before_values[field]), 'to': str(getattr(book, field, None))}
                for field in tracked_fields if str(before_values[field]) != str(getattr(book, field, None))
            })
        )
        
        return jsonify(book.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update book: {str(e)}'}), 500

@books_bp.route('/<int:book_id>', methods=['DELETE'])
@jwt_required()
@permission_required('book.delete')
def delete_book(book_id):
    """Create an administrator approval request before deleting a book."""
    book = BookTitle.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    # Check if any copies are issued
    issued_copies = BookCopy.query.filter_by(
        book_title_id=book_id,
        status='ISSUED'
    ).count()
    
    if issued_copies > 0:
        return jsonify({'error': f'Cannot delete book with {issued_copies} issued copies'}), 400
    
    current_user = get_current_user()
    existing_request = AuditLog.query.filter_by(action='DELETE_BOOK_REQUEST', module='Book', record_id=str(book_id)).first()
    if existing_request:
        return jsonify({'message': 'Deletion is already waiting for administrator approval.', 'request_id': existing_request.audit_id}), 202
    approval = AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='DELETE_BOOK_REQUEST', module='Book', record_id=str(book_id),
        details=f'Requested deletion of book: {book.title}'
    )
    return jsonify({'message': 'Deletion request sent to administrator.', 'request_id': approval.audit_id}), 202

@books_bp.route('/<int:book_id>/copies', methods=['POST'])
@jwt_required()
@permission_required('book.create')
def add_book_copy(book_id):
    """Add a new physical copy to an existing book title"""
    book = BookTitle.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book title not found'}), 404
        
    data = request.get_json() or {}
    copy_count = book.copies.count()
    gen_barcode = _generate_default_barcode(book.level_id, book.book_title_id, copy_count + 1)
    
    copy = BookCopy(
        book_title_id=book.book_title_id,
        copy_number=copy_count + 1,
        barcode=data.get('barcode') or gen_barcode,
        purchase_year=_to_int(data.get('purchase_year')),
        purchase_price=_to_float(data.get('purchase_price')),
        location=data.get('location') or 'Main Shelf',
        condition=data.get('condition') or 'NEW',
        status='AVAILABLE',
        notes=data.get('notes') or None
    )
    db.session.add(copy)
    db.session.commit()
    return jsonify(book.to_dict()), 201

@books_bp.route('/copy/<int:copy_id>', methods=['PUT'])
@jwt_required()
@permission_required('book.edit')
def update_book_copy(copy_id):
    """Update a book copy"""
    copy = BookCopy.query.get(copy_id)
    if not copy:
        return jsonify({'error': 'Book copy not found'}), 404
    
    data = request.get_json() or {}
    tracked_fields = ('status', 'condition', 'location', 'notes', 'barcode', 'purchase_year', 'purchase_price')
    before_values = {field: getattr(copy, field, None) for field in tracked_fields}
    
    if 'status' in data:
        copy.status = data['status']
    if 'condition' in data:
        copy.condition = data['condition']
    if 'location' in data:
        copy.location = data['location']
    if 'notes' in data:
        copy.notes = data['notes']
    if 'barcode' in data:
        copy.barcode = data['barcode']
    if 'purchase_year' in data:
        copy.purchase_year = _to_int(data['purchase_year'])
    if 'purchase_price' in data:
        copy.purchase_price = _to_float(data['purchase_price'])
    
    db.session.commit()
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='UPDATE_BOOK_COPY', module='BookCopy', record_id=str(copy_id),
        details='Updated copy fields: ' + json.dumps({
            field: {'from': str(before_values[field]), 'to': str(getattr(copy, field, None))}
            for field in tracked_fields if str(before_values[field]) != str(getattr(copy, field, None))
        })
    )
    return jsonify(copy.to_dict()), 200

@books_bp.route('/copy/<int:copy_id>', methods=['DELETE'])
@jwt_required()
@permission_required('book.delete')
def delete_book_copy(copy_id):
    """Create an administrator approval request before deleting a copy."""
    copy = BookCopy.query.get(copy_id)
    if not copy:
        return jsonify({'error': 'Book copy not found'}), 404
    if copy.status == 'ISSUED':
        return jsonify({'error': 'Cannot delete copy while it is currently issued to a student'}), 400
        
    current_user = get_current_user()
    existing_request = AuditLog.query.filter_by(action='DELETE_COPY_REQUEST', module='BookCopy', record_id=str(copy_id)).first()
    if existing_request:
        return jsonify({'message': 'Deletion is already waiting for administrator approval.', 'request_id': existing_request.audit_id}), 202
    approval = AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='DELETE_COPY_REQUEST', module='BookCopy', record_id=str(copy_id),
        details=f'Requested deletion of copy {copy.barcode or copy_id} from {copy.title_ref.title if copy.title_ref else "book"}'
    )
    return jsonify({'message': 'Deletion request sent to administrator.', 'request_id': approval.audit_id}), 202

@books_bp.route('/isbn-lookup', methods=['GET'])
@jwt_required()
@permission_required('book.create')
def isbn_lookup():
    """Look up book information by ISBN using local database, catalog dictionary, and fallback APIs."""
    import re
    raw_isbn = request.args.get('isbn', '')
    if not raw_isbn:
        return jsonify({'error': 'ISBN required'}), 400
    
    # Clean input ISBN: strip non-alphanumeric characters (keep digits and X)
    clean_isbn = re.sub(r'[^0-9X]', '', raw_isbn.strip().upper())
    if not clean_isbn:
        return jsonify({'error': 'Invalid ISBN format'}), 400

    # Check if barcode lookup is enabled
    if not SettingsService.get_bool('barcode_lookup_enabled', True):
        return jsonify({'error': 'Barcode lookup is disabled'}), 403

    # Tier 1: Check existing local database books
    try:
        existing_books = BookTitle.query.all()
        for b in existing_books:
            if b.isbn and re.sub(r'[^0-9X]', '', b.isbn.upper()) == clean_isbn:
                return jsonify({
                    'title': b.title,
                    'author': b.author,
                    'authors': [b.author],
                    'publisher': b.publisher or '',
                    'publish_date': str(b.publication_year) if b.publication_year else '',
                    'publication_year': b.publication_year,
                    'description': b.description or '',
                    'isbn': b.isbn,
                    'level_id': b.level_id,
                    'category_id': b.category_id,
                    'source': 'database'
                }), 200
    except Exception:
        pass

    # Tier 2: Check offline catalog dictionary of popular children's & kindergarten books
    catalog = {
        '9780399226908': {'title': 'The Very Hungry Caterpillar', 'author': 'Eric Carle', 'publisher': 'World Publishing Company', 'publish_date': '1969'},
        '9780060755355': {'title': 'Goodnight Moon', 'author': 'Margaret Wise Brown', 'publisher': 'Harper & Brothers', 'publish_date': '1947'},
        '9780064431781': {'title': 'Where the Wild Things Are', 'author': 'Maurice Sendak', 'publisher': 'Harper & Row', 'publish_date': '1963'},
        '9780394800011': {'title': 'The Cat in the Hat', 'author': 'Dr. Seuss', 'publisher': 'Random House', 'publish_date': '1957'},
        '9780394800165': {'title': 'Green Eggs and Ham', 'author': 'Dr. Seuss', 'publisher': 'Random House', 'publish_date': '1960'},
        '9780333710937': {'title': 'The Gruffalo', 'author': 'Julia Donaldson', 'publisher': 'Macmillan Children\'s Books', 'publish_date': '1999'},
        '9780333903384': {'title': 'Room on the Broom', 'author': 'Julia Donaldson', 'publisher': 'Macmillan Children\'s Books', 'publish_date': '2001'},
        '9780375828379': {'title': 'Don\'t Let the Pigeon Drive the Bus!', 'author': 'Mo Willems', 'publisher': 'Hyperion Books for Children', 'publish_date': '2003'},
        '9780805047905': {'title': 'Brown Bear, Brown Bear, What Do You See?', 'author': 'Bill Martin Jr.', 'publisher': 'Henry Holt and Co.', 'publish_date': '1967'},
        '9780395150238': {'title': 'Curious George', 'author': 'H.A. Rey', 'publisher': 'Houghton Mifflin', 'publish_date': '1941'},
        '9780064400558': {'title': 'Charlotte\'s Web', 'author': 'E.B. White', 'publisher': 'Harper & Brothers', 'publish_date': '1952'},
        '9780141365466': {'title': 'Matilda', 'author': 'Roald Dahl', 'publisher': 'Jonathan Cape', 'publish_date': '1988'},
        '9780590414272': {'title': 'The Magic School Bus Inside the Human Body', 'author': 'Joanna Cole', 'publisher': 'Scholastic', 'publish_date': '1989'},
        '9781426307935': {'title': 'National Geographic Little Kids First Big Book of Animals', 'author': 'Catherine D. Hughes', 'publisher': 'National Geographic', 'publish_date': '2010'},
        '9781409306160': {'title': 'Peppa\'s Big Tale', 'author': 'Ladybird', 'publisher': 'Ladybird Books', 'publish_date': '2011'},
        '9780811879544': {'title': 'Press Here', 'author': 'Hervé Tullet', 'publisher': 'Chronicle Books', 'publish_date': '2011'},
        '9780060259778': {'title': 'If You Give a Mouse a Cookie', 'author': 'Laura Numeroff', 'publisher': 'Harper & Row', 'publish_date': '1985'},
        '9780142410387': {'title': 'The BFG', 'author': 'Roald Dahl', 'publisher': 'Puffin Books', 'publish_date': '1982'},
        '9780142410370': {'title': 'Charlie and the Chocolate Factory', 'author': 'Roald Dahl', 'publisher': 'George Allen & Unwin', 'publish_date': '1964'},
        '9788172234980': {'title': 'Panchatantra Stories for Children', 'author': 'Vishnu Sharma', 'publisher': 'HarperCollins India', 'publish_date': '2015'}
    }

    if clean_isbn in catalog:
        cat_info = catalog[clean_isbn]
        return jsonify({
            'title': cat_info['title'],
            'author': cat_info['author'],
            'authors': [cat_info['author']],
            'publisher': cat_info['publisher'],
            'publish_date': cat_info['publish_date'],
            'isbn': clean_isbn,
            'source': 'catalog'
        }), 200

    # Tier 3: Try Google Books API (3s timeout)
    try:
        gb_resp = requests.get(
            f'https://www.googleapis.com/books/v1/volumes?q=isbn:{clean_isbn}',
            timeout=3
        )
        if gb_resp.status_code == 200:
            gb_data = gb_resp.json()
            if 'items' in gb_data and len(gb_data['items']) > 0:
                info = gb_data['items'][0].get('volumeInfo', {})
                authors = info.get('authors', [])
                pub_date = info.get('publishedDate', '')
                return jsonify({
                    'title': info.get('title', ''),
                    'author': authors[0] if authors else '',
                    'authors': authors,
                    'publisher': info.get('publisher', ''),
                    'publish_date': pub_date[:4] if pub_date else '',
                    'description': info.get('description', ''),
                    'cover': info.get('imageLinks', {}).get('thumbnail', None),
                    'isbn': clean_isbn,
                    'source': 'google_books'
                }), 200
    except Exception:
        pass

    # Tier 4: Try Open Library API (3s timeout)
    try:
        ol_resp = requests.get(
            'https://openlibrary.org/api/books',
            params={
                'bibkeys': f'ISBN:{clean_isbn}',
                'format': 'json',
                'jscmd': 'data'
            },
            timeout=3
        )
        if ol_resp.status_code == 200:
            data = ol_resp.json()
            key = f'ISBN:{clean_isbn}'
            if key in data:
                book_data = data[key]
                authors = [a.get('name') for a in book_data.get('authors', [])]
                pub_date = book_data.get('publish_date', '')
                return jsonify({
                    'title': book_data.get('title', ''),
                    'authors': authors,
                    'author': authors[0] if authors else '',
                    'publisher': book_data.get('publishers', [{}])[0].get('name') if book_data.get('publishers') else '',
                    'publish_date': pub_date[-4:] if len(pub_date) >= 4 else pub_date,
                    'cover': book_data.get('cover', {}).get('large') if book_data.get('cover') else None,
                    'isbn': clean_isbn,
                    'source': 'open_library'
                }), 200
    except Exception:
        pass

    # Tier 5: Return ISBN initialized template if book was not found externally
    # This prevents blocking the librarian and pre-fills the ISBN into the form
    return jsonify({
        'title': '',
        'author': '',
        'publisher': '',
        'publish_date': '',
        'isbn': clean_isbn,
        'message': 'ISBN recognized. Please enter title and author details.'
    }), 200


# Book Levels
@books_bp.route('/levels', methods=['GET'])
@jwt_required()
def get_book_levels():
    """Get all book levels"""
    levels = (BookLevel.query.order_by(BookLevel.sort_order, BookLevel.level_name).all()
              if request.args.get('include_inactive', '').lower() == 'true'
              else BookLevel.get_active_levels())
    return jsonify([l.to_dict() for l in levels]), 200

@books_bp.route('/levels', methods=['POST'])
@jwt_required()
@permission_required('book.edit')
def create_book_level():
    """Create a new book level"""
    data = request.get_json() or {}
    
    level = BookLevel(
        level_code=data.get('level_code'),
        level_name=data.get('level_name'),
        description=data.get('description'),
        sort_order=_to_int(data.get('sort_order')) or 0
    )
    
    db.session.add(level)
    db.session.commit()
    
    return jsonify(level.to_dict()), 201

@books_bp.route('/levels/<int:level_id>', methods=['PUT'])
@jwt_required()
@permission_required('book.edit')
def update_book_level(level_id):
    """Update a book level"""
    level = BookLevel.query.get(level_id)
    if not level:
        return jsonify({'error': 'Book level not found'}), 404

    data = request.get_json() or {}
    for field in ('level_code', 'level_name', 'description', 'is_active'):
        if field in data:
            setattr(level, field, data[field])
    if 'sort_order' in data:
        level.sort_order = _to_int(data['sort_order']) or 0

    db.session.commit()
    return jsonify(level.to_dict()), 200

@books_bp.route('/levels/<int:level_id>', methods=['DELETE'])
@jwt_required()
@permission_required('book.delete')
def delete_book_level(level_id):
    """Deactivate a book level (soft delete — books may reference it)"""
    level = BookLevel.query.get(level_id)
    if not level:
        return jsonify({'error': 'Book level not found'}), 404

    level.is_active = False
    db.session.commit()
    return jsonify({'message': f'Book level {level.level_name} deactivated'}), 200

# Book Categories
@books_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_book_categories():
    """Get all book categories"""
    categories = (BookCategory.query.order_by(BookCategory.category_name).all()
                  if request.args.get('include_inactive', '').lower() == 'true'
                  else BookCategory.get_active_categories())
    return jsonify([c.to_dict() for c in categories]), 200

@books_bp.route('/categories', methods=['POST'])
@jwt_required()
@permission_required('book.edit')
def create_book_category():
    """Create a new book category"""
    data = request.get_json()
    
    category = BookCategory(
        category_code=data.get('category_code'),
        category_name=data.get('category_name'),
        description=data.get('description')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201

@books_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
@permission_required('book.edit')
def update_book_category(category_id):
    """Update a book category"""
    category = BookCategory.query.get(category_id)
    if not category:
        return jsonify({'error': 'Book category not found'}), 404

    data = request.get_json()
    for field in ('category_code', 'category_name', 'description', 'is_active'):
        if field in data:
            setattr(category, field, data[field])

    db.session.commit()
    return jsonify(category.to_dict()), 200

@books_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
@permission_required('book.delete')
def delete_book_category(category_id):
    """Deactivate a book category (soft delete — books may reference it)"""
    category = BookCategory.query.get(category_id)
    if not category:
        return jsonify({'error': 'Book category not found'}), 404

    category.is_active = False
    db.session.commit()
    return jsonify({'message': f'Book category {category.category_name} deactivated'}), 200
