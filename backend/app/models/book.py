from app import db  # type: ignore
from datetime import datetime

class BookLevel(db.Model):  # type: ignore
    """Book Level Model - Stores book reading levels"""
    __tablename__ = 'book_levels'
    
    level_id = db.Column(db.Integer, primary_key=True)
    level_code = db.Column(db.String(20), unique=True, nullable=False)
    level_name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BookLevel {self.level_code}>'
    
    def to_dict(self):
        return {
            'level_id': self.level_id,
            'level_code': self.level_code,
            'level_name': self.level_name,
            'description': self.description,
            'sort_order': self.sort_order,
            'is_active': self.is_active
        }
    
    @classmethod
    def get_active_levels(cls):
        """Get all active book levels"""
        return cls.query.filter_by(is_active=True).order_by(cls.sort_order).all()


class BookLevelSequence(db.Model):  # type: ignore
    """Book Level Sequence Model - Tracks highest sequence per book level for ID generation"""
    __tablename__ = 'book_level_sequences'
    
    level_id = db.Column(db.Integer, primary_key=True)
    last_sequence = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EBookLevelSequence(db.Model):  # type: ignore
    """E-Book Level Sequence Model - Tracks highest sequence per book reading level for E-Book ID generation"""
    __tablename__ = 'ebook_level_sequences'

    level_id = db.Column(db.Integer, primary_key=True)
    last_sequence = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)




class BookCategory(db.Model):  # type: ignore
    """Book Category Model - Stores book categories"""
    __tablename__ = 'book_categories'
    
    category_id = db.Column(db.Integer, primary_key=True)
    category_code = db.Column(db.String(20), unique=True, nullable=False)
    category_name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BookCategory {self.category_code}>'
    
    def to_dict(self):
        return {
            'category_id': self.category_id,
            'category_code': self.category_code,
            'category_name': self.category_name,
            'description': self.description,
            'is_active': self.is_active
        }
    
    @classmethod
    def get_active_categories(cls):
        """Get all active book categories"""
        return cls.query.filter_by(is_active=True).order_by(cls.category_id.asc()).all()


