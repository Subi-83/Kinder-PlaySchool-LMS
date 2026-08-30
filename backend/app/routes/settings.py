from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.settings import SystemSetting, Holiday
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, admin_required, get_current_user
from app.services.settings_service import SettingsService
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import text, Date, DateTime, Boolean, Integer, Float, Numeric

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

def ensure_backup_reminder_settings():
    """Add reminder settings to existing databases without requiring a migration."""
    interval = SystemSetting.query.filter_by(setting_key='backup_reminder_days').first()
    if not interval:
        interval = SystemSetting(
            setting_key='backup_reminder_days', setting_value='7', data_type='INTEGER',
            category='Backup', description='Days between login backup reminders', is_editable=True
        )
        db.session.add(interval)
    last_export = SystemSetting.query.filter_by(setting_key='backup_last_export_date').first()
    if not last_export:
        last_export = SystemSetting(
            setting_key='backup_last_export_date', setting_value='', data_type='STRING',
            category='Backup', description='Date of the last generated backup', is_editable=False
        )
        db.session.add(last_export)
    db.session.commit()
    return interval, last_export

@settings_bp.route('/backup-reminder-status', methods=['GET'])
@jwt_required()
@admin_required
def backup_reminder_status():
    interval_setting, last_export_setting = ensure_backup_reminder_settings()
    enabled = SettingsService.get_bool('backup_enabled', True)
    interval_days = max(1, int(interval_setting.get_value() or 7))
    last_value = (last_export_setting.setting_value or '').strip()
    last_date = None
    try:
        last_date = datetime.strptime(last_value, '%Y-%m-%d').date() if last_value else None
    except ValueError:
        last_date = None
    today = datetime.now().date()
    days_since = (today - last_date).days if last_date else None
    return jsonify({
        'reminder_days': interval_days,
        'last_backup_date': last_date.isoformat() if last_date else None,
        'days_since_backup': days_since,
        'backup_enabled': enabled,
        'backup_due': enabled and (last_date is None or days_since >= interval_days)
    }), 200

@settings_bp.route('/public', methods=['GET'])
def get_public_settings():
    """Return non-sensitive branding settings used before and after login."""
    import re
    school_name = SettingsService.get_string('school_name', 'Kinder Park Preschool')
    words = re.findall(r'[A-Za-z0-9]+', school_name or '')
    member_prefix = (''.join(word[0] for word in words[:2]).upper() or 'MB')[:4]
    return jsonify({
        'school_name': school_name,
        'member_prefix': member_prefix,
        'member_label': f'{member_prefix} Member',
        'members_label': f'{member_prefix} Members'
    }), 200

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
    ensure_backup_reminder_settings()
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
    
    def json_value(value):
        if isinstance(value, (datetime, )):
            return value.isoformat()
        if hasattr(value, 'isoformat'):
            return value.isoformat()
        if isinstance(value, Decimal):
            return str(value)
        return value

    _, last_export_setting = ensure_backup_reminder_settings()
    last_export_setting.setting_value = datetime.now().date().isoformat()
    db.session.commit()

    raw_tables = {}
    protected_auth_tables = {'users', 'permissions', 'role_permissions', 'user_permissions'}
    for table in db.metadata.sorted_tables:
        if table.name == 'alembic_version' or table.name in protected_auth_tables:
            continue
        rows = db.session.execute(table.select()).mappings().all()
        raw_tables[table.name] = [{key: json_value(value) for key, value in row.items()} for row in rows]

    backup_data = {
        'exported_at': datetime.now(timezone.utc).isoformat(),
        'system_version': '2.0.0',
        'backup_format': 'raw-v2',
        'raw_tables': raw_tables,
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

@settings_bp.route('/import-backup', methods=['POST'])
@jwt_required()
@admin_required
def import_full_backup():
    """Restore a raw-v2 JSON backup while preserving login and permission records."""
    upload = request.files.get('file')
    if not upload or not upload.filename or not upload.filename.lower().endswith('.json'):
        return jsonify({'error': 'Select a valid JSON backup file.'}), 400
    try:
        import json
        payload = json.loads(upload.read().decode('utf-8-sig'))
    except (ValueError, UnicodeDecodeError):
        return jsonify({'error': 'The selected file is not valid backup JSON.'}), 400
    if payload.get('backup_format') != 'raw-v2' or not isinstance(payload.get('raw_tables'), dict):
        return jsonify({'error': 'This backup is an older format and cannot be restored. Export a new raw-v2 backup first.'}), 400

    protected = {'users', 'permissions', 'role_permissions', 'user_permissions', 'alembic_version'}
    table_map = {table.name: table for table in db.metadata.sorted_tables}

    def database_value(column, value):
        if value is None:
            return None
        if isinstance(column.type, DateTime):
            return datetime.fromisoformat(str(value).replace('Z', '+00:00')).replace(tzinfo=None)
        if isinstance(column.type, Date):
            return datetime.fromisoformat(str(value)).date()
        if isinstance(column.type, Boolean):
            return bool(value)
        if isinstance(column.type, Integer):
            return int(value)
        if isinstance(column.type, (Float, Numeric)):
            return Decimal(str(value))
        return value

    try:
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 0'))
        for table in reversed(db.metadata.sorted_tables):
            if table.name not in protected:
                db.session.execute(table.delete())
        restored = 0
        for table in db.metadata.sorted_tables:
            if table.name in protected:
                continue
            source_rows = payload['raw_tables'].get(table.name, [])
            if not source_rows:
                continue
            valid_columns = {column.name: column for column in table.columns}
            rows = [{key: database_value(valid_columns[key], value) for key, value in row.items() if key in valid_columns} for row in source_rows]
            db.session.execute(table.insert(), rows)
            restored += len(rows)
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
        db.session.commit()
        return jsonify({'message': f'Backup restored successfully. {restored} records imported.', 'records_restored': restored}), 200
    except Exception as exc:
        db.session.rollback()
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
        db.session.commit()
        return jsonify({'error': f'Backup restore failed: {str(exc)}'}), 400

@settings_bp.route('/complete-reset', methods=['POST'])
@jwt_required()
@admin_required
def complete_system_reset():
    """Clear all application data while preserving admins, permissions, and settings."""
    data = request.get_json() or {}
    if data.get('confirmation') != 'RESET ALL DATA':
        return jsonify({'error': 'Type RESET ALL DATA to confirm.'}), 400
    protected = {'users', 'permissions', 'role_permissions', 'user_permissions', 'system_settings', 'alembic_version'}
    try:
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 0'))
        deleted_tables = []
        for table in reversed(db.metadata.sorted_tables):
            if table.name not in protected:
                db.session.execute(table.delete())
                deleted_tables.append(table.name)
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
        db.session.commit()
        current_user = get_current_user()
        AuditLog.log_action(
            user_id=current_user.user_id, username=current_user.username,
            action='COMPLETE_SYSTEM_RESET', module='Settings',
            details=f'Complete reset cleared {len(deleted_tables)} data tables; administrators, permissions, and settings were preserved.'
        )
        return jsonify({'message': 'Complete reset finished. Administrators, permissions, and system settings were preserved.'}), 200
    except Exception as exc:
        db.session.rollback()
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
        db.session.commit()
        return jsonify({'error': f'Reset failed: {str(exc)}'}), 400
