"""
Audit Routes - Audit log endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, admin_required, get_current_user
from app.services.audit_service import AuditService

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

@audit_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_audit_logs():
    """Get recent audit logs"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_recent_logs(limit, offset)
    total = AuditLog.query.count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_user_audit_logs(user_id):
    """Get audit logs for a specific user"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_logs_by_user(user_id, limit, offset)
    total = AuditLog.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/module/<string:module>', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_module_audit_logs(module):
    """Get audit logs for a specific module"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_logs_by_module(module, limit, offset)
    total = AuditLog.query.filter_by(module=module).count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/action/<string:action>', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_action_audit_logs(action):
    """Get audit logs for a specific action"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_logs_by_action(action, limit, offset)
    total = AuditLog.query.filter_by(action=action).count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/search', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def search_audit_logs():
    """Search audit logs"""
    query = request.args.get('q', '')
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    if not query:
        return jsonify({'error': 'Search query required'}), 400
    
    logs = AuditService.search_logs(query, limit, offset)
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'limit': limit,
        'offset': offset,
        'query': query
    }), 200

@audit_bp.route('/summary', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_audit_summary():
    """Get audit logs summary"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    from datetime import datetime
    start = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
    end = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None
    
    summary = AuditService.get_logs_summary(start, end)
    
    return jsonify(summary), 200

@audit_bp.route('/cleanup', methods=['POST'])
@jwt_required()
@admin_required
def cleanup_audit_logs():
    """Clean up old audit logs (Admin only)"""
    days_to_keep = request.args.get('days', 365, type=int)
    
    if days_to_keep < 30:
        return jsonify({'error': 'Cannot delete logs newer than 30 days'}), 400
    
    deleted = AuditService.cleanup_old_logs(days_to_keep)
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='CLEANUP_AUDIT_LOGS',
        module='Audit',
        details=f'Deleted {deleted} logs older than {days_to_keep} days'
    )
    
    return jsonify({
        'message': f'Deleted {deleted} logs older than {days_to_keep} days',
        'deleted_count': deleted
    }), 200