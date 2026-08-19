from app import db
from datetime import datetime, timedelta

class BookIssue(db.Model):
    """Book Issue Model - Records book issues to students"""
    __tablename__ = 'book_issues'
    
    issue_id = db.Column(db.Integer, primary_key=True)
    book_copy_id = db.Column(db.Integer, db.ForeignKey('book_copies.book_copy_id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('student_enrollments.enrollment_id'), nullable=True)
    issue_date = db.Column(db.Date, nullable=False)
    issue_time = db.Column(db.Time, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    expected_return_date = db.Column(db.Date, nullable=True)
    issued_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    status = db.Column(db.Enum('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST'), default='ACTIVE')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enrollment = db.relationship('StudentEnrollment', backref='issues')
    issuer = db.relationship('User', backref='issued_books', foreign_keys=[issued_by])
    returns = db.relationship('BookReturn', backref='issue', uselist=False, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<BookIssue {self.issue_id} - {self.status}>'
    
    def to_dict(self):
        return {
            'issue_id': self.issue_id,
            'book_copy_id': self.book_copy_id,
            'book_barcode': self.copy_ref.barcode if self.copy_ref else None,
            'book_isbn': self.copy_ref.title_ref.isbn if self.copy_ref and self.copy_ref.title_ref else None,
            'book_title': self.copy_ref.title_ref.title if self.copy_ref and self.copy_ref.title_ref else None,
            'book_author': self.copy_ref.title_ref.author if self.copy_ref and self.copy_ref.title_ref else None,
            'student_id': self.student_id,
            'student_uid': self.student_ref.student_uid if self.student_ref else None,
            'student_name': self.student_ref.student_name if self.student_ref else None,
            'enrollment_id': self.enrollment_id,
            'issue_date': self.issue_date.strftime('%Y-%m-%d') if self.issue_date else None,
            'issue_time': self.issue_time.strftime('%H:%M') if self.issue_time else None,
            'due_date': self.due_date.strftime('%Y-%m-%d') if self.due_date else None,
            'expected_return_date': self.expected_return_date.strftime('%Y-%m-%d') if self.expected_return_date else None,
            'issued_by': self.issued_by,
            'issued_by_name': self.issuer.username if self.issuer else None,
            'status': self.status,
            'return_details': self.returns.to_dict() if self.returns else None,
            'is_overdue': self.is_overdue(),
            'days_overdue': self.get_days_overdue(),
            'notes': self.notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def is_overdue(self):
        """Check if the book is overdue"""
        if self.status in ['RETURNED', 'LOST']:
            return False
        return self.due_date < datetime.now().date()
    
    def get_days_overdue(self):
        """Get number of days overdue"""
        if not self.is_overdue():
            return 0
        return (datetime.now().date() - self.due_date).days
    
    @classmethod
    def get_active_issues(cls):
        """Get all active issues"""
        return cls.query.filter(cls.status.in_(['ACTIVE', 'OVERDUE'])).all()
    
    @classmethod
    def get_overdue_issues(cls):
        """Get all overdue issues"""
        today = datetime.now().date()
        return cls.query.filter(
            cls.due_date < today,
            cls.status.in_(['ACTIVE', 'OVERDUE'])
        ).all()


class BookReturn(db.Model):
    """Book Return Model - Records book returns"""
    __tablename__ = 'book_returns'
    
    return_id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(db.Integer, db.ForeignKey('book_issues.issue_id'), nullable=False, unique=True)
    return_date = db.Column(db.Date, nullable=False)
    return_time = db.Column(db.Time, nullable=False)
    received_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    condition_returned = db.Column(db.Enum('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'), default='GOOD')
    is_damaged = db.Column(db.Boolean, default=False)
    is_lost = db.Column(db.Boolean, default=False)
    fine_amount = db.Column(db.DECIMAL(10, 2), default=0.00)
    damage_charge = db.Column(db.DECIMAL(10, 2), default=0.00)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    receiver = db.relationship('User', backref='received_book_refs', foreign_keys=[received_by])
    
    def __repr__(self):
        return f'<BookReturn {self.return_id} - {self.issue_id}>'
    
    def to_dict(self):
        return {
            'return_id': self.return_id,
            'issue_id': self.issue_id,
            'return_date': self.return_date.strftime('%Y-%m-%d') if self.return_date else None,
            'return_time': self.return_time.strftime('%H:%M') if self.return_time else None,
            'received_by': self.received_by,
            'received_by_name': self.receiver.username if self.receiver else None,
            'condition_returned': self.condition_returned,
            'is_damaged': self.is_damaged,
            'is_lost': self.is_lost,
            'fine_amount': float(self.fine_amount),
            'damage_charge': float(self.damage_charge),
            'total_charge': float(self.fine_amount + self.damage_charge),
            'notes': self.notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None
        }
    
    @classmethod
    def get_today_returns(cls):
        """Get today's returns"""
        today = datetime.now().date()
        return cls.query.filter_by(return_date=today).all()


class DamageLossRecord(db.Model):
    """Damage/Loss Record Model - Records book damage or loss incidents"""
    __tablename__ = 'damage_loss_records'
    
    record_id = db.Column(db.Integer, primary_key=True)
    book_copy_id = db.Column(db.Integer, db.ForeignKey('book_copies.book_copy_id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    issue_id = db.Column(db.Integer, db.ForeignKey('book_issues.issue_id'), nullable=True)
    record_type = db.Column(db.Enum('DAMAGE', 'LOSS'), nullable=False)
    severity = db.Column(db.Enum('SMALL', 'LARGE', 'DEFAULT'), default='DEFAULT')
    charge_amount = db.Column(db.DECIMAL(10, 2), nullable=False)
    description = db.Column(db.Text, nullable=True)
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    deposit_transaction_id = db.Column(db.Integer, db.ForeignKey('deposit_transactions.transaction_id'), nullable=True)
    status = db.Column(db.Enum('PENDING', 'CHARGED', 'WAIVED'), default='PENDING')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    book_copy = db.relationship('BookCopy', backref='damage_records')
    issue = db.relationship('BookIssue', backref='damage_records')
    recorder = db.relationship('User', backref='recorded_damage_records', foreign_keys=[recorded_by])
    deposit_transaction = db.relationship('DepositTransaction', backref='damage_record')
    
    def __repr__(self):
        return f'<DamageLossRecord {self.record_id} - {self.record_type}>'
    
    def to_dict(self):
        return {
            'record_id': self.record_id,
            'book_copy_id': self.book_copy_id,
            'book_barcode': self.book_copy.barcode if self.book_copy else None,
            'book_title': self.book_copy.title_ref.title if self.book_copy and self.book_copy.title_ref else None,
            'student_id': self.student_id,
            'student_uid': self.student_ref.student_uid if self.student_ref else None,
            'student_name': self.student_ref.student_name if self.student_ref else None,
            'issue_id': self.issue_id,
            'record_type': self.record_type,
            'severity': self.severity,
            'charge_amount': float(self.charge_amount),
            'description': self.description,
            'recorded_by': self.recorded_by,
            'recorded_by_name': self.recorder.username if self.recorder else None,
            'deposit_transaction_id': self.deposit_transaction_id,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }