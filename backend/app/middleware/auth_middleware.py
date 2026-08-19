"""
Authentication Middleware - Handles JWT authentication and permission checks
"""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User
from app.models.audit import AuditLog
from app.services.permission_service import PermissionService

def permission_required(permission_code):
    """
    Decorator to check if user has a specific permission
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({'error': 'Authentication required', 'message': str(e)}), 401
            
            current_user_id = get_jwt_identity()
            
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 403
            
            if not PermissionService.user_has_permission(user, permission_code):
                # Log unauthorized access attempt
                AuditLog.log_action(
                    user_id=user.user_id,
                    username=user.username,
                    action='UNAUTHORIZED_ACCESS',
                    module='Security',
                    details=f'Attempted to access {permission_code} without permission',
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent')
                )
                return jsonify({
                    'error': 'Permission denied',
                    'required_permission': permission_code
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def permission_required_any(permission_codes):
    """
    Decorator to check if user has any of the given permissions
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({'error': 'Authentication required', 'message': str(e)}), 401
            
            current_user_id = get_jwt_identity()
            
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 403
            
            if not PermissionService.user_has_any_permission(user, permission_codes):
                AuditLog.log_action(
                    user_id=user.user_id,
                    username=user.username,
                    action='UNAUTHORIZED_ACCESS',
                    module='Security',
                    details=f'Attempted to access one of {permission_codes} without permission',
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent')
                )
                return jsonify({
                    'error': 'Permission denied',
                    'required_permissions': permission_codes
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    """
    Decorator to check if user is an admin
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({'error': 'Authentication required', 'message': str(e)}), 401
        
        current_user_id = get_jwt_identity()
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403
        
        if user.role != 'ADMIN':
            AuditLog.log_action(
                user_id=user.user_id,
                username=user.username,
                action='UNAUTHORIZED_ACCESS',
                module='Security',
                details='Attempted admin access without admin role',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

def get_current_user():
    """
    Get the current authenticated user
    """
    try:
        user_id = get_jwt_identity()
        if user_id:
            return User.query.get(user_id)
    except:
        pass
    return None

def get_current_user_id():
    """
    Get the current authenticated user ID
    """
    try:
        return get_jwt_identity()
    except:
        return None

def is_authenticated():
    """
    Check if the current request is authenticated
    """
    try:
        verify_jwt_in_request()
        return True
    except:
        return False