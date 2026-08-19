from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app import db
from app.models.user import User
from app.models.audit import AuditLog
from app.middleware.auth_middleware import admin_required, get_current_user
from app.services.permission_service import PermissionService
from datetime import timedelta
import bcrypt
import traceback

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request body'}), 400
            
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401
        
        # Check password
        try:
            password_valid = bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8'))
        except Exception:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not password_valid:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login
        user.last_login = db.func.now()
        db.session.commit()
        
        # Create JWT token
        access_token = create_access_token(
            identity=str(user.user_id),
            expires_delta=timedelta(hours=24)
        )
        
        # Get user permissions
        permissions = user.get_permissions()
        
        # Log login
        try:
            AuditLog.log_action(
                user_id=user.user_id,
                username=user.username,
                action='LOGIN',
                module='Auth',
                details='User logged in successfully',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
        except Exception:
            pass
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'permissions': permissions
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        permissions = user.get_permissions()
        
        return jsonify({
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'permissions': permissions,
            'is_active': user.is_active,
            'last_login': user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else None,
            'created_at': user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the authenticated user's own profile details."""
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json() or {}
    full_name = (data.get('full_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    if not full_name or not email:
        return jsonify({'error': 'Full name and email are required'}), 400
    duplicate = User.query.filter(User.email == email, User.user_id != user.user_id).first()
    if duplicate:
        return jsonify({'error': 'Email is already in use'}), 409
    user.full_name = full_name
    user.email = email
    db.session.commit()
    AuditLog.log_action(user_id=user.user_id, username=user.username, action='UPDATE_PROFILE', module='Auth', details='User updated profile details')
    return jsonify(user.to_dict()), 200
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout endpoint (client-side token discard)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user:
        AuditLog.log_action(
            user_id=user.user_id,
            username=user.username,
            action='LOGOUT',
            module='Auth',
            details='User logged out'
        )
    
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({'error': 'Old and new password required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    # Verify old password
    if not bcrypt.checkpw(old_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid old password'}), 401
    
    # Set new password
    salt = bcrypt.gensalt()
    user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
    db.session.commit()
    
    AuditLog.log_action(
        user_id=user.user_id,
        username=user.username,
        action='CHANGE_PASSWORD',
        module='Auth',
        details='User changed password'
    )
    
    return jsonify({'message': 'Password changed successfully'}), 200