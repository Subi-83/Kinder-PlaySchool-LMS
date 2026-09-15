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
    subscription_fee = db.Column(db.DECIMAL(10, 2), default=0.00, nullable=False)
    fixed_deposit = db.Column(db.DECIMAL(10, 2), default=0.00, nullable=False)
    total_amount = db.Column(db.DECIMAL(10, 2), default=0.00, nullable=False)
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
            'price': float(self.price or self.total_amount or 0),
            'subscription_fee': float(self.subscription_fee or 0),
            'fixed_deposit': float(self.fixed_deposit or 0),
            'total_amount': float(self.total_amount or self.price or 0),
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
    subscription_fee_paid = db.Column(db.DECIMAL(10, 2), nullable=True)
    deposit_paid = db.Column(db.DECIMAL(10, 2), nullable=True)
    total_paid = db.Column(db.DECIMAL(10, 2), nullable=True)
    is_custom_plan = db.Column(db.Boolean, default=False, nullable=False)
    custom_subscription_fee = db.Column(db.DECIMAL(10, 2), nullable=True)
    custom_deposit_amount = db.Column(db.DECIMAL(10, 2), nullable=True)
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
        is_custom = bool(self.is_custom_plan or (self.plan_ref and self.plan_ref.plan_code == 'CUSTOM'))
        sub_fee = float(self.subscription_fee_paid) if self.subscription_fee_paid is not None else (
            float(self.custom_subscription_fee) if self.custom_subscription_fee is not None else (
                float(self.plan_ref.subscription_fee) if self.plan_ref else (float(self.amount_paid) if self.amount_paid is not None else 0.0)
            )
        )
        dep_paid = float(self.deposit_paid) if self.deposit_paid is not None else (
            float(self.custom_deposit_amount) if self.custom_deposit_amount is not None else (
                float(self.plan_ref.fixed_deposit) if self.plan_ref else 0.0
            )
        )
        total = float(self.total_paid) if self.total_paid is not None else (
            float(self.amount_paid) if self.amount_paid is not None else (sub_fee + dep_paid)
        )

        plan_data = self.plan_ref.to_dict() if self.plan_ref else None
        if is_custom:
            if not plan_data:
                plan_data = {'plan_name': 'Customized Plan', 'plan_code': 'CUSTOM'}
            else:
                plan_data = dict(plan_data)
                plan_data['plan_name'] = 'Customized Plan'
                plan_data['subscription_fee'] = sub_fee
                plan_data['fixed_deposit'] = dep_paid
                plan_data['total_amount'] = total

        return {
            'subscription_id': self.subscription_id,
            'student_id': self.student_id,
            'student_uid': self.student_ref.student_uid if self.student_ref else None,
            'student_name': self.student_ref.student_name if self.student_ref else None,
            'plan': plan_data,
            'plan_display_name': 'Customized Plan' if is_custom else (self.plan_ref.plan_name if self.plan_ref else 'Standard Plan'),
            'is_custom_plan': is_custom,
            'custom_subscription_fee': float(self.custom_subscription_fee) if self.custom_subscription_fee is not None else None,
            'custom_deposit_amount': float(self.custom_deposit_amount) if self.custom_deposit_amount is not None else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year_ref.to_dict_brief() if self.academic_year_ref else None,
            'academic_year_name': self.academic_year_ref.year_name if self.academic_year_ref else (self.academic_year_ref.year_code if self.academic_year_ref else None),
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'status': self.status,
            'is_active': self.status == 'ACTIVE',
            'is_expired': self.is_expired(),
            'days_remaining': self.get_days_remaining(),
            'amount_paid': total,
            'subscription_fee_paid': sub_fee,
            'deposit_paid': dep_paid,
            'total_paid': total,
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
        """Renew a subscription; strictly enforces March 31 academic year end date."""
        if plan_id:
            self.subscription_plan_id = plan_id
            plan = SubscriptionPlan.query.get(plan_id)
            if plan:
                duration_months = plan.duration_months
        
        self.start_date = datetime.now().date()
        if self.academic_year_ref and self.academic_year_ref.end_date:
            self.end_date = self.academic_year_ref.end_date
        else:
            d = self.start_date
            ay_end_year = d.year + 1 if d.month >= 4 else d.year
            from datetime import date
            self.end_date = date(ay_end_year, 3, 31)
        self.status = 'ACTIVE'
        
        if amount:
            self.amount_paid = amount
            self.payment_date = datetime.now().date()
        
        db.session.commit()
        return self
