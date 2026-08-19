"""
Permission Service - Handles all permission-related business logic
"""
from app import db
from app.models.user import User, Permission, RolePermission, UserPermission

class PermissionService:
    """Service class for managing permissions"""
    
    @staticmethod
    def get_all_permissions():
        """Get all available permissions"""
        return Permission.query.order_by(
            Permission.module, 
            Permission.permission_code
        ).all()
    
    @staticmethod
    def get_permission_by_code(permission_code):
        """Get a permission by its code"""
        return Permission.query.filter_by(
            permission_code=permission_code
        ).first()
    
    @staticmethod
    def get_permissions_by_module(module):
        """Get all permissions for a specific module"""
        return Permission.query.filter_by(module=module).all()
    
    @staticmethod
    def get_role_permissions(role):
        """Get all permissions assigned to a specific role"""
        if role not in ['ADMIN', 'STAFF']:
            return []
        
        rps = RolePermission.query.filter_by(role=role).all()
        return [rp.permission for rp in rps]
    
    @staticmethod
    def get_user_permissions(user_id):
        """Get all custom permissions assigned to a specific user"""
        ups = UserPermission.query.filter_by(
            user_id=user_id,
            is_allowed=True
        ).all()
        return [up.permission for up in ups]
    
    @staticmethod
    def get_user_permission_codes(user):
        """Get all permission codes for a user (including role-based and custom)"""
        if not user:
            return []
        
        if user.role == 'ADMIN':
            return [p.permission_code for p in Permission.query.all()]
        
        permission_codes = set()
        
        for rp in RolePermission.query.filter_by(role=user.role).all():
            permission_codes.add(rp.permission.permission_code)
        
        for up in UserPermission.query.filter_by(
            user_id=user.user_id,
            is_allowed=True
        ).all():
            permission_codes.add(up.permission.permission_code)
        
        return list(permission_codes)
    
    @staticmethod
    def user_has_permission(user, permission_code):
        """Check if a user has a specific permission"""
        if not user:
            return False
        
        if user.role == 'ADMIN':
            return True
        
        for up in UserPermission.query.filter_by(
            user_id=user.user_id,
            is_allowed=True
        ).all():
            if up.permission.permission_code == permission_code:
                return True
        
        for rp in RolePermission.query.filter_by(role=user.role).all():
            if rp.permission.permission_code == permission_code:
                return True
        
        return False
    
    @staticmethod
    def user_has_any_permission(user, permission_codes):
        """Check if a user has any of the given permissions"""
        if not user or not permission_codes:
            return False
        
        for code in permission_codes:
            if PermissionService.user_has_permission(user, code):
                return True
        
        return False
    
    @staticmethod
    def assign_permission_to_role(role, permission_code):
        """Assign a permission to a role"""
        if role not in ['ADMIN', 'STAFF']:
            return False, 'Invalid role'
        
        permission = Permission.query.filter_by(
            permission_code=permission_code
        ).first()
        
        if not permission:
            return False, 'Permission not found'
        
        existing = RolePermission.query.filter_by(
            role=role,
            permission_id=permission.permission_id
        ).first()
        
        if existing:
            return True, 'Permission already assigned to role'
        
        rp = RolePermission(
            role=role,
            permission_id=permission.permission_id
        )
        db.session.add(rp)
        db.session.commit()
        
        return True, 'Permission assigned successfully'
    
    @staticmethod
    def remove_permission_from_role(role, permission_code):
        """Remove a permission from a role"""
        if role not in ['ADMIN', 'STAFF']:
            return False, 'Invalid role'
        
        permission = Permission.query.filter_by(
            permission_code=permission_code
        ).first()
        
        if not permission:
            return False, 'Permission not found'
        
        rp = RolePermission.query.filter_by(
            role=role,
            permission_id=permission.permission_id
        ).first()
        
        if not rp:
            return False, 'Permission not assigned to role'
        
        db.session.delete(rp)
        db.session.commit()
        
        return True, 'Permission removed successfully'
    
    @staticmethod
    def assign_user_permission(user_id, permission_code, allowed=True):
        """Assign a custom permission to a user"""
        user = User.query.get(user_id)
        if not user:
            return False, 'User not found'
        
        permission = Permission.query.filter_by(
            permission_code=permission_code
        ).first()
        
        if not permission:
            return False, 'Permission not found'
        
        existing = UserPermission.query.filter_by(
            user_id=user_id,
            permission_id=permission.permission_id
        ).first()
        
        if existing:
            existing.is_allowed = allowed
        else:
            up = UserPermission(
                user_id=user_id,
                permission_id=permission.permission_id,
                is_allowed=allowed
            )
            db.session.add(up)
        
        db.session.commit()
        
        return True, 'User permission updated successfully'
    
    @staticmethod
    def remove_user_permission(user_id, permission_code):
        """Remove a custom permission from a user"""
        permission = Permission.query.filter_by(
            permission_code=permission_code
        ).first()
        
        if not permission:
            return False, 'Permission not found'
        
        up = UserPermission.query.filter_by(
            user_id=user_id,
            permission_id=permission.permission_id
        ).first()
        
        if not up:
            return False, 'Permission not assigned to user'
        
        db.session.delete(up)
        db.session.commit()
        
        return True, 'User permission removed successfully'
    
    @staticmethod
    def sync_user_permissions(user_id, permission_codes):
        """Sync all user permissions (replace all with new list)"""
        user = User.query.get(user_id)
        if not user:
            return False, 'User not found'
        
        UserPermission.query.filter_by(user_id=user_id).delete()
        
        for perm_code in permission_codes:
            permission = Permission.query.filter_by(
                permission_code=perm_code
            ).first()
            
            if permission:
                up = UserPermission(
                    user_id=user_id,
                    permission_id=permission.permission_id,
                    is_allowed=True
                )
                db.session.add(up)
        
        db.session.commit()
        
        return True, 'User permissions synchronized successfully'