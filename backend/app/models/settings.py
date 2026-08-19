from app import db
from datetime import datetime
import json

class SystemSetting(db.Model):
    """System Setting Model - Stores system configuration"""
    __tablename__ = 'system_settings'
    
    setting_id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text, nullable=True)
    data_type = db.Column(db.Enum('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON', 'DATE'), default='STRING')
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_editable = db.Column(db.Boolean, default=True)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    updater = db.relationship('User', backref='settings_updated')
    
    def __repr__(self):
        return f'<SystemSetting {self.setting_key}={self.setting_value}>'
    
    def get_value(self):
        """Get the setting value with proper type conversion"""
        if self.data_type == 'INTEGER':
            try:
                return int(self.setting_value)
            except (ValueError, TypeError):
                return None
        elif self.data_type == 'DECIMAL':
            try:
                return float(self.setting_value)
            except (ValueError, TypeError):
                return None
        elif self.data_type == 'BOOLEAN':
            if isinstance(self.setting_value, bool):
                return self.setting_value
            if isinstance(self.setting_value, str):
                return self.setting_value.lower() in ('true', '1', 'yes', 'on')
            return bool(self.setting_value)
        elif self.data_type == 'JSON':
            try:
                return json.loads(self.setting_value)
            except:
                return None
        elif self.data_type == 'DATE':
            try:
                return datetime.strptime(self.setting_value, '%Y-%m-%d').date()
            except:
                return None
        else:  # STRING
            return self.setting_value
    
    def set_value(self, value):
        """Set the setting value (converts to string for storage)"""
        self.setting_value = str(value)
    
    def to_dict(self):
        return {
            'setting_id': self.setting_id,
            'setting_key': self.setting_key,
            'setting_value': self.get_value(),
            'data_type': self.data_type,
            'category': self.category,
            'description': self.description,
            'is_editable': self.is_editable,
            'updated_by': self.updated_by,
            'updated_by_name': self.updater.username if self.updater else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    @classmethod
    def get_by_category(cls, category):
        """Get all settings in a category"""
        return cls.query.filter_by(category=category).all()
    
    @classmethod
    def get_value_by_key(cls, key, default=None):
        """Get a setting value by key"""
        setting = cls.query.filter_by(setting_key=key).first()
        if setting:
            return setting.get_value()
        return default


class Holiday(db.Model):
    """Holiday Model - Stores school holidays"""
    __tablename__ = 'holidays'
    
    holiday_id = db.Column(db.Integer, primary_key=True)
    holiday_name = db.Column(db.String(100), nullable=False)
    holiday_date = db.Column(db.Date, nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Holiday {self.holiday_name} - {self.holiday_date}>'
    
    def to_dict(self):
        return {
            'holiday_id': self.holiday_id,
            'holiday_name': self.holiday_name,
            'holiday_date': self.holiday_date.strftime('%Y-%m-%d') if self.holiday_date else None,
            'is_recurring': self.is_recurring,
            'description': self.description,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
    
    @classmethod
    def get_holidays_in_range(cls, start_date, end_date):
        """Get holidays within a date range"""
        return cls.query.filter(
            cls.holiday_date.between(start_date, end_date)
        ).order_by(cls.holiday_date).all()
    
    @classmethod
    def is_holiday(cls, date):
        """Check if a given date is a holiday"""
        return cls.query.filter_by(holiday_date=date).first() is not None