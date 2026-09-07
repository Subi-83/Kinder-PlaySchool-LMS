from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.book import (
    BookTitle, BookCopy, BookLevel, BookCategory, BookLevelSequence,
    EBookLevelSequence, LibraryCupboard, LibraryShelf
)
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, permission_required_any, get_current_user
from app.services.permission_service import PermissionService
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

def _resolve_location(cupboard_id, shelf_id, fallback_text=None):
    cid = _to_int(cupboard_id)
    sid = _to_int(shelf_id)
    cupboard = LibraryCupboard.query.get(cid) if cid else None
    shelf = LibraryShelf.query.get(sid) if sid else None

    if cupboard and shelf:
        return cid, sid, f"{cupboard.cupboard_name} / {shelf.shelf_name}"
    elif cupboard:
        return cid, None, cupboard.cupboard_name
    elif shelf:
        c_name = shelf.cupboard_ref.cupboard_name if getattr(shelf, 'cupboard_ref', None) else 'Cupboard'
        return shelf.cupboard_id, sid, f"{c_name} / {shelf.shelf_name}"
    return None, None, fallback_text or 'Main Shelf'

def _normalize_initial_condition(raw):
    if not raw:
        return 'Good', None
    c = str(raw).strip().title()
    if c.lower() == 'lost':
        return None, 'Lost is not an allowed initial condition for book entry.'
    if c in ['Good', 'Small Damage', 'Large Damage']:
        return c, None
    if c == 'Damaged':
        return 'Small Damage', None
    return None, f"Invalid initial book condition '{raw}'. Allowed options: Good, Small Damage, Large Damage."

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

def extract_level_code(level_id):
    """Extract numeric level code/number from BookLevel (e.g. '1' from Level 1, '10' from Level 10)"""
    if not level_id:
        return None
    lvl = BookLevel.query.get(level_id)
    if not lvl:
        return None
    digits = re.findall(r'\d+', lvl.level_code or lvl.level_name or '')
    if digits:
        return digits[0]
    elif lvl.sort_order and lvl.sort_order > 0:
        return str(lvl.sort_order)
    return str(lvl.level_id)

def validate_isbn(isbn):
    """Validate ISBN-10 or ISBN-13 format and checksum. Returns (clean_isbn, error_message)."""
    if not isbn:
        return None, None
    raw = re.sub(r'[-\s]', '', str(isbn).strip().upper())
    if not raw:
        return None, None
    if len(raw) == 10:
        if not re.match(r'^\d{9}[\dX]$', raw):
            return None, 'Invalid ISBN-10 format. Must contain 9 digits followed by a digit or X.'
        total = 0
        for i in range(9):
            total += int(raw[i]) * (10 - i)
        check = 10 if raw[9] == 'X' else int(raw[9])
        total += check
        if total % 11 != 0:
            return None, f'Invalid ISBN-10 checksum for {isbn}.'
        return raw, None
    elif len(raw) == 13:
        if not re.match(r'^\d{13}$', raw):
            return None, 'Invalid ISBN-13 format. Must contain exactly 13 digits.'
        total = 0
        for i in range(12):
            factor = 1 if i % 2 == 0 else 3
            total += int(raw[i]) * factor
        check = (10 - (total % 10)) % 10
        if int(raw[12]) != check:
            return None, f'Invalid ISBN-13 checksum for {isbn}.'
        return raw, None
    else:
        return None, f'Invalid ISBN length ({len(raw)} characters). ISBN must be 10 or 13 digits.'

def validate_year(val, field_name='Year'):
    """Validate 4-digit year format (e.g. 2024). Returns (year_int, error_message)."""
    if val is None or val == '':
        return None, None
    s = str(val).strip()
    if not re.match(r'^\d{4}$', s):
        return None, f"{field_name} must be a valid 4-digit year (e.g. 2024). Received '{val}'."
    try:
        yr = int(s)
        if yr < 1000 or yr > 9999:
            return None, f"{field_name} must be a valid 4-digit year."
        return yr, None
    except (ValueError, TypeError):
        return None, f"{field_name} must be a valid 4-digit year."

