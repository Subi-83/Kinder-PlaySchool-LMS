"""
Settings Service - Handles all system settings business logic
"""
from app import db
from app.models.settings import SystemSetting
import json

class SettingsService:
    """Service class for managing system settings"""
    
    @staticmethod
    def get_value(key, default=None):
        """
        Get a setting value by key with proper type conversion
        """
        setting = SystemSetting.query.filter_by(setting_key=key).first()
        if setting:
            return setting.get_value()
        return default
    
    @staticmethod
    def get_string(key, default=''):
        """Get a setting as string"""
        value = SettingsService.get_value(key)
        return str(value) if value is not None else default
    
    @staticmethod
    def get_int(key, default=0):
        """Get a setting as integer"""
        value = SettingsService.get_value(key)
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def get_float(key, default=0.0):
        """Get a setting as float"""
        value = SettingsService.get_value(key)
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def get_bool(key, default=False):
        """Get a setting as boolean"""
        value = SettingsService.get_value(key)
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 'on')
        return default
    
    @staticmethod
    def get_json(key, default=None):
        """Get a setting as JSON"""
        value = SettingsService.get_value(key)
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except:
                return default
        return default
    
    @staticmethod
    def set_value(key, value, updated_by=None):
        """
        Set a setting value
        """
        setting = SystemSetting.query.filter_by(setting_key=key).first()
        if not setting:
            return False, 'Setting not found'
        
        if not setting.is_editable:
            return False, 'Setting is not editable'
        
        setting.set_value(str(value))
        if updated_by:
            setting.updated_by = updated_by
        db.session.commit()
        
        return True, 'Setting updated successfully'
    
    @staticmethod
    def set_multiple(settings_dict, updated_by=None):
        """
        Set multiple settings at once
        """
        updated = []
        errors = []
        
        for key, value in settings_dict.items():
            setting = SystemSetting.query.filter_by(setting_key=key).first()
            if setting and setting.is_editable:
                setting.set_value(str(value))
                if updated_by:
                    setting.updated_by = updated_by
                updated.append(key)
            elif setting and not setting.is_editable:
                errors.append(f'{key} is not editable')
            else:
                errors.append(f'{key} not found')
        
        if updated:
            db.session.commit()
        
        return updated, errors
    
    @staticmethod
    def get_settings_by_category(category):
        """
        Get all settings in a specific category
        """
        settings = SystemSetting.query.filter_by(category=category).all()
        result = {}
        for setting in settings:
            result[setting.setting_key] = setting.get_value()
        return result
    
    @staticmethod
    def get_all_settings():
        """
        Get all system settings as a dictionary
        """
        settings = SystemSetting.query.all()
        result = {}
        for setting in settings:
            result[setting.setting_key] = setting.get_value()
        return result
    
    @staticmethod
    def get_all_settings_with_metadata():
        """
        Get all system settings with full metadata
        """
        return SystemSetting.query.order_by(
            SystemSetting.category,
            SystemSetting.setting_key
        ).all()
    
    @staticmethod
    def get_categories():
        """
        Get all setting categories
        """
        categories = db.session.query(
            SystemSetting.category
        ).distinct().all()
        return [c[0] for c in categories]
    
    @staticmethod
    def initialize_default_settings():
        """
        Initialize default settings if they don't exist
        """
        default_settings = {
            # General Settings
            ('school_name', 'Kinder Park Preschool', 'STRING', 'General', 'School name', True),
            ('school_address', '', 'STRING', 'General', 'School address', True),
            ('school_phone', '', 'STRING', 'General', 'School phone number', True),
            ('school_email', '', 'STRING', 'General', 'School email address', True),
            ('currency', 'INR', 'STRING', 'General', 'Currency symbol', True),
            ('date_format', 'YYYY-MM-DD', 'STRING', 'General', 'Date display format', True),
            ('time_format', '24h', 'STRING', 'General', 'Time display format', True),
            
            # Library Settings
            ('issue_period_days', '14', 'INTEGER', 'Library', 'Default book issue period in days', True),
            ('barcode_lookup_enabled', 'true', 'BOOLEAN', 'Library', 'Enable barcode/ISBN lookup via API', True),
            ('holiday_adjustment', 'true', 'BOOLEAN', 'Library', 'Adjust due dates for holidays', True),
            
            # Charges Settings
            ('late_fine_per_day', '5', 'DECIMAL', 'Charges', 'Late fine per day in currency', True),
            ('damage_small', '100', 'DECIMAL', 'Charges', 'Damage charge - small', True),
            ('damage_large', '200', 'DECIMAL', 'Charges', 'Damage charge - large', True),
            ('damage_default', '300', 'DECIMAL', 'Charges', 'Damage charge - default', True),
            ('lost_book_charge', '500', 'DECIMAL', 'Charges', 'Lost book charge', True),
            
            # Deposit Settings
            ('min_deposit', '300', 'DECIMAL', 'Deposit', 'Minimum required deposit', True),
            ('low_deposit_threshold', '300', 'DECIMAL', 'Deposit', 'Low deposit warning and borrowing-block threshold', True),
            ('deposit_topup_min', '50', 'DECIMAL', 'Deposit', 'Minimum top-up amount', True),
            
            # Security Settings
            ('session_timeout_minutes', '60', 'INTEGER', 'Security', 'Session timeout in minutes', True),
            ('max_login_attempts', '5', 'INTEGER', 'Security', 'Maximum login attempts before lockout', True),
            ('lockout_duration_minutes', '30', 'INTEGER', 'Security', 'Account lockout duration in minutes', True),
            
            # Backup Settings
            ('backup_enabled', 'true', 'BOOLEAN', 'Backup', 'Enable automatic backups', True),
            ('backup_frequency', 'daily', 'STRING', 'Backup', 'Backup frequency (daily/weekly/monthly)', True),
            ('backup_retention_days', '30', 'INTEGER', 'Backup', 'Number of days to keep backups', True),
            ('backup_time', '02:00', 'STRING', 'Backup', 'Time to run daily backup (HH:MM)', True),
            ('backup_reminder_days', '7', 'INTEGER', 'Backup', 'Days between login backup reminders', True),
            ('backup_last_export_date', '', 'STRING', 'Backup', 'Date of the last generated backup', False),
            
            # API Settings
            ('open_library_api_url', 'https://openlibrary.org/api/books', 'STRING', 'API', 'Open Library API URL', True),
            ('open_library_api_timeout', '10', 'INTEGER', 'API', 'API request timeout in seconds', True),
        }
        
        created = []
        for key, value, data_type, category, description, is_editable in default_settings:
            existing = SystemSetting.query.filter_by(setting_key=key).first()
            if not existing:
                setting = SystemSetting(
                    setting_key=key,
                    setting_value=value,
                    data_type=data_type,
                    category=category,
                    description=description,
                    is_editable=is_editable
                )
                db.session.add(setting)
                created.append(key)
        
        if created:
            db.session.commit()
        
        return created
    
    @staticmethod
    def get_library_settings():
        """
        Get all library-related settings
        """
        return SettingsService.get_settings_by_category('Library')
    
    @staticmethod
    def get_charge_settings():
        """
        Get all charge-related settings
        """
        return SettingsService.get_settings_by_category('Charges')
    
    @staticmethod
    def get_deposit_settings():
        """
        Get all deposit-related settings
        """
        return SettingsService.get_settings_by_category('Deposit')
    
    @staticmethod
    def calculate_fine(days_overdue):
        """
        Calculate fine based on days overdue
        """
        late_fine_per_day = SettingsService.get_float('late_fine_per_day', 5)
        return days_overdue * late_fine_per_day
    
    @staticmethod
    def get_damage_charge(severity='DEFAULT'):
        """
        Get damage charge based on severity
        """
        if severity == 'SMALL':
            return SettingsService.get_float('damage_small', 100)
        elif severity == 'LARGE':
            return SettingsService.get_float('damage_large', 200)
        else:
            return SettingsService.get_float('damage_default', 300)
    
    @staticmethod
    def get_lost_book_charge():
        """
        Get lost book charge
        """
        return SettingsService.get_float('lost_book_charge', 500)