class BookTitle(db.Model):  # type: ignore
    """Book Title Model - Stores book information (master record)"""
    __tablename__ = 'book_titles'
    
    book_title_id = db.Column(db.Integer, primary_key=True)
    e_book_id = db.Column(db.String(50), unique=True, nullable=True, index=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    isbn = db.Column(db.String(20), nullable=True)
    level_id = db.Column(db.Integer, db.ForeignKey('book_levels.level_id'), nullable=True)
    mrp = db.Column(db.DECIMAL(10, 2), nullable=True)
    ebook_count = db.Column(db.Integer, nullable=False, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('book_categories.category_id'), nullable=True)
    publication_year = db.Column(db.Integer, nullable=True)
    publisher = db.Column(db.String(100), nullable=True)
    purchase_year = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    cover_image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Explicit Relationships for static typing and IDE resolution
    level_ref = db.relationship('BookLevel', foreign_keys=[level_id])  # type: ignore
    category_ref = db.relationship('BookCategory', foreign_keys=[category_id])  # type: ignore
    copies = db.relationship('BookCopy', backref='title_ref', lazy='dynamic', cascade='all, delete-orphan')  # type: ignore
    
    def __repr__(self):
        return f'<BookTitle {self.title}>'
    
    def to_dict(self):
        """Convert to dictionary with inventory summary"""
        total_copies = self.copies.count()
        available_copies = self.copies.filter_by(status='AVAILABLE').count()
        issued_copies = self.copies.filter_by(status='ISSUED').count()
        damaged_copies = self.copies.filter_by(status='DAMAGED').count()
        lost_copies = self.copies.filter_by(status='LOST').count()
        
        all_copies = [c.to_dict() for c in self.copies.order_by(BookCopy.copy_number).all()] # type: ignore
        level_obj = getattr(self, 'level_ref', None)
        category_obj = getattr(self, 'category_ref', None)
        return {
            'book_title_id': self.book_title_id,
            'e_book_id': self.e_book_id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'level_id': self.level_id,
            'category_id': self.category_id,
            'level': level_obj.to_dict() if level_obj else None,
            'reading_level': level_obj.level_name if level_obj else None,
            'level_name': level_obj.level_name if level_obj else None,
            'level_code': level_obj.level_code if level_obj else None,
            'mrp': float(self.mrp) if self.mrp is not None else None,
            'ebook_count': int(self.ebook_count or 0),
            'category': category_obj.to_dict() if category_obj else None,
            'category_name': category_obj.category_name if category_obj else None,
            'publication_year': self.publication_year,
            'publish_year': self.publication_year,
            'publisher': self.publisher,
            'purchase_year': self.purchase_year,
            'description': self.description,
            'cover_image': self.cover_image,
            'copies': all_copies,
            'inventory': {
                'total_copies': total_copies,
                'available': available_copies,
                'issued': issued_copies,
                'damaged': damaged_copies,
                'lost': lost_copies
            },
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def to_dict_brief(self):
        return {
            'book_title_id': self.book_title_id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'mrp': float(self.mrp) if self.mrp is not None else None
            ,'ebook_count': int(self.ebook_count or 0)
        }
    
    @classmethod
    def search(cls, query):
        """Search books by title, author, or ISBN"""
        return cls.query.filter(
            db.or_(
                cls.title.like(f'%{query}%'),
                cls.author.like(f'%{query}%'),
                cls.isbn.like(f'%{query}%')
            )
        ).all()


class LibraryCupboard(db.Model):  # type: ignore
    """Library Cupboard Model - Stores cupboards/bookcases for physical library storage"""
    __tablename__ = 'library_cupboards'

    cupboard_id = db.Column(db.Integer, primary_key=True)
    cupboard_code = db.Column(db.String(50), unique=True, nullable=False)
    cupboard_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shelves = db.relationship('LibraryShelf', backref='cupboard_ref', lazy='dynamic', cascade='all, delete-orphan')  # type: ignore

    def __repr__(self):
        return f'<LibraryCupboard {self.cupboard_code}: {self.cupboard_name}>'

    def to_dict(self, include_shelves=True):
        data = {
            'cupboard_id': self.cupboard_id,
            'cupboard_code': self.cupboard_code,
            'cupboard_name': self.cupboard_name,
            'description': self.description,
            'is_active': self.is_active,
            'shelves_count': self.shelves.count(),
            'active_shelves_count': self.shelves.filter_by(is_active=True).count(),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
        if include_shelves:
            data['shelves'] = [s.to_dict() for s in self.shelves.order_by(LibraryShelf.shelf_name.asc()).all()]
        return data


class LibraryShelf(db.Model):  # type: ignore
    """Library Shelf Model - Stores shelves belonging to a specific cupboard"""
    __tablename__ = 'library_shelves'
    __table_args__ = (
        db.UniqueConstraint('cupboard_id', 'shelf_code', name='uq_cupboard_shelf_code'),
    )

    shelf_id = db.Column(db.Integer, primary_key=True)
    cupboard_id = db.Column(db.Integer, db.ForeignKey('library_cupboards.cupboard_id'), nullable=False)
    shelf_code = db.Column(db.String(50), nullable=False)
    shelf_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<LibraryShelf {self.shelf_code}: {self.shelf_name}>'

    def to_dict(self):
        cupboard = getattr(self, 'cupboard_ref', None)
        return {
            'shelf_id': self.shelf_id,
            'cupboard_id': self.cupboard_id,
            'cupboard_code': cupboard.cupboard_code if cupboard else None,
            'cupboard_name': cupboard.cupboard_name if cupboard else None,
            'shelf_code': self.shelf_code,
            'shelf_name': self.shelf_name,
            'description': self.description,
            'is_active': self.is_active,
            'display_location': f"{cupboard.cupboard_name} / {self.shelf_name}" if cupboard else self.shelf_name,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }


class BookCopy(db.Model):  # type: ignore
    """Book Copy Model - Stores individual physical copies of books"""
    __tablename__ = 'book_copies'
    
    book_copy_id = db.Column(db.Integer, primary_key=True)
    book_title_id = db.Column(db.Integer, db.ForeignKey('book_titles.book_title_id'), nullable=False)
    copy_number = db.Column(db.Integer, default=1)
    barcode = db.Column(db.String(50), unique=True, nullable=True)
    accession_number = db.Column(db.String(50), unique=True, nullable=True)
    purchase_year = db.Column(db.Integer, nullable=True)
    purchase_price = db.Column(db.DECIMAL(10, 2), nullable=True)
    condition = db.Column(db.Enum('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'), default='NEW')
    current_condition = db.Column(db.String(20), default='Good', nullable=False)
    status = db.Column(db.Enum('AVAILABLE', 'ISSUED', 'DAMAGED', 'LOST', 'RESERVED'), default='AVAILABLE')
    cupboard_id = db.Column(db.Integer, db.ForeignKey('library_cupboards.cupboard_id'), nullable=True)
    shelf_id = db.Column(db.Integer, db.ForeignKey('library_shelves.shelf_id'), nullable=True)
    location = db.Column(db.String(100), nullable=True, comment='Shelf location text')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    issues = db.relationship('BookIssue', backref='copy_ref', lazy='dynamic')  # type: ignore
    cupboard_ref = db.relationship('LibraryCupboard', foreign_keys=[cupboard_id])  # type: ignore
    shelf_ref = db.relationship('LibraryShelf', foreign_keys=[shelf_id])  # type: ignore
    
    def __repr__(self):
        return f'<BookCopy {self.barcode}>'
    
    def to_dict(self):
        title_obj = getattr(self, 'title_ref', None)
        level_obj = getattr(title_obj, 'level_ref', None) if title_obj else None
        cupboard_obj = getattr(self, 'cupboard_ref', None)
        shelf_obj = getattr(self, 'shelf_ref', None)

        formatted_loc = self.location
        if cupboard_obj and shelf_obj:
            formatted_loc = f"{cupboard_obj.cupboard_name} / {shelf_obj.shelf_name}"
        elif shelf_obj:
            formatted_loc = shelf_obj.shelf_name

        return {
            'book_copy_id': self.book_copy_id,
            'book_title_id': self.book_title_id,
            'title': title_obj.title if title_obj else None,
            'author': title_obj.author if title_obj else None,
            'isbn': title_obj.isbn if title_obj else None,
            'mrp': float(title_obj.mrp) if title_obj and title_obj.mrp is not None else None,
            'level_name': level_obj.level_name if level_obj else None,
            'level_code': level_obj.level_code if level_obj else None,
            'copy_number': self.copy_number,
            'barcode': self.barcode,
            'accession_number': self.accession_number,
            'purchase_year': self.purchase_year,
            'purchase_price': float(self.purchase_price) if self.purchase_price else None,
            'condition': self.condition,
            'current_condition': self.current_condition or 'Good',
            'status': self.status,
            'cupboard_id': self.cupboard_id,
            'shelf_id': self.shelf_id,
            'cupboard_name': cupboard_obj.cupboard_name if cupboard_obj else None,
            'shelf_name': shelf_obj.shelf_name if shelf_obj else None,
            'location': formatted_loc or 'Main Shelf',
            'notes': self.notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    @classmethod
    def get_available_copies(cls):
        """Get all available book copies"""
        return cls.query.filter_by(status='AVAILABLE').all()
    
    @classmethod
    def get_by_barcode(cls, barcode):
        """Get a book copy by barcode"""
        return cls.query.filter_by(barcode=barcode).first()