def peek_next_ebook_id(level_id):
    """Peek the next available sequential E-Book ID for preview without incrementing sequence."""
    level_code_val = extract_level_code(level_id)
    if not level_code_val:
        return None
    seq_rec = EBookLevelSequence.query.filter_by(level_id=level_id).first()
    if seq_rec:
        next_seq = seq_rec.last_sequence + 1
    else:
        prefix = f"EB{level_code_val}"
        existing_ebooks = BookTitle.query.filter(BookTitle.e_book_id.like(f"{prefix}%")).all()
        max_seq = 0
        pattern = re.compile(rf"^EB{re.escape(level_code_val)}(\d+)$")
        for eb in existing_ebooks:
            if eb.e_book_id:
                m = pattern.match(eb.e_book_id)
                if m:
                    try:
                        max_seq = max(max_seq, int(m.group(1)))
                    except ValueError:
                        pass
        next_seq = max_seq + 1

    candidate_id = f"EB{level_code_val}{next_seq:04d}"
    while BookTitle.query.filter_by(e_book_id=candidate_id).first():
        next_seq += 1
        candidate_id = f"EB{level_code_val}{next_seq:04d}"
    return candidate_id

def generate_next_ebook_id(level_id):
    """Atomically generate the next sequential E-Book ID for a level in format: EB<LEVEL><4-DIGIT-SEQUENCE>"""
    level_code_val = extract_level_code(level_id)
    if not level_code_val:
        return None
    seq_rec = EBookLevelSequence.query.filter_by(level_id=level_id).with_for_update().first()
    if not seq_rec:
        prefix = f"EB{level_code_val}"
        existing_ebooks = BookTitle.query.filter(BookTitle.e_book_id.like(f"{prefix}%")).all()
        max_seq = 0
        pattern = re.compile(rf"^EB{re.escape(level_code_val)}(\d+)$")
        for eb in existing_ebooks:
            if eb.e_book_id:
                m = pattern.match(eb.e_book_id)
                if m:
                    try:
                        max_seq = max(max_seq, int(m.group(1)))
                    except ValueError:
                        pass
        seq_rec = EBookLevelSequence(level_id=level_id, last_sequence=max_seq)
        db.session.add(seq_rec)
        db.session.flush()

    seq_rec.last_sequence += 1
    candidate_id = f"EB{level_code_val}{seq_rec.last_sequence:04d}"
    while BookTitle.query.filter_by(e_book_id=candidate_id).first():
        seq_rec.last_sequence += 1
        candidate_id = f"EB{level_code_val}{seq_rec.last_sequence:04d}"

    return candidate_id

def _create_ebook_record(data, current_user):
    """Handle creation of an E-Book with auto-generated ID and validation."""
    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    level_id = _to_int(data.get('level_id'))

    if not title:
        return jsonify({'error': 'Title is required.'}), 400
    if not author:
        return jsonify({'error': 'Author is required.'}), 400
    if not level_id:
        return jsonify({'error': 'Book Reading Level is required for E-Book ID generation.'}), 400

    level = BookLevel.query.get(level_id)
    if not level or not level.is_active:
        return jsonify({'error': 'A valid active Reading Level must be selected.'}), 400

    category_id = _to_int(data.get('category_id'))
    if category_id:
        category = BookCategory.query.get(category_id)
        if not category:
            return jsonify({'error': 'Selected category not found.'}), 400

    raw_pub = data.get('publish_year') if data.get('publish_year') is not None else data.get('publication_year')
    pub_year, err = validate_year(raw_pub, 'Publish Year')
    if err:
        return jsonify({'error': err}), 400

    pur_year, err = validate_year(data.get('purchase_year'), 'Purchase Year')
    if err:
        return jsonify({'error': err}), 400

    if pub_year and pur_year and pur_year < pub_year:
        return jsonify({'error': f'Purchase Year ({pur_year}) cannot be earlier than Publish Year ({pub_year}).'}), 400

    raw_isbn = data.get('isbn')
    clean_isbn, err = validate_isbn(raw_isbn)
    if err:
        return jsonify({'error': err}), 400

    publisher = (data.get('publisher') or '').strip() or None
    description = (data.get('description') or '').strip() or None

    gen_ebook_id = generate_next_ebook_id(level_id)
    if not gen_ebook_id:
        return jsonify({'error': 'Could not generate E-Book ID for the selected reading level.'}), 500

    book = BookTitle(
        e_book_id=gen_ebook_id,
        title=title,
        author=author,
        isbn=clean_isbn,
        level_id=level_id,
        category_id=category_id,
        publication_year=pub_year,
        publisher=publisher,
        purchase_year=pur_year,
        description=description,
        ebook_count=max(1, _to_int(data.get('ebook_count')) or 1)
    )
    db.session.add(book)
    db.session.commit()

    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='CREATE_EBOOK',
        module='Book',
        record_id=str(book.book_title_id),
        details=f'Created E-Book {gen_ebook_id}: "{book.title}" by {book.author} (Level: {level.level_name})'
    )

    return jsonify({
        'message': 'E-book saved successfully.',
        'e_book_id': gen_ebook_id,
        'book': book.to_dict()
    }), 201

