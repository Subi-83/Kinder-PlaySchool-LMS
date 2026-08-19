from app import db
from datetime import datetime
import bcrypt

class User(db.Model):
    """User Model - Stores system users"""
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=True)
    role = db.Column(db.Enum('ADMIN', 'STAFF'), default='STAFF')
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_permissions = db.relationship('UserPermission', backref='user_ref', lazy='dynamic', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='user_ref', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.username} - {self.role}>'
    
    def set_password(self, password):
        """Set password (hashed)"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Check password against hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except Exception as e:
            print(f"Password check error: {e}")
            return False
    
    def has_permission(self, permission_code):
        """Check if user has a specific permission"""
        if self.role == 'ADMIN':
            return True
        
        # Check user-specific permissions
        for up in self.user_permissions:
            if up.permission.permission_code == permission_code and up.is_allowed:
                return True
        
        # Check role-based permissions
        rp = RolePermission.query.filter(
            RolePermission.role == self.role,
            RolePermission.permission_id == Permission.permission_id,
            Permission.permission_code == permission_code
        ).first()
        
        return rp is not None
    
    def has_any_permission(self, permission_codes):
        """Check if user has any of the given permissions"""
        for code in permission_codes:
            if self.has_permission(code):
                return True
        return False
    
    def get_permissions(self):
        """Get all permissions for the user"""
        if self.role == 'ADMIN':
            return [p.permission_code for p in Permission.query.all()]
        
        permissions = set()
        
        # Get role-based permissions
        for rp in RolePermission.query.filter_by(role=self.role).all():
            permissions.add(rp.permission.permission_code)
        
        # Get user-specific permissions
        for up in self.user_permissions.filter_by(is_allowed=True).all():
            permissions.add(up.permission.permission_code)
        
        return list(permissions)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'last_login': self.last_login.strftime('%Y-%m-%d %H:%M') if self.last_login else None,
            'permissions': self.get_permissions(),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    def to_dict_brief(self):
        """Convert to brief dictionary"""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active
        }
    
    @classmethod
    def get_active_users(cls):
        """Get all active users"""
        return cls.query.filter_by(is_active=True).all()
    
    @classmethod
    def get_admins(cls):
        """Get all admin users"""
        return cls.query.filter_by(role='ADMIN', is_active=True).all()
    
    @classmethod
    def get_staff(cls):
        """Get all staff users"""
        return cls.query.filter_by(role='STAFF', is_active=True).all()


class Permission(db.Model):
    """Permission Model - Stores available permissions"""
    __tablename__ = 'permissions'
    
    permission_id = db.Column(db.Integer, primary_key=True)
    permission_code = db.Column(db.String(50), unique=True, nullable=False)
    permission_name = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Permission {self.permission_code}>'
    
    def to_dict(self):
        return {
            'permission_id': self.permission_id,
            'permission_code': self.permission_code,
            'permission_name': self.permission_name,
            'module': self.module,
            'description': self.description
        }
    
    @classmethod
    def get_by_module(cls, module):
        """Get permissions by module"""
        return cls.query.filter_by(module=module).all()


class RolePermission(db.Model):
    """Role Permission Model - Maps permissions to roles"""
    __tablename__ = 'role_permissions'
    
    role_permission_id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.Enum('ADMIN', 'STAFF'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.permission_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    permission = db.relationship('Permission', backref='role_permissions_refs')
    
    def __repr__(self):
        return f'<RolePermission {self.role} - {self.permission_id}>'


class UserPermission(db.Model):
    """User Permission Model - Maps permissions to individual users"""
    __tablename__ = 'user_permissions'
    
    user_permission_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.permission_id'), nullable=False)
    is_allowed = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permission = db.relationship('Permission', backref='user_permissions_refs')
    
    def __repr__(self):
        return f'<UserPermission {self.user_id} - {self.permission_id}>'