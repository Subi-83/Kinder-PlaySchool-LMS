from app import db
from datetime import datetime, timezone

def _utc_now():
    return datetime.now(timezone.utc)

class DepositAccount(db.Model):
    """Deposit Account Model - Stores student deposit accounts"""
    __tablename__ = 'deposit_accounts'
    
    deposit_account_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False, unique=True)
    current_balance = db.Column(db.DECIMAL(10, 2), default=0.00)
    outstanding_balance = db.Column(db.DECIMAL(10, 2), default=0.00)
    minimum_balance = db.Column(db.DECIMAL(10, 2), default=0.00)
    warning_threshold = db.Column(db.DECIMAL(10, 2), default=300.00)
    last_transaction_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=_utc_now)
    updated_at = db.Column(db.DateTime, default=_utc_now, onupdate=_utc_now)
    
    # Relationships - Use unique backref name
    student = db.relationship('Student', backref=db.backref('deposit_account_ref', uselist=False), uselist=False)
    transactions = db.relationship('DepositTransaction', backref='account_ref', lazy='dynamic', cascade='all, delete-orphan')

    
    def __repr__(self):
        return f'<DepositAccount {self.student_id} - {self.current_balance}>'
    
    def to_dict(self):
        active_sub = self.student.get_active_subscription() if self.student else None
        from app.models.subscription import StudentSubscription
        from app.services.settings_service import SettingsService
        warning_threshold = SettingsService.get_float('low_deposit_threshold', 300)
        sub_status = 'NOT_SUBSCRIBED'
        if active_sub:
            sub_status = 'ACTIVE'
        elif self.student and StudentSubscription.query.filter_by(student_id=self.student_id).first():
            sub_status = 'EXPIRED'

        return {
            'deposit_account_id': self.deposit_account_id,
            'student_id': self.student_id,
            'student_uid': self.student.student_uid if self.student else None,
            'student_name': self.student.student_name if self.student else None,
            'library_access': self.student.library_access if self.student and self.student.library_access is not None else False,
            'subscription_status': sub_status,
            'active_subscription': active_sub,
            'current_balance': float(self.current_balance),
            'outstanding_balance': float(self.outstanding_balance or 0.00),
            'minimum_balance': float(self.minimum_balance),
            'warning_threshold': warning_threshold,
            'is_low_balance': float(self.current_balance) <= warning_threshold,
            'last_transaction_date': self.last_transaction_date.strftime('%Y-%m-%d %H:%M') if self.last_transaction_date else None,
            'transaction_count': self.transactions.count(),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def add_balance(self, amount, transaction_type, reference_id=None, description=None, created_by=None):
        """Add amount to balance and create transaction record"""
        if amount <= 0:
            raise ValueError('Amount must be positive')
        
        new_balance = self.current_balance + amount
        
        transaction = DepositTransaction(
            deposit_account_id=self.deposit_account_id,
            transaction_type=transaction_type,
            amount=amount,
            balance_after=new_balance,
            reference_id=reference_id,
            description=description,
            created_by=created_by
        )
        
        self.current_balance = new_balance
        self.last_transaction_date = _utc_now()
        
        db.session.add(transaction)
        db.session.commit()
        
        return transaction
    
    def deduct_balance(self, amount, transaction_type, reference_id=None, description=None, created_by=None):
        """Deduct amount from balance and create transaction record"""
        if amount <= 0:
            raise ValueError('Amount must be positive')
        
        if self.current_balance < amount:
            raise ValueError('Insufficient balance')
        
        new_balance = self.current_balance - amount
        
        transaction = DepositTransaction(
            deposit_account_id=self.deposit_account_id,
            transaction_type=transaction_type,
            amount=-amount,
            balance_after=new_balance,
            reference_id=reference_id,
            description=description,
            created_by=created_by
        )
        
        self.current_balance = new_balance
        self.last_transaction_date = _utc_now()
        
        db.session.add(transaction)
        db.session.commit()
        
        return transaction
    
    @classmethod
    def get_low_balance_accounts(cls, threshold=None):
        """Get accounts with low balance"""
        if threshold is None:
            threshold = 100
        return cls.query.filter(cls.current_balance <= threshold).all()


class DepositTransaction(db.Model):
    """Deposit Transaction Model - Records all deposit transactions"""
    __tablename__ = 'deposit_transactions'
    
    transaction_id = db.Column(db.Integer, primary_key=True)
    deposit_account_id = db.Column(db.Integer, db.ForeignKey('deposit_accounts.deposit_account_id'), nullable=False)
    transaction_type = db.Column(
        db.Enum('INITIAL_DEPOSIT', 'TOP_UP', 'FINE', 'DAMAGE_CHARGE', 'LOST_BOOK', 'ADJUSTMENT', 'REFUND'),
        nullable=False
    )
    amount = db.Column(db.DECIMAL(10, 2), nullable=False)
    balance_after = db.Column(db.DECIMAL(10, 2), nullable=False)
    reference_id = db.Column(db.String(50), nullable=True, comment='Reference to issue_id, damage_id, etc.')
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=_utc_now)
    
    # Relationships - Use unique backref names
    creator = db.relationship('User', backref='deposit_transaction_refs', lazy='joined')
    
    def __repr__(self):
        return f'<DepositTransaction {self.transaction_id} - {self.amount}>'
    
    def to_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'deposit_account_id': self.deposit_account_id,
            'transaction_type': self.transaction_type,
            'amount': float(self.amount),
            'balance_after': float(self.balance_after),
            'reference_id': self.reference_id,
            'description': self.description,
            'created_by': self.created_by,
            'created_by_name': self.creator.username if self.creator else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
    
    @classmethod
    def get_account_transactions(cls, deposit_account_id, limit=50):
        """Get transactions for a deposit account"""
        return cls.query.filter_by(deposit_account_id=deposit_account_id).order_by(
            cls.created_at.desc()
        ).limit(limit).all()