def _update_ebook_record(book, data, current_user):
    """Handle updating an E-Book record while preserving e_book_id."""
    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    if not title:
        return jsonify({'error': 'Title is required.'}), 400
    if not author:
        return jsonify({'error': 'Author is required.'}), 400

    level_id = _to_int(data.get('level_id'))
    if level_id:
        level = BookLevel.query.get(level_id)
        if not level:
            return jsonify({'error': 'Selected reading level not found.'}), 400
        book.level_id = level_id

    category_id = _to_int(data.get('category_id'))
    if category_id:
        category = BookCategory.query.get(category_id)
        if not category:
            return jsonify({'error': 'Selected category not found.'}), 400
        book.category_id = category_id
    elif 'category_id' in data:
        book.category_id = None

    raw_pub = data.get('publish_year') if data.get('publish_year') is not None else data.get('publication_year')
    pub_year, err = validate_year(raw_pub, 'Publish Year')
    if err:
        return jsonify({'error': err}), 400

    pur_year, err = validate_year(data.get('purchase_year'), 'Purchase Year')
    if err:
        return jsonify({'error': err}), 400

    if pub_year and pur_year and pur_year < pub_year:
        return jsonify({'error': f'Purchase Year ({pur_year}) cannot be earlier than Publish Year ({pub_year}).'}), 400

    raw_isbn = data.get('isbn')
    clean_isbn, err = validate_isbn(raw_isbn)
    if err:
        return jsonify({'error': err}), 400

    book.title = title
    book.author = author
    book.publication_year = pub_year
    book.purchase_year = pur_year
    book.isbn = clean_isbn
    if 'publisher' in data:
        book.publisher = (data.get('publisher') or '').strip() or None
    if 'description' in data:
        book.description = (data.get('description') or '').strip() or None

    # Ensure e_book_id exists if record was previously missing one
    if not book.e_book_id and book.level_id:
        book.e_book_id = generate_next_ebook_id(book.level_id)

    db.session.commit()
    return jsonify({
        'message': 'E-book updated successfully.',
        'e_book_id': book.e_book_id,
        'book': book.to_dict()
    }), 200

@books_bp.route('/ebooks/next-id', methods=['GET'])
@jwt_required()
@permission_required_any(['ebook.view', 'ebook.create'])
def get_next_ebook_id():
    """Preview next auto-generated E-Book ID for a given reading level"""
    level_id = _to_int(request.args.get('level_id'))
    if not level_id:
        return jsonify({'error': 'Reading level ID is required to generate E-Book ID preview'}), 400
    lvl = BookLevel.query.get(level_id)
    if not lvl:
        return jsonify({'error': 'Selected reading level not found'}), 404
    candidate_id = peek_next_ebook_id(level_id)
    return jsonify({
        'level_id': level_id,
        'level_name': lvl.level_name,
        'e_book_id': candidate_id
    }), 200

@books_bp.route('/ebooks', methods=['POST'])
@jwt_required()
@permission_required('ebook.create')
def create_ebook_endpoint():
    """Explicit endpoint to create a new E-Book record"""
    return _create_ebook_record(request.get_json() or {}, get_current_user())

@books_bp.route('/ebooks/<int:book_id>', methods=['PUT'])
@jwt_required()
@permission_required('ebook.edit')
def update_ebook_endpoint(book_id):
    """Explicit endpoint to update an E-Book record"""
    book = BookTitle.query.get(book_id)
    if not book or int(book.ebook_count or 0) <= 0:
        return jsonify({'error': 'E-book record not found'}), 404
    return _update_ebook_record(book, request.get_json() or {}, get_current_user())

@books_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('book.view')
def get_books():
    """Get physical book titles only; e-books have their own register."""
    books = BookTitle.query.filter(BookTitle.copies.any()).order_by(BookTitle.title).all()
    return jsonify([b.to_dict() for b in books]), 200

