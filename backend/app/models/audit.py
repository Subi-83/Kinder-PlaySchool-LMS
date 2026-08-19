from app import db
from datetime import datetime

class AuditLog(db.Model):
    """Audit Log Model - Tracks all user actions in the system"""
    __tablename__ = 'audit_logs'
    
    audit_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    username = db.Column(db.String(50), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=True)
    record_id = db.Column(db.String(50), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], lazy='joined', overlaps="audit_logs,user_ref")
    
    def __repr__(self):
        return f'<AuditLog {self.audit_id} - {self.action}>'
    
    def to_dict(self):
        return {
            'audit_id': self.audit_id,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'module': self.module,
            'record_id': self.record_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
    
    @classmethod
    def log_action(cls, user_id=None, username=None, action=None, module=None, 
                   record_id=None, details=None, ip_address=None, user_agent=None):
        """Log an action in the audit trail"""
        log = cls(
            user_id=user_id,
            username=username,
            action=action,
            module=module,
            record_id=str(record_id) if record_id else None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log)
        db.session.commit()
        return log
    
    @classmethod
    def get_user_logs(cls, user_id, limit=100):
        """Get audit logs for a specific user"""
        return cls.query.filter_by(user_id=user_id).order_by(
            cls.created_at.desc()
        ).limit(limit).all()
    
    @classmethod
    def get_module_logs(cls, module, limit=100):
        """Get audit logs for a specific module"""
        return cls.query.filter_by(module=module).order_by(
            cls.created_at.desc()
        ).limit(limit).all()
    
    @classmethod
    def get_recent_logs(cls, limit=100):
        """Get most recent audit logs"""
        return cls.query.order_by(cls.created_at.desc()).limit(limit).all()