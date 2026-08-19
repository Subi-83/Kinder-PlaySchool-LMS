from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.settings import SystemSetting, Holiday
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, admin_required, get_current_user
from app.services.settings_service import SettingsService
from datetime import datetime, timedelta, timezone

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('settings.view')
def get_settings():
    """Get all system settings"""
    settings = SystemSetting.query.order_by(SystemSetting.category, SystemSetting.setting_key).all()
    result = {}
    for setting in settings:
        result[setting.setting_key] = setting.get_value()
    return jsonify(result), 200

@settings_bp.route('/detailed', methods=['GET'])
@jwt_required()
@permission_required('settings.view')
def get_settings_detailed():
    """Get all system settings with metadata"""
    settings = SystemSetting.query.order_by(SystemSetting.category, SystemSetting.setting_key).all()
    return jsonify([s.to_dict() for s in settings]), 200

@settings_bp.route('/<string:key>', methods=['GET'])
@jwt_required()
@permission_required('settings.view')
def get_setting(key):
    """Get a specific setting"""
    setting = SystemSetting.query.filter_by(setting_key=key).first()
    if not setting:
        return jsonify({'error': 'Setting not found'}), 404
    return jsonify({key: setting.get_value()}), 200

@settings_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def update_settings():
    """Update multiple settings"""
    data = request.get_json()
    updated = []
    errors = []
    
    for key, value in data.items():
        setting = SystemSetting.query.filter_by(setting_key=key).first()
        if setting and setting.is_editable:
            setting.set_value(str(value))
            updated.append(key)
        elif setting and not setting.is_editable:
            errors.append(f'{key} is not editable')
    
    if updated:
        db.session.commit()
        
        current_user = get_current_user()
        user_id = current_user.user_id if current_user else None
        username = current_user.username if current_user else 'SYSTEM'
        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action='UPDATE_SETTINGS',
            module='Settings',
            details=f'Updated settings: {", ".join(updated)}'
        )
    
    return jsonify({
        'message': f'Updated {len(updated)} settings',
        'updated': updated,
        'errors': errors
    }), 200 if updated else 400

@settings_bp.route('/<string:key>', methods=['PUT'])
@jwt_required()
@admin_required
def update_setting(key):
    """Update a single setting"""
    data = request.get_json()
    setting = SystemSetting.query.filter_by(setting_key=key).first()
    
    if not setting:
        return jsonify({'error': 'Setting not found'}), 404
    
    if not setting.is_editable:
        return jsonify({'error': 'Setting is not editable'}), 403
    
    value = data.get('value')
    setting.set_value(str(value))
    db.session.commit()
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'SYSTEM'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='UPDATE_SETTING',
        module='Settings',
        record_id=key,
        details=f'Updated setting {key} to {value}'
    )
    
    return jsonify({key: setting.get_value()}), 200

# Holidays endpoints
@settings_bp.route('/holidays', methods=['GET'])
@jwt_required()
@permission_required('settings.view')
def get_holidays():
    """Get all holidays"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Holiday.query
    
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Holiday dates must use YYYY-MM-DD'}), 400
        if end < start:
            return jsonify({'error': 'End date cannot be before start date'}), 400
        query = query.filter(Holiday.holiday_date.between(start, end))
    
    holidays = query.order_by(Holiday.holiday_date).all()
    return jsonify([h.to_dict() for h in holidays]), 200

@settings_bp.route('/holidays', methods=['POST'])
@jwt_required()
@admin_required
def create_holiday():
    """Create a single holiday or every date in an inclusive range."""
    data = request.get_json() or {}
    name = (data.get('holiday_name') or '').strip()
    start_value = data.get('start_date') or data.get('holiday_date')
    end_value = data.get('end_date') or start_value
    if not name or not start_value or not end_value:
        return jsonify({'error': 'Holiday name, from date, and to date are required'}), 400
    try:
        start_date = datetime.strptime(start_value, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_value, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Holiday dates must use YYYY-MM-DD'}), 400
    if end_date < start_date:
        return jsonify({'error': 'To date cannot be before from date'}), 400
    if (end_date - start_date).days > 366:
        return jsonify({'error': 'A holiday range cannot exceed 366 days'}), 400

    created = []
    current_date = start_date
    while current_date <= end_date:
        if not Holiday.query.filter_by(holiday_date=current_date).first():
            holiday = Holiday(
                holiday_name=name,
                holiday_date=current_date,
                is_recurring=data.get('is_recurring', False),
                description=data.get('description')
            )
            db.session.add(holiday)
            created.append(holiday)
        current_date += timedelta(days=1)
    db.session.commit()
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'SYSTEM'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='CREATE_HOLIDAY',
        module='Settings',
        record_id=str(created[0].holiday_id) if created else None,
        details=f'Created {len(created)} holiday date(s): {name}'
    )

    return jsonify({
        'message': f'Created {len(created)} holiday date(s)',
        'holidays': [holiday.to_dict() for holiday in created]
    }), 201

@settings_bp.route('/holidays/<int:holiday_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_holiday(holiday_id):
    """Update a holiday"""
    holiday = Holiday.query.get(holiday_id)
    if not holiday:
        return jsonify({'error': 'Holiday not found'}), 404
    
    data = request.get_json()
    
    if 'holiday_name' in data:
        holiday.holiday_name = data['holiday_name']
    if 'holiday_date' in data:
        holiday.holiday_date = datetime.strptime(data['holiday_date'], '%Y-%m-%d').date()
    if 'is_recurring' in data:
        holiday.is_recurring = data['is_recurring']
    if 'description' in data:
        holiday.description = data['description']
    
    db.session.commit()
    
    return jsonify(holiday.to_dict()), 200

@settings_bp.route('/holidays/<int:holiday_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_holiday(holiday_id):
    """Delete a holiday"""
    holiday = Holiday.query.get(holiday_id)
    if not holiday:
        return jsonify({'error': 'Holiday not found'}), 404
    
    holiday_name = holiday.holiday_name
    db.session.delete(holiday)
    db.session.commit()
    
    return jsonify({'message': f'Holiday {holiday_name} deleted successfully'}), 200

@settings_bp.route('/export-backup', methods=['GET'])
@jwt_required()
@admin_required
def export_full_backup():
    """Export complete database records as JSON for migration to another system."""
    from app.models.student import Student
    from app.models.book import BookTitle, BookCopy, BookLevel, BookCategory
    from app.models.subscription import SubscriptionPlan, StudentSubscription
    from app.models.library import BookIssue, BookReturn
    from app.models.deposit import DepositAccount, DepositTransaction
    
    backup_data = {
        'exported_at': datetime.now(timezone.utc).isoformat(),
        'system_version': '1.0.0',
        'students': [s.to_dict() for s in Student.query.all()],
        'book_titles': [b.to_dict() for b in BookTitle.query.all()],
        'book_copies': [c.to_dict() for c in BookCopy.query.all()],
        'book_levels': [l.to_dict() for l in BookLevel.query.all()],
        'book_categories': [cat.to_dict() for cat in BookCategory.query.all()],
        'subscription_plans': [p.to_dict() for p in SubscriptionPlan.query.all()],
        'student_subscriptions': [sub.to_dict() for sub in StudentSubscription.query.all()],
        'book_issues': [issue.to_dict() for issue in BookIssue.query.all()],
        'deposit_accounts': [acc.to_dict() for acc in DepositAccount.query.all()],
        'holidays': [h.to_dict() for h in Holiday.query.all()],
        'settings': [s.to_dict() for s in SystemSetting.query.all()]
    }
    return jsonify(backup_data), 200