@books_bp.route('/ebooks', methods=['GET'])
@jwt_required()
@permission_required('ebook.view')
def get_ebooks():
    """Return informational e-book records; these have no issueable copies."""
    ebooks = BookTitle.query.filter(BookTitle.ebook_count > 0).order_by(BookTitle.title).all()
    return jsonify([b.to_dict() for b in ebooks]), 200

@books_bp.route('/ebooks/<int:book_id>', methods=['DELETE'])
@jwt_required()
@permission_required('ebook.delete')
def delete_ebook_record(book_id):
    """Remove only the e-book record, preserving a shared physical title."""
    book = BookTitle.query.get(book_id)
    if not book or int(book.ebook_count or 0) <= 0:
        return jsonify({'error': 'E-book record not found'}), 404
    title = book.title
    if book.copies.count() > 0:
        book.ebook_count = 0
    else:
        db.session.delete(book)
    db.session.commit()
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='DELETE_EBOOK_RECORD', module='Book', record_id=str(book_id),
        details=f'Removed informational e-book record: {title}'
    )
    return jsonify({'message': 'E-book record removed'}), 200

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
@permission_required_any(['book.create', 'ebook.create'])
def create_book():
    """Create a new book title or add copy to existing book title"""
    data = request.get_json() or {}
    create_physical_copy = data.get('create_physical_copy', True)
    if isinstance(create_physical_copy, str):
        create_physical_copy = create_physical_copy.lower() in ('true', '1', 'yes')
    required_permission = 'book.create' if create_physical_copy else 'ebook.create'
    current_user = get_current_user()
    if not PermissionService.user_has_permission(current_user, required_permission):
        return jsonify({'error': 'Permission denied', 'required_permission': required_permission}), 403
    
    if not create_physical_copy:
        return _create_ebook_record(data, current_user)

    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    isbn = (data.get('isbn') or '').strip() or None
    level_id = _to_int(data.get('level_id'))
    ebook_count = max(0, _to_int(data.get('ebook_count')) or 0)
    
    # 1. Check if book title already exists by ISBN or exact Title+Author
    existing = None
    if isbn:
        existing = BookTitle.query.filter_by(isbn=isbn).first()
    if not existing and title and author:
        existing = BookTitle.query.filter(
            db.func.lower(BookTitle.title) == title.lower(),
            db.func.lower(BookTitle.author) == author.lower()
        ).first()

    raw_initial = data.get('initial_condition') or data.get('current_condition') or data.get('condition')
    initial_cond, err = _normalize_initial_condition(raw_initial)
    if err:
        return jsonify({'error': err}), 400

    if existing:
        # E-books are information-only records. Do not silently overwrite an
        # existing record when the add form is submitted more than once.
        if not create_physical_copy:
            matched_by = 'ISBN' if isbn and (existing.isbn or '').strip().lower() == isbn.lower() else 'title and author'
            return jsonify({
                'error': f'Duplicate e-book: a record with this {matched_by} already exists. Use Edit to update it.',
                'warning': True,
                'existing_book_id': existing.book_title_id
            }), 409

        # Add a new physical copy under the existing title.
        copy_count = existing.copies.count()
        gen_barcode = _generate_default_barcode(existing.level_id or level_id, existing.book_title_id, copy_count + 1)
        cid, sid, loc_str = _resolve_location(data.get('cupboard_id'), data.get('shelf_id'), data.get('location'))
        copy = BookCopy(
            book_title_id=existing.book_title_id,
            copy_number=copy_count + 1,
            barcode=data.get('barcode') or gen_barcode,
            purchase_year=_to_int(data.get('purchase_year')),
            purchase_price=_to_float(data.get('purchase_price')),
            cupboard_id=cid,
            shelf_id=sid,
            location=loc_str,
            condition='DAMAGED' if 'Damage' in initial_cond else 'GOOD',
            current_condition=initial_cond,
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
            cid, sid, loc_str = _resolve_location(data.get('cupboard_id'), data.get('shelf_id'), data.get('location'))
            copy = BookCopy(
                book_title_id=book.book_title_id,
                copy_number=1,
                barcode=data.get('barcode') or gen_barcode,
                accession_number=data.get('accession_number') or None,
                purchase_year=_to_int(data.get('purchase_year')),
                purchase_price=_to_float(data.get('purchase_price')),
                cupboard_id=cid,
                shelf_id=sid,
                location=loc_str,
                condition='DAMAGED' if 'Damage' in initial_cond else 'GOOD',
                current_condition=initial_cond,
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
@permission_required_any(['book.edit', 'ebook.edit'])
def update_book(book_id):
    """Update a book"""
    book = BookTitle.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    data = request.get_json() or {}
    ebook_request = data.get('create_physical_copy') is False
    required_permission = 'ebook.edit' if ebook_request else 'book.edit'
    if not PermissionService.user_has_permission(get_current_user(), required_permission):
        return jsonify({'error': 'Permission denied', 'required_permission': required_permission}), 403

    if ebook_request or (book.copies.count() == 0 and int(book.ebook_count or 0) > 0):
        return _update_ebook_record(book, data, get_current_user())

    title = (data.get('title', book.title) or '').strip()
    author = (data.get('author', book.author) or '').strip()
    isbn = (data.get('isbn', book.isbn) or '').strip() or None

    duplicate = None
    if isbn:
        duplicate = BookTitle.query.filter(
            BookTitle.book_title_id != book_id,
            db.func.lower(db.func.trim(BookTitle.isbn)) == isbn.lower()
        ).first()
    if not duplicate and title and author:
        duplicate = BookTitle.query.filter(
            BookTitle.book_title_id != book_id,
            db.func.lower(db.func.trim(BookTitle.title)) == title.lower(),
            db.func.lower(db.func.trim(BookTitle.author)) == author.lower()
        ).first()
    if duplicate:
        return jsonify({
            'error': 'Duplicate book: another record already has this ISBN or title and author.',
            'warning': True,
            'existing_book_id': duplicate.book_title_id
        }), 409

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
            if 'cupboard_id' in data or 'shelf_id' in data or 'location' in data:
                cid, sid, loc_str = _resolve_location(
                    data.get('cupboard_id', copy.cupboard_id),
                    data.get('shelf_id', copy.shelf_id),
                    data.get('location', copy.location)
                )
                copy.cupboard_id = cid
                copy.shelf_id = sid
                copy.location = loc_str
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
    """Admins delete immediately; other permitted users request approval."""
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
    if current_user and current_user.role == 'ADMIN':
        title = book.title
        try:
            pending = AuditLog.query.filter_by(action='DELETE_BOOK_REQUEST', module='Book', record_id=str(book_id)).first()
            if pending:
                pending.action = 'DELETE_BOOK_APPROVED'
                pending.details = f'{pending.details} | Completed directly by administrator {current_user.username}'
            BookCopy.query.filter_by(book_title_id=book_id).delete()
            db.session.delete(book)
            db.session.commit()
            AuditLog.log_action(
                user_id=current_user.user_id, username=current_user.username,
                action='DELETE_BOOK_ADMIN', module='Book', record_id=str(book_id),
                details=f'Administrator deleted book: {title}'
            )
            return jsonify({'message': f'Book {title} deleted successfully.'}), 200
        except Exception:
            db.session.rollback()
            return jsonify({'error': 'Book cannot be deleted because it has historical issue or return records.'}), 400

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
    
    raw_initial = data.get('initial_condition') or data.get('current_condition') or data.get('condition')
    initial_cond, err = _normalize_initial_condition(raw_initial)
    if err:
        return jsonify({'error': err}), 400

    cid, sid, loc_str = _resolve_location(data.get('cupboard_id'), data.get('shelf_id'), data.get('location'))
    copy = BookCopy(
        book_title_id=book.book_title_id,
        copy_number=copy_count + 1,
        barcode=data.get('barcode') or gen_barcode,
        purchase_year=_to_int(data.get('purchase_year')),
        purchase_price=_to_float(data.get('purchase_price')),
        cupboard_id=cid,
        shelf_id=sid,
        location=loc_str,
        condition='DAMAGED' if 'Damage' in initial_cond else 'GOOD',
        current_condition=initial_cond,
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
    tracked_fields = ('status', 'condition', 'current_condition', 'cupboard_id', 'shelf_id', 'location', 'notes', 'barcode', 'purchase_year', 'purchase_price')
    before_values = {field: getattr(copy, field, None) for field in tracked_fields}
    
    if 'current_condition' in data or 'condition' in data or 'initial_condition' in data:
        raw_cond = data.get('current_condition') or data.get('condition') or data.get('initial_condition')
        norm_cond = str(raw_cond).strip().title()
        if norm_cond == 'Damaged':
            norm_cond = 'Small Damage'
        if norm_cond in ['Good', 'Small Damage', 'Large Damage', 'Lost']:
            copy.current_condition = norm_cond
            copy.condition = 'DAMAGED' if 'Damage' in norm_cond else 'GOOD'
            if norm_cond == 'Lost':
                copy.status = 'LOST'
            elif copy.status == 'LOST' and norm_cond in ['Good', 'Small Damage', 'Large Damage']:
                copy.status = 'AVAILABLE'
    if 'status' in data:
        copy.status = data['status']
    if 'cupboard_id' in data or 'shelf_id' in data or 'location' in data:
        cid, sid, loc_str = _resolve_location(
            data.get('cupboard_id', copy.cupboard_id),
            data.get('shelf_id', copy.shelf_id),
            data.get('location', copy.location)
        )
        copy.cupboard_id = cid
        copy.shelf_id = sid
        copy.location = loc_str
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
    """Admins delete immediately; other permitted users request approval."""
    copy = BookCopy.query.get(copy_id)
    if not copy:
        return jsonify({'error': 'Book copy not found'}), 404
    if copy.status == 'ISSUED':
        return jsonify({'error': 'Cannot delete copy while it is currently issued to a student'}), 400
        
    current_user = get_current_user()
    if current_user and current_user.role == 'ADMIN':
        barcode = copy.barcode or str(copy_id)
        title = copy.title_ref.title if copy.title_ref else 'book'
        try:
            pending = AuditLog.query.filter_by(action='DELETE_COPY_REQUEST', module='BookCopy', record_id=str(copy_id)).first()
            if pending:
                pending.action = 'DELETE_COPY_APPROVED'
                pending.details = f'{pending.details} | Completed directly by administrator {current_user.username}'
            db.session.delete(copy)
            db.session.commit()
            AuditLog.log_action(
                user_id=current_user.user_id, username=current_user.username,
                action='DELETE_COPY_ADMIN', module='BookCopy', record_id=str(copy_id),
                details=f'Administrator deleted copy {barcode} from {title}'
            )
            return jsonify({'message': f'Book copy {barcode} deleted successfully.'}), 200
        except Exception:
            db.session.rollback()
            return jsonify({'error': 'Book copy cannot be deleted because it has historical issue or return records.'}), 400

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


# ==========================================
# Library Locations (Cupboard -> Shelf)
# ==========================================

@books_bp.route('/locations/hierarchy', methods=['GET'])
@jwt_required()
def get_location_hierarchy():
    """Get dynamic Cupboard -> Shelf hierarchy for dependent dropdowns and master data"""
    include_inactive = request.args.get('include_inactive', '').lower() == 'true'
    cupboard_query = LibraryCupboard.query
    if not include_inactive:
        cupboard_query = cupboard_query.filter_by(is_active=True)
    cupboards = cupboard_query.order_by(LibraryCupboard.cupboard_name.asc()).all()

    result = []
    for c in cupboards:
        c_dict = c.to_dict(include_shelves=False)
        shelf_query = c.shelves
        if not include_inactive:
            shelf_query = shelf_query.filter_by(is_active=True)
        shelves = shelf_query.order_by(LibraryShelf.shelf_name.asc()).all()
        c_dict['shelves'] = [s.to_dict() for s in shelves]
        result.append(c_dict)

    return jsonify(result), 200


@books_bp.route('/locations/cupboards', methods=['GET'])
@jwt_required()
def get_cupboards():
    """List all cupboards with their shelves"""
    include_inactive = request.args.get('include_inactive', '').lower() == 'true'
    query = LibraryCupboard.query
    if not include_inactive:
        query = query.filter_by(is_active=True)
    cupboards = query.order_by(LibraryCupboard.cupboard_name.asc()).all()
    return jsonify([c.to_dict(include_shelves=True) for c in cupboards]), 200


@books_bp.route('/locations/cupboards', methods=['POST'])
@jwt_required()
@permission_required('book.edit')
def create_cupboard():
    """Create a new cupboard"""
    data = request.get_json() or {}
    name = (data.get('cupboard_name') or '').strip()
    if not name:
        return jsonify({'error': 'Cupboard name is required'}), 400

    code = (data.get('cupboard_code') or '').strip()
    if not code:
        count = LibraryCupboard.query.count()
        code = f"CUP-{count + 1:02d}"

    existing = LibraryCupboard.query.filter(
        db.or_(
            db.func.lower(LibraryCupboard.cupboard_code) == code.lower(),
            db.func.lower(LibraryCupboard.cupboard_name) == name.lower()
        )
    ).first()
    if existing:
        return jsonify({'error': f'A cupboard with name "{name}" or code "{code}" already exists'}), 400

    cupboard = LibraryCupboard(
        cupboard_code=code,
        cupboard_name=name,
        description=data.get('description') or None,
        is_active=data.get('is_active', True)
    )
    db.session.add(cupboard)
    db.session.commit()
    return jsonify(cupboard.to_dict(include_shelves=True)), 201


@books_bp.route('/locations/cupboards/<int:cupboard_id>', methods=['PUT'])
@jwt_required()
@permission_required('book.edit')
def update_cupboard(cupboard_id):
    """Update a cupboard"""
    cupboard = LibraryCupboard.query.get(cupboard_id)
    if not cupboard:
        return jsonify({'error': 'Cupboard not found'}), 404

    data = request.get_json() or {}
    if 'cupboard_code' in data:
        code = (data.get('cupboard_code') or '').strip()
        if code:
            existing = LibraryCupboard.query.filter(
                LibraryCupboard.cupboard_id != cupboard_id,
                db.func.lower(LibraryCupboard.cupboard_code) == code.lower()
            ).first()
            if existing:
                return jsonify({'error': f'Cupboard code "{code}" is already in use'}), 400
            cupboard.cupboard_code = code

    if 'cupboard_name' in data:
        name = (data.get('cupboard_name') or '').strip()
        if name:
            existing = LibraryCupboard.query.filter(
                LibraryCupboard.cupboard_id != cupboard_id,
                db.func.lower(LibraryCupboard.cupboard_name) == name.lower()
            ).first()
            if existing:
                return jsonify({'error': f'Cupboard name "{name}" is already in use'}), 400
            cupboard.cupboard_name = name

    if 'description' in data:
        cupboard.description = data.get('description') or None
    if 'is_active' in data:
        cupboard.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify(cupboard.to_dict(include_shelves=True)), 200


@books_bp.route('/locations/cupboards/<int:cupboard_id>', methods=['DELETE'])
@jwt_required()
@permission_required('book.delete')
def delete_cupboard(cupboard_id):
    """Deactivate or delete cupboard if no books are stored"""
    cupboard = LibraryCupboard.query.get(cupboard_id)
    if not cupboard:
        return jsonify({'error': 'Cupboard not found'}), 404

    # Check if any physical book copies are in this cupboard
    copy_count = BookCopy.query.filter_by(cupboard_id=cupboard_id).count()
    if copy_count > 0:
        cupboard.is_active = False
        db.session.commit()
        return jsonify({'message': f'Cupboard "{cupboard.cupboard_name}" has {copy_count} books assigned. It has been deactivated.'}), 200

    # Check if any shelves belonging to this cupboard have copies
    shelf_ids = [s.shelf_id for s in cupboard.shelves.all()]
    if shelf_ids:
        shelf_copy_count = BookCopy.query.filter(BookCopy.shelf_id.in_(shelf_ids)).count()
        if shelf_copy_count > 0:
            cupboard.is_active = False
            db.session.commit()
            return jsonify({'message': f'Cupboard "{cupboard.cupboard_name}" has shelves with {shelf_copy_count} books assigned. It has been deactivated.'}), 200

    name = cupboard.cupboard_name
    db.session.delete(cupboard)
    db.session.commit()
    return jsonify({'message': f'Cupboard "{name}" deleted successfully'}), 200


@books_bp.route('/locations/cupboards/<int:cupboard_id>/activate', methods=['POST'])
@jwt_required()
@permission_required('book.edit')
def activate_cupboard(cupboard_id):
    """Activate a deactivated cupboard"""
    cupboard = LibraryCupboard.query.get(cupboard_id)
    if not cupboard:
        return jsonify({'error': 'Cupboard not found'}), 404
    cupboard.is_active = True
    db.session.commit()
    return jsonify(cupboard.to_dict(include_shelves=True)), 200


@books_bp.route('/locations/shelves', methods=['GET'])
@jwt_required()
def get_shelves():
    """List shelves, optionally filtered by cupboard_id"""
    include_inactive = request.args.get('include_inactive', '').lower() == 'true'
    cupboard_id = _to_int(request.args.get('cupboard_id'))
    query = LibraryShelf.query
    if cupboard_id:
        query = query.filter_by(cupboard_id=cupboard_id)
    if not include_inactive:
        query = query.filter_by(is_active=True)
    shelves = query.order_by(LibraryShelf.shelf_name.asc()).all()
    return jsonify([s.to_dict() for s in shelves]), 200


@books_bp.route('/locations/shelves', methods=['POST'])
@jwt_required()
@permission_required('book.edit')
def create_shelf():
    """Create a new shelf under a specific cupboard"""
    data = request.get_json() or {}
    cupboard_id = _to_int(data.get('cupboard_id'))
    if not cupboard_id:
        return jsonify({'error': 'Please select a cupboard'}), 400

    cupboard = LibraryCupboard.query.get(cupboard_id)
    if not cupboard:
        return jsonify({'error': 'Selected cupboard does not exist'}), 404

    name = (data.get('shelf_name') or '').strip()
    if not name:
        return jsonify({'error': 'Shelf name is required'}), 400

    code = (data.get('shelf_code') or '').strip()
    if not code:
        count = cupboard.shelves.count()
        code = f"SH-{count + 1:02d}"

    existing = LibraryShelf.query.filter_by(cupboard_id=cupboard_id, shelf_code=code).first()
    if existing:
        return jsonify({'error': f'Shelf code "{code}" already exists in {cupboard.cupboard_name}'}), 400

    shelf = LibraryShelf(
        cupboard_id=cupboard_id,
        shelf_code=code,
        shelf_name=name,
        description=data.get('description') or None,
        is_active=data.get('is_active', True)
    )
    db.session.add(shelf)
    db.session.commit()
    return jsonify(shelf.to_dict()), 201


@books_bp.route('/locations/shelves/<int:shelf_id>', methods=['PUT'])
@jwt_required()
@permission_required('book.edit')
def update_shelf(shelf_id):
    """Update an existing shelf"""
    shelf = LibraryShelf.query.get(shelf_id)
    if not shelf:
        return jsonify({'error': 'Shelf not found'}), 404

    data = request.get_json() or {}
    if 'cupboard_id' in data:
        cid = _to_int(data['cupboard_id'])
        if cid and cid != shelf.cupboard_id:
            c = LibraryCupboard.query.get(cid)
            if not c:
                return jsonify({'error': 'Target cupboard does not exist'}), 404
            shelf.cupboard_id = cid

    if 'shelf_code' in data:
        code = (data.get('shelf_code') or '').strip()
        if code:
            existing = LibraryShelf.query.filter(
                LibraryShelf.shelf_id != shelf_id,
                LibraryShelf.cupboard_id == shelf.cupboard_id,
                LibraryShelf.shelf_code == code
            ).first()
            if existing:
                return jsonify({'error': f'Shelf code "{code}" already exists in this cupboard'}), 400
            shelf.shelf_code = code

    if 'shelf_name' in data:
        name = (data.get('shelf_name') or '').strip()
        if name:
            shelf.shelf_name = name

    if 'description' in data:
        shelf.description = data.get('description') or None
    if 'is_active' in data:
        shelf.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify(shelf.to_dict()), 200


@books_bp.route('/locations/shelves/<int:shelf_id>', methods=['DELETE'])
@jwt_required()
@permission_required('book.delete')
def delete_shelf(shelf_id):
    """Deactivate or delete shelf if no books are assigned"""
    shelf = LibraryShelf.query.get(shelf_id)
    if not shelf:
        return jsonify({'error': 'Shelf not found'}), 404

    copy_count = BookCopy.query.filter_by(shelf_id=shelf_id).count()
    if copy_count > 0:
        shelf.is_active = False
        db.session.commit()
        return jsonify({'message': f'Shelf "{shelf.shelf_name}" has {copy_count} books assigned. It has been deactivated.'}), 200

    name = shelf.shelf_name
    db.session.delete(shelf)
    db.session.commit()
    return jsonify({'message': f'Shelf "{name}" deleted successfully'}), 200


@books_bp.route('/locations/shelves/<int:shelf_id>/activate', methods=['POST'])
@jwt_required()
@permission_required('book.edit')
def activate_shelf(shelf_id):
    """Activate a deactivated shelf"""
    shelf = LibraryShelf.query.get(shelf_id)
    if not shelf:
        return jsonify({'error': 'Shelf not found'}), 404
    shelf.is_active = True
    db.session.commit()
    return jsonify(shelf.to_dict()), 200

