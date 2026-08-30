from app import db
from datetime import datetime, timedelta

class SubscriptionPlan(db.Model):
    """Subscription Plan Model - Stores library subscription plans"""
    __tablename__ = 'subscription_plans'
    
    subscription_plan_id = db.Column(db.Integer, primary_key=True)
    plan_name = db.Column(db.String(50), unique=True, nullable=False)
    plan_code = db.Column(db.String(20), unique=True, nullable=True)
    max_books = db.Column(db.Integer, default=1, nullable=False)
    duration_months = db.Column(db.Integer, nullable=False)
    price = db.Column(db.DECIMAL(10, 2), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - Use unique backref name
    subscriptions = db.relationship('StudentSubscription', backref='plan_ref', lazy='dynamic')
    
    def __repr__(self):
        return f'<SubscriptionPlan {self.plan_name} - {self.price}>'
    
    def to_dict(self):
        return {
            'subscription_plan_id': self.subscription_plan_id,
            'plan_name': self.plan_name,
            'plan_code': self.plan_code,
            'max_books': self.max_books,
            'duration_months': self.duration_months,
            'price': float(self.price),
            'is_active': self.is_active,
            'description': self.description,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    @classmethod
    def get_active_plans(cls):
        """Get all active subscription plans"""
        return cls.query.filter_by(is_active=True).all()


class StudentSubscription(db.Model):
    """Student Subscription Model - Links students to subscription plans"""
    __tablename__ = 'student_subscriptions'
    
    subscription_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    subscription_plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.subscription_plan_id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.academic_year_id'), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'), default='PENDING')
    amount_paid = db.Column(db.DECIMAL(10, 2), nullable=True)
    payment_date = db.Column(db.Date, nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    payment_proof_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    academic_year_ref = db.relationship('AcademicYear', foreign_keys=[academic_year_id])
    
    def __repr__(self):
        return f'<StudentSubscription {self.subscription_id} - {self.status}>'
    
    def to_dict(self):
        return {
            'subscription_id': self.subscription_id,
            'student_id': self.student_id,
            'student_uid': self.student_ref.student_uid if self.student_ref else None,
            'student_name': self.student_ref.student_name if self.student_ref else None,
            'plan': self.plan_ref.to_dict() if self.plan_ref else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year_ref.to_dict_brief() if self.academic_year_ref else None,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'status': self.status,
            'is_active': self.status == 'ACTIVE',
            'is_expired': self.is_expired(),
            'days_remaining': self.get_days_remaining(),
            'amount_paid': float(self.amount_paid) if self.amount_paid else None,
            'payment_date': self.payment_date.strftime('%Y-%m-%d') if self.payment_date else None,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'payment_proof_url': self.payment_proof_url,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def is_expired(self):
        """Check if the subscription has expired"""
        if self.status == 'ACTIVE':
            return self.end_date < datetime.now().date()
        return False
    
    def get_days_remaining(self):
        """Get number of days remaining in the subscription"""
        if self.status != 'ACTIVE':
            return 0
        if self.is_expired():
            return 0
        return (self.end_date - datetime.now().date()).days
    
    @classmethod
    def get_active_subscriptions(cls):
        """Get all active subscriptions"""
        return cls.query.filter_by(status='ACTIVE').all()
    
    @classmethod
    def get_expired_subscriptions(cls):
        """Get expired subscriptions"""
        today = datetime.now().date()
        return cls.query.filter(
            cls.status == 'ACTIVE',
            cls.end_date < today
        ).all()
    
    @classmethod
    def get_student_active(cls, student_id):
        """Get active subscription for a student"""
        return cls.query.filter_by(
            student_id=student_id,
            status='ACTIVE'
        ).first()
    
    def renew(self, plan_id=None, duration_months=None, amount=None):
        """Renew a subscription"""
        if plan_id:
            self.subscription_plan_id = plan_id
            plan = SubscriptionPlan.query.get(plan_id)
            if plan:
                duration_months = plan.duration_months
        
        if duration_months:
            self.start_date = datetime.now().date()
            self.end_date = self.start_date + timedelta(days=duration_months * 30)
            self.status = 'ACTIVE'
        
        if amount:
            self.amount_paid = amount
            self.payment_date = datetime.now().date()
        
        db.session.commit()
        return self
