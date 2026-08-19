"""
Audit Service - Handles all audit logging business logic
"""
from app import db
from app.models.audit import AuditLog
from app.models.user import User
from datetime import datetime, timedelta

class AuditService:
    """Service class for managing audit logs"""
    
    @staticmethod
    def log_action(user_id=None, username=None, action=None, module=None,
                   record_id=None, details=None, ip_address=None, user_agent=None):
        """
        Log an action in the audit trail
        """
        if not username and user_id:
            user = User.query.get(user_id)
            if user:
                username = user.username
        
        log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            module=module,
            record_id=str(record_id) if record_id else None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(log)
        db.session.commit()
        
        return log
    
    @staticmethod
    def get_recent_logs(limit=100, offset=0):
        """
        Get most recent audit logs
        """
        return AuditLog.query.order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_logs_by_user(user_id, limit=100, offset=0):
        """
        Get audit logs for a specific user
        """
        return AuditLog.query.filter_by(
            user_id=user_id
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_logs_by_module(module, limit=100, offset=0):
        """
        Get audit logs for a specific module
        """
        return AuditLog.query.filter_by(
            module=module
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_logs_by_action(action, limit=100, offset=0):
        """
        Get audit logs for a specific action
        """
        return AuditLog.query.filter_by(
            action=action
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_logs_by_date_range(start_date, end_date, limit=100, offset=0):
        """
        Get audit logs within a date range
        """
        return AuditLog.query.filter(
            AuditLog.created_at.between(start_date, end_date)
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_logs_by_record(record_id, limit=100, offset=0):
        """
        Get audit logs for a specific record
        """
        return AuditLog.query.filter_by(
            record_id=str(record_id)
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def search_logs(query, limit=100, offset=0):
        """
        Search audit logs by action, module, or details
        """
        return AuditLog.query.filter(
            db.or_(
                AuditLog.action.like(f'%{query}%'),
                AuditLog.module.like(f'%{query}%'),
                AuditLog.details.like(f'%{query}%'),
                AuditLog.username.like(f'%{query}%')
            )
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_logs_summary(start_date=None, end_date=None):
        """
        Get summary statistics of audit logs
        """
        query = AuditLog.query
        
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        total = query.count()
        
        # Count by module
        module_counts = db.session.query(
            AuditLog.module,
            db.func.count(AuditLog.audit_id).label('count')
        ).filter(
            AuditLog.created_at >= start_date if start_date else True,
            AuditLog.created_at <= end_date if end_date else True
        ).group_by(AuditLog.module).all()
        
        # Count by action
        action_counts = db.session.query(
            AuditLog.action,
            db.func.count(AuditLog.audit_id).label('count')
        ).filter(
            AuditLog.created_at >= start_date if start_date else True,
            AuditLog.created_at <= end_date if end_date else True
        ).group_by(AuditLog.action).all()
        
        # Count by user
        user_counts = db.session.query(
            AuditLog.username,
            db.func.count(AuditLog.audit_id).label('count')
        ).filter(
            AuditLog.created_at >= start_date if start_date else True,
            AuditLog.created_at <= end_date if end_date else True
        ).group_by(AuditLog.username).all()
        
        return {
            'total': total,
            'by_module': {m[0] or 'Unknown': m[1] for m in module_counts},
            'by_action': {a[0]: a[1] for a in action_counts},
            'by_user': {u[0] or 'Unknown': u[1] for u in user_counts}
        }
    
    @staticmethod
    def cleanup_old_logs(days_to_keep=365):
        """
        Delete audit logs older than specified days
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted = AuditLog.query.filter(
            AuditLog.created_at < cutoff_date
        ).delete()
        
        db.session.commit()
        
        return deleted
    
    @staticmethod
    def get_user_activity_report(user_id, days=30):
        """
        Get user activity report for the last N days
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        logs = AuditLog.query.filter(
            AuditLog.user_id == user_id,
            AuditLog.created_at >= cutoff_date
        ).order_by(
            AuditLog.created_at.desc()
        ).all()
        
        # Group by day
        daily_activity = {}
        for log in logs:
            day = log.created_at.strftime('%Y-%m-%d')
            if day not in daily_activity:
                daily_activity[day] = {'count': 0, 'actions': []}
            daily_activity[day]['count'] += 1
            daily_activity[day]['actions'].append({
                'action': log.action,
                'module': log.module,
                'time': log.created_at.strftime('%H:%M'),
                'details': log.details
            })
        
        return {
            'user_id': user_id,
            'period_days': days,
            'total_actions': len(logs),
            'daily_activity': daily_activity
        }
    
    @staticmethod
    def get_module_activity_report(module, days=30):
        """
        Get module activity report for the last N days
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        logs = AuditLog.query.filter(
            AuditLog.module == module,
            AuditLog.created_at >= cutoff_date
        ).order_by(
            AuditLog.created_at.desc()
        ).all()
        
        # Group by action
        action_counts = {}
        for log in logs:
            if log.action not in action_counts:
                action_counts[log.action] = 0
            action_counts[log.action] += 1
        
        return {
            'module': module,
            'period_days': days,
            'total_actions': len(logs),
            'action_counts': action_counts,
            'recent_actions': [log.to_dict() for log in logs[:20]]
        }