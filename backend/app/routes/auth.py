from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app import db
from app.models.user import User
from app.models.audit import AuditLog
from app.middleware.auth_middleware import admin_required, get_current_user
from app.services.permission_service import PermissionService
from datetime import timedelta
import bcrypt
import traceback
import smtplib
from email.message import EmailMessage
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def _password_reset_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='password-reset')

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send a time-limited password reset link without exposing account existence."""
    data = request.get_json() or {}
    identifier = (data.get('email') or data.get('username') or '').strip()
    if not identifier:
        return jsonify({'error': 'Enter your username or registered email address.'}), 400

    user = User.query.filter(
        (db.func.lower(User.email) == identifier.lower()) |
        (db.func.lower(User.username) == identifier.lower())
    ).first()
    response = {'message': 'If that account exists, password reset instructions have been sent.'}
    if not user or not user.is_active:
        return jsonify(response), 200

    token = _password_reset_serializer().dumps({'user_id': user.user_id, 'password_hash': user.password_hash[-12:]})
    reset_url = f"{current_app.config['FRONTEND_RESET_PASSWORD_URL']}?token={token}"
    mail_username = current_app.config.get('MAIL_USERNAME')
    mail_password = current_app.config.get('MAIL_PASSWORD')

    if mail_username and mail_password:
        try:
            message = EmailMessage()
            message['Subject'] = 'Library System Password Reset'
            message['From'] = current_app.config.get('MAIL_DEFAULT_SENDER') or mail_username
            message['To'] = user.email
            message.set_content(
                f"Hello {user.full_name or user.username},\n\n"
                f"Use this link to reset your password. It expires in 30 minutes:\n{reset_url}\n\n"
                "If you did not request this, you can ignore this email."
            )
            # Google displays app passwords grouped with spaces. SMTP expects
            # the same 16 characters without grouping whitespace.
            smtp_password = ''.join(str(mail_password).split())
            with smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'], timeout=15) as smtp:
                smtp.ehlo()
                if current_app.config.get('MAIL_USE_TLS'):
                    smtp.starttls()
                    smtp.ehlo()
                smtp.login(mail_username, smtp_password)
                smtp.send_message(message)
        except smtplib.SMTPAuthenticationError:
            current_app.logger.exception('SMTP authentication failed while sending password reset')
            return jsonify({'error': 'Email login was rejected. For Gmail, enable 2-Step Verification and use a 16-character App Password (not the normal Gmail password).'}), 503
        except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError, OSError):
            current_app.logger.exception('SMTP connection failed while sending password reset')
            return jsonify({'error': 'Could not connect to the configured email server. Check MAIL_SERVER, MAIL_PORT, TLS, and internet access.'}), 503
        except Exception:
            current_app.logger.exception('Unable to send password reset email')
            return jsonify({'error': 'Reset email could not be sent. Please contact the administrator.'}), 503
    elif current_app.debug:
        # Local development has no mail account by default; expose the signed
        # link only in debug mode so the complete flow remains testable.
        response['reset_url'] = reset_url

    return jsonify(response), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_forgotten_password():
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    new_password = data.get('new_password') or ''
    if not token:
        return jsonify({'error': 'Password reset token is required.'}), 400
    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters.'}), 400
    try:
        payload = _password_reset_serializer().loads(token, max_age=1800)
    except SignatureExpired:
        return jsonify({'error': 'This password reset link has expired.'}), 400
    except BadSignature:
        return jsonify({'error': 'This password reset link is invalid.'}), 400

    user = User.query.get(payload.get('user_id'))
    if not user or not user.is_active or payload.get('password_hash') != user.password_hash[-12:]:
        return jsonify({'error': 'This password reset link is no longer valid.'}), 400
    user.set_password(new_password)
    db.session.commit()
    AuditLog.log_action(
        user_id=user.user_id, username=user.username, action='RESET_PASSWORD',
        module='Auth', record_id=str(user.user_id), details='Password reset using a signed recovery link'
    )
    return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200

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
