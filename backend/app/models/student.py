from app import db
from datetime import datetime

class Student(db.Model):
    """Student Model - Stores student information (permanent record)"""
    __tablename__ = 'students'
    
    student_id = db.Column(db.Integer, primary_key=True)
    student_uid = db.Column(db.String(20), unique=True, nullable=False, comment='Permanent ID: STU0001')
    student_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.Enum('MALE', 'FEMALE', 'OTHER'), nullable=True)
    school_name = db.Column(db.String(100), default='Kinder Park')
    student_email = db.Column(db.String(100), nullable=True, comment='Email supplied on membership registration')
    mother_name = db.Column(db.String(100), nullable=True)
    mother_phone = db.Column(db.String(20), nullable=True)
    mother_email = db.Column(db.String(100), nullable=True)
    father_name = db.Column(db.String(100), nullable=True)
    father_phone = db.Column(db.String(20), nullable=True)
    father_email = db.Column(db.String(100), nullable=True)
    address = db.Column(db.Text, nullable=True)
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    medical_notes = db.Column(db.Text, nullable=True)
    library_access = db.Column(db.Boolean, default=True, comment='Whether student has access to borrow library books')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - Use unique backref names
    enrollments = db.relationship('StudentEnrollment', backref='student_ref', lazy='dynamic', cascade='all, delete-orphan')
    issues = db.relationship('BookIssue', backref='student_ref', lazy='dynamic')
    subscriptions = db.relationship('StudentSubscription', backref='student_ref', lazy='dynamic')
    damage_records = db.relationship('DamageLossRecord', backref='student_ref', lazy='dynamic')
    
    def __repr__(self):
        return f'<Student {self.student_uid} - {self.student_name}>'
    
    def to_dict(self):
        """Convert to dictionary with full details"""
        deposit_account = None
        if hasattr(self, 'deposit_account_ref') and self.deposit_account_ref:
            ref = self.deposit_account_ref
            deposit_account = ref[0] if isinstance(ref, (list, tuple)) or hasattr(ref, '__iter__') else ref
        
        active_sub = self.get_active_subscription()
        max_books = active_sub.get('plan', {}).get('max_books', 0) if active_sub else 0
        current_issued = self.issues.filter(db.text("status IN ('ACTIVE', 'OVERDUE')")).count()
        
        return {
            'student_id': self.student_id,
            'student_uid': self.student_uid,
            'student_name': self.student_name,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'age': self.get_age(),
            'gender': self.gender,
            'school_name': self.school_name,
            'student_email': self.student_email,
            'mother_name': self.mother_name,
            'mother_phone': self.mother_phone,
            'mother_email': self.mother_email,
            'father_name': self.father_name,
            'father_phone': self.father_phone,
            'father_email': self.father_email,
            'address': self.address,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'medical_notes': self.medical_notes,
            'library_access': self.library_access if self.library_access is not None else True,
            'is_active': self.is_active,
            'enrollments': [e.to_dict() for e in self.enrollments],
            'current_enrollment': self.get_current_enrollment(),
            'deposit_balance': float(deposit_account.current_balance) if deposit_account and hasattr(deposit_account, 'current_balance') else 0,
            'outstanding_balance': float(getattr(deposit_account, 'outstanding_balance', 0)) if deposit_account else 0,
            'active_subscription': active_sub,
            'max_books_allowed': max_books,
            'current_books_issued': current_issued,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def to_dict_brief(self):
        """Convert to brief dictionary for list views"""
        deposit_account = None
        if hasattr(self, 'deposit_account_ref') and self.deposit_account_ref:
            ref = self.deposit_account_ref
            deposit_account = ref[0] if isinstance(ref, (list, tuple)) or hasattr(ref, '__iter__') else ref
            
        active_sub = self.get_active_subscription()
        max_books = active_sub.get('plan', {}).get('max_books', 0) if active_sub else 0
        current_issued = self.issues.filter(db.text("status IN ('ACTIVE', 'OVERDUE')")).count()

        return {
            'student_id': self.student_id,
            'student_uid': self.student_uid,
            'student_name': self.student_name,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'age': self.get_age(),
            'current_enrollment': self.get_current_enrollment_brief(),
            'library_access': self.library_access if self.library_access is not None else True,
            'deposit_balance': float(deposit_account.current_balance) if deposit_account and hasattr(deposit_account, 'current_balance') else 0,
            'outstanding_balance': float(getattr(deposit_account, 'outstanding_balance', 0)) if deposit_account else 0,
            'active_subscription': active_sub,
            'max_books_allowed': max_books,
            'current_books_issued': current_issued,
            'is_active': self.is_active
        }
    
    def get_age(self):
        """Calculate student's age"""
        if not self.date_of_birth:
            return None
        today = datetime.now().date()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def get_current_enrollment(self):
        """Get current active enrollment"""
        enrollment = self.enrollments.filter_by(status='ACTIVE').first()
        return enrollment.to_dict() if enrollment else None
    
    def get_current_enrollment_brief(self):
        """Get current active enrollment (brief)"""
        enrollment = self.enrollments.filter_by(status='ACTIVE').first()
        if enrollment:
            return {
                'academic_year': enrollment.academic_year.year_code if enrollment.academic_year else None,
                'programme': enrollment.programme.programme_name if enrollment.programme else None,
                'roll_number': enrollment.roll_number,
                'grade': enrollment.grade
            }
        return None
    
    def get_active_subscription(self):
        """Get active subscription"""
        from app.models.subscription import StudentSubscription
        subscription = StudentSubscription.query.filter_by(
            student_id=self.student_id,
            status='ACTIVE'
        ).first()
        return subscription.to_dict() if subscription else None
    
    @classmethod
    def generate_uid(cls):
        """Generate a permanent, human-readable student number.

        The database unique constraint remains the final safeguard.  This uses
        the largest existing KP number rather than the current database id, so
        deleting a student can never cause an old number to be reused.
        """
        existing_numbers = [
            int(student_uid[3:])
            for (student_uid,) in cls.query.with_entities(cls.student_uid).all()
            if student_uid and student_uid.startswith('STU') and student_uid[3:].isdigit()
        ]
        return f"STU{(max(existing_numbers, default=0) + 1):04d}"

    @classmethod
    def generate_roll_number(cls, academic_year, programme):
        '''Generate YY + programme code + 4-digit sequence, e.g. 26FLY0001.'''
        from app.models.academic import StudentEnrollment
        year_digits = ''.join(c for c in (academic_year.year_code or '') if c.isdigit())
        year_prefix = year_digits[2:4] if len(year_digits) >= 4 else (year_digits[:2] if len(year_digits) >= 2 else str(datetime.now().year)[-2:])
        programme_prefix = ''.join(c for c in (programme.programme_code or programme.programme_name or '').upper() if c.isalnum()) or 'GEN'
        prefix = f'{year_prefix}{programme_prefix}'
        existing = StudentEnrollment.query.filter(
            StudentEnrollment.academic_year_id == academic_year.academic_year_id,
            StudentEnrollment.programme_id == programme.programme_id,
            StudentEnrollment.roll_number.like(f'{prefix}%')
        ).all()
        sequence = max((int(row.roll_number[len(prefix):]) for row in existing if row.roll_number and row.roll_number[len(prefix):].isdigit()), default=0) + 1
        return f'{prefix}{sequence:04d}'
    
    @classmethod
    def search_students(cls, query):
        """Search permanent student records by ID, name, or contact details."""
        return cls.query.filter(
            db.or_(
                cls.student_name.like(f'%{query}%'),
                cls.student_uid.like(f'%{query}%'),
                cls.mother_phone.like(f'%{query}%'),
                cls.father_phone.like(f'%{query}%'),
                cls.mother_email.like(f'%{query}%'),
                cls.father_email.like(f'%{query}%')
            )
        ).limit(20).all()

    @classmethod
    def find_duplicate_candidates(cls, data, exclude_student_id=None):
        """Find student masters sharing a supplied reliable identifier.

        Parent contacts are the contact fields currently stored by this LMS.
        A matching contact or an exact name/date-of-birth pair is treated as a
        possible duplicate and must be selected as an old student instead of
        creating another master record.
        """
        contact_fields = ('student_email', 'mother_phone', 'father_phone', 'mother_email', 'father_email')
        conditions = []
        for field in contact_fields:
            value = str(data.get(field) or '').strip()
            if value:
                column = getattr(cls, field)
                conditions.append(db.func.lower(column) == value.lower())

        name = str(data.get('student_name') or '').strip()
        dob = data.get('date_of_birth')
        if name and dob:
            try:
                dob = datetime.strptime(str(dob).split('T')[0], '%Y-%m-%d').date()
                conditions.append(db.and_(db.func.lower(cls.student_name) == name.lower(), cls.date_of_birth == dob))
            except ValueError:
                pass

        if not conditions:
            return []
        query = cls.query.filter(db.or_(*conditions))
        if exclude_student_id:
            query = query.filter(cls.student_id != exclude_student_id)
        return query.order_by(cls.student_name).all()
