"""
Models Package - Contains all database models for Kinder Park Library System
"""

from app.models.user import User, Permission, RolePermission, UserPermission
from app.models.student import Student, MemberGroup
from app.models.academic import AcademicYear, Programme, StudentEnrollment, GradeLevel
from app.models.book import BookLevel, BookCategory, BookTitle, BookCopy, BookLevelSequence
from app.models.library import BookIssue, BookReturn, DamageLossRecord
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.subscription import SubscriptionPlan, StudentSubscription
from app.models.settings import SystemSetting, Holiday
from app.models.audit import AuditLog

__all__ = [
    # User models
    'User',
    'Permission',
    'RolePermission',
    'UserPermission',
    
    # Student models
    'Student',
    'MemberGroup',
    
    # Academic models
    'AcademicYear',
    'Programme',
    'StudentEnrollment',
    'GradeLevel',
    
    # Book models
    'BookLevel',
    'BookCategory',
    'BookTitle',
    'BookCopy',
    'BookLevelSequence',
    
    # Library models
    'BookIssue',
    'BookReturn',
    'DamageLossRecord',
    
    # Deposit models
    'DepositAccount',
    'DepositTransaction',
    
    # Subscription models
    'SubscriptionPlan',
    'StudentSubscription',
    
    # Settings models
    'SystemSetting',
    'Holiday',
    
    # Audit models
    'AuditLog'
]
