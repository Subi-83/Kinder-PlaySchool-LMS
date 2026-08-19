from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, Permission, RolePermission, UserPermission
from app.models.audit import AuditLog
from app.middleware.auth_middleware import admin_required, get_current_user
from app.services.permission_service import PermissionService
import bcrypt



users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    """Get all users (Admin only)"""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    """Get a specific user (Admin only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@users_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    """Create a new user (Admin only)"""
    data = request.get_json()
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'STAFF')
    permissions = data.get('permissions', [])
    
    # Validation
    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Create user
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role=role,
        is_active=True
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Assign custom permissions for STAFF
    if role == 'STAFF' and permissions:
        for perm_code in permissions:
            permission = Permission.query.filter_by(permission_code=perm_code).first()
            if permission:
                user_perm = UserPermission(
                    user_id=user.user_id,
                    permission_id=permission.permission_id,
                    is_allowed=True
                )
                db.session.add(user_perm)
        db.session.commit()
    
    # Log action
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='CREATE_USER',
        module='User',
        record_id=str(user.user_id),
        details=f'Created user: {username} with role {role}'
    )
    
    return jsonify(user.to_dict()), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Update a user (Admin only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    current_user = get_current_user()
    
    # Prevent admin from disabling themselves
    if user.user_id == current_user.user_id and data.get('is_active') == False:
        return jsonify({'error': 'Cannot disable your own account'}), 400
    
    # Update fields
    if 'username' in data:
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.user_id != user_id:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.user_id != user_id:
            return jsonify({'error': 'Email already taken'}), 400
        user.email = data['email']
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'role' in data:
        # Prevent changing admin role
        if user.role == 'ADMIN' and data['role'] != 'ADMIN':
            return jsonify({'error': 'Cannot change admin role'}), 400
        user.role = data['role']
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        salt = bcrypt.gensalt()
        user.password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), salt).decode('utf-8')
    
    db.session.commit()
    
    # Update permissions if role is STAFF and permissions provided
    if 'permissions' in data and user.role == 'STAFF':
        # Remove existing user permissions
        UserPermission.query.filter_by(user_id=user_id).delete()
        
        # Add new permissions
        for perm_code in data['permissions']:
            permission = Permission.query.filter_by(permission_code=perm_code).first()
            if permission:
                user_perm = UserPermission(
                    user_id=user.user_id,
                    permission_id=permission.permission_id,
                    is_allowed=True
                )
                db.session.add(user_perm)
        db.session.commit()
    
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='UPDATE_USER',
        module='User',
        record_id=str(user_id),
        details=f'Updated user: {user.username}'
    )
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete a user (Admin only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    current_user = get_current_user()
    
    # Prevent deleting self
    if user.user_id == current_user.user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    # Prevent deleting admin
    if user.role == 'ADMIN':
        return jsonify({'error': 'Cannot delete admin user'}), 400
    
    username = user.username
    
    try:
        # Delete user permissions
        UserPermission.query.filter_by(user_id=user_id).delete()
        db.session.delete(user)
        db.session.commit()
        msg = 'User deleted successfully'
    except Exception:
        db.session.rollback()
        user.is_active = False
        db.session.commit()
        msg = 'User deactivated (preserved audit log records)'
    
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='DELETE_USER',
        module='User',
        record_id=str(user_id),
        details=f'Deleted/Deactivated user: {username}'
    )
    
    return jsonify({'message': msg}), 200

@users_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_all_permissions():
    """Get all available permissions"""
    permissions = Permission.query.order_by(Permission.module, Permission.permission_code).all()
    return jsonify([p.to_dict() for p in permissions]), 200

@users_bp.route('/permissions/role/<role>', methods=['GET'])
@jwt_required()
@admin_required
def get_role_permissions(role):
    """Get permissions for a specific role"""
    if role not in ['ADMIN', 'STAFF']:
        return jsonify({'error': 'Invalid role'}), 400
    
    rps = RolePermission.query.filter_by(role=role).all()
    permissions = [rp.permission.to_dict() for rp in rps]
    
    return jsonify(permissions), 200

@users_bp.route('/permissions/role', methods=['POST'])
@jwt_required()
@admin_required
def assign_role_permission():
    """Assign a permission to a role"""
    data = request.get_json()
    role = data.get('role')
    permission_code = data.get('permission_code')
    
    if role not in ['ADMIN', 'STAFF']:
        return jsonify({'error': 'Invalid role'}), 400
    
    permission = Permission.query.filter_by(permission_code=permission_code).first()
    if not permission:
        return jsonify({'error': 'Permission not found'}), 404
    
    # Check if already assigned
    existing = RolePermission.query.filter_by(
        role=role,
        permission_id=permission.permission_id
    ).first()
    
    if existing:
        return jsonify({'message': 'Permission already assigned to role'}), 200
    
    rp = RolePermission(role=role, permission_id=permission.permission_id)
    db.session.add(rp)
    db.session.commit()
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='ASSIGN_ROLE_PERMISSION',
        module='User',
        details=f'Assigned {permission_code} to {role}'
    )
    
    return jsonify({'message': 'Permission assigned to role successfully'}), 201

@users_bp.route('/permissions/role', methods=['DELETE'])
@jwt_required()
@admin_required
def remove_role_permission():
    """Remove a permission from a role"""
    data = request.get_json()
    role = data.get('role')
    permission_code = data.get('permission_code')
    
    if role not in ['ADMIN', 'STAFF']:
        return jsonify({'error': 'Invalid role'}), 400
    
    permission = Permission.query.filter_by(permission_code=permission_code).first()
    if not permission:
        return jsonify({'error': 'Permission not found'}), 404
    
    rp = RolePermission.query.filter_by(
        role=role,
        permission_id=permission.permission_id
    ).first()
    
    if not rp:
        return jsonify({'error': 'Permission not assigned to role'}), 404
    
    db.session.delete(rp)
    db.session.commit()
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='REMOVE_ROLE_PERMISSION',
        module='User',
        details=f'Removed {permission_code} from {role}'
    )
    
    return jsonify({'message': 'Permission removed from role successfully'}), 200