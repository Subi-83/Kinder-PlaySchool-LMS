from app import db
from datetime import datetime

class AcademicYear(db.Model):
    """Academic Year Model - Stores school academic years"""
    __tablename__ = 'academic_years'
    
    academic_year_id = db.Column(db.Integer, primary_key=True)
    year_code = db.Column(db.String(20), unique=True, nullable=False, comment='2026-27')
    year_name = db.Column(db.String(50), nullable=True, comment='Academic Year 2026-27')
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enrollments = db.relationship('StudentEnrollment', backref='academic_year_ref', lazy='dynamic')
    
    def __repr__(self):
        return f'<AcademicYear {self.year_code}>'
    
    def to_dict(self):
        return {
            'academic_year_id': self.academic_year_id,
            'year_code': self.year_code,
            'year_name': self.year_name,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'is_current': self.is_current,
            'is_active': self.is_active,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def to_dict_brief(self):
        return {
            'academic_year_id': self.academic_year_id,
            'year_code': self.year_code,
            'year_name': self.year_name,
            'is_current': self.is_current
        }
    
    @classmethod
    def get_current(cls):
        """Get the current academic year"""
        return cls.query.filter_by(is_current=True, is_active=True).first()
    
    @classmethod
    def get_active_years(cls):
        """Get all active academic years"""
        return cls.query.filter_by(is_active=True).order_by(cls.year_code.desc()).all()


class Programme(db.Model):
    """Programme Model - Stores academic programmes/classes"""
    __tablename__ = 'programmes'
    
    programme_id = db.Column(db.Integer, primary_key=True)
    programme_name = db.Column(db.String(100), unique=True, nullable=False)
    programme_code = db.Column(db.String(30), unique=True, nullable=True)
    description = db.Column(db.Text, nullable=True)
    grade_level = db.Column(db.String(50), nullable=True, comment='Grade/Level like KG, 1, 2')
    is_active = db.Column(db.Boolean, default=True)
    library_access = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enrollments = db.relationship('StudentEnrollment', backref='programme_ref', lazy='dynamic')
    
    def __repr__(self):
        return f'<Programme {self.programme_name}>'

    @property
    def display_name(self):
        """Joined label for screens that need both separate fields."""
        name = (self.programme_name or '').strip()
        grade = (self.grade_level or '').strip()
        return f'{name} {grade}'.strip() if grade else name
    
    def to_dict(self):
        return {
            'programme_id': self.programme_id,
            'programme_name': self.programme_name,
            'display_name': self.display_name,
            'programme_code': self.programme_code,
            'description': self.description,
            'grade_level': self.grade_level,
            'is_active': self.is_active,
            'library_access': self.library_access,
            'sort_order': self.sort_order,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def to_dict_brief(self):
        return {
            'programme_id': self.programme_id,
            'programme_name': self.programme_name,
            'display_name': self.display_name,
            'programme_code': self.programme_code,
            'grade_level': self.grade_level
        }
    
    @classmethod
    def get_active_programmes(cls):
        """Get all active programmes"""
        return cls.query.filter_by(is_active=True).order_by(cls.sort_order).all()


class StudentEnrollment(db.Model):
    """Student Enrollment Model - Links students to academic years and programmes"""
    __tablename__ = 'student_enrollments'
    __table_args__ = (
        db.UniqueConstraint('student_id', 'academic_year_id', 'programme_id', name='uq_student_year_programme'),
    )
    
    enrollment_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.academic_year_id'), nullable=False)
    programme_id = db.Column(db.Integer, db.ForeignKey('programmes.programme_id'), nullable=False)
    grade = db.Column(db.String(50), nullable=True)
    roll_number = db.Column(db.String(50), nullable=True)
    section = db.Column(db.String(20), nullable=True, comment='A, B, C etc.')
    status = db.Column(db.Enum('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'TRANSFERRED'), default='ACTIVE')
    enrollment_date = db.Column(db.Date, default=datetime.utcnow)
    completion_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    registration_source = db.Column(db.String(30), nullable=True, default='MANUAL')
    library_access = db.Column(db.Boolean, nullable=False, default=False, comment='Library access for this academic year')
    payment_method = db.Column(db.String(100), nullable=True)
    payment_proof_url = db.Column(db.Text, nullable=True)
    payment_qr_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', backref='enrollments_ref', overlaps="enrollments,student_ref")
    academic_year = db.relationship('AcademicYear', overlaps="academic_year_ref,enrollments")
    programme = db.relationship('Programme', overlaps="enrollments,programme_ref")
    
    def __repr__(self):
        return f'<StudentEnrollment {self.student_id} - {self.academic_year_id}>'
    
    def to_dict(self):
        return {
            'enrollment_id': self.enrollment_id,
            'student_id': self.student_id,
            'student_uid': self.student.student_uid if self.student else None,
            'student_name': self.student.student_name if self.student else None,
            'academic_year': self.academic_year.to_dict() if self.academic_year else None,
            'programme': self.programme.to_dict() if self.programme else None,
            'grade': self.grade,
            'roll_number': self.roll_number,
            'section': self.section,
            'status': self.status,
            'enrollment_date': self.enrollment_date.strftime('%Y-%m-%d') if self.enrollment_date else None,
            'completion_date': self.completion_date.strftime('%Y-%m-%d') if self.completion_date else None,
            'notes': self.notes,
            'registration_source': self.registration_source,
            'library_access': self.library_access,
            'payment_method': self.payment_method,
            'payment_proof_url': self.payment_proof_url,
            'payment_qr_url': self.payment_qr_url,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def to_dict_brief(self):
        return {
            'enrollment_id': self.enrollment_id,
            'student_id': self.student_id,
            'academic_year_id': self.academic_year_id,
            'programme_id': self.programme_id,
            'roll_number': self.roll_number,
            'status': self.status
        }
    
    @classmethod
    def get_active_enrollments(cls):
        """Get all active enrollments"""
        return cls.query.filter_by(status='ACTIVE').all()
    
    @classmethod
    def get_enrollments_by_student(cls, student_id):
        """Get all enrollments for a student"""
        return cls.query.filter_by(student_id=student_id).order_by(
            cls.academic_year_id.desc()
        ).all()
    
    @classmethod
    def get_active_enrollment_by_student(cls, student_id):
        """Get active enrollment for a student"""
        return cls.query.filter_by(
            student_id=student_id,
            status='ACTIVE'
        ).first()
    
    @classmethod
    def promote_student(cls, student_id, new_academic_year_id, new_programme_id, new_grade=None):
        """Promote a student to a new academic year"""
        current = cls.get_active_enrollment_by_student(student_id)
        
        if current:
            current.status = 'COMPLETED'
            current.completion_date = datetime.utcnow().date()
        
        new_enrollment = cls(
            student_id=student_id,
            academic_year_id=new_academic_year_id,
            programme_id=new_programme_id,
            grade=new_grade or (current.grade if current else None),
            library_access=current.library_access if current else False,
            status='ACTIVE',
            enrollment_date=datetime.utcnow().date()
        )
        
        db.session.add(new_enrollment)
        db.session.commit()
        
        return new_enrollment


class GradeLevel(db.Model):
    """Grade Level Model - Stores grade/class levels"""
    __tablename__ = 'grade_levels'
    
    grade_id = db.Column(db.Integer, primary_key=True)
    grade_code = db.Column(db.String(10), unique=True, nullable=False, comment='KG, 1, 2, etc.')
    grade_name = db.Column(db.String(50), nullable=False, comment='Kindergarten, Grade 1, etc.')
    description = db.Column(db.Text, nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<GradeLevel {self.grade_code}>'
    
    def to_dict(self):
        return {
            'grade_id': self.grade_id,
            'grade_code': self.grade_code,
            'grade_name': self.grade_name,
            'description': self.description,
            'sort_order': self.sort_order,
            'is_active': self.is_active
        }
    
    @classmethod
    def get_active_grades(cls):
        """Get all active grade levels"""
        return cls.query.filter_by(is_active=True).order_by(cls.sort_order).all()
