"""
Helpers - Utility functions for the Kinder Park Library System
"""
import re
import json
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union
import hashlib

# ============================================================
# ID GENERATION
# ============================================================

def generate_uid(prefix: str = 'KP', length: int = 6) -> str:
    """
    Generate a unique ID with prefix and padded number
    Example: KP000125
    """
    import random
    import string
    
    # Generate random alphanumeric suffix
    suffix = ''.join(random.choices(string.digits, k=length))
    return f"{prefix}{suffix}"

def generate_barcode(prefix: str = 'BK', length: int = 8) -> str:
    """
    Generate a barcode for books
    Example: BK10000001
    """
    import random
    import string
    
    suffix = ''.join(random.choices(string.digits, k=length))
    return f"{prefix}{suffix}"

def generate_roll_number(year: str, programme_code: str, student_id: int, padding: int = 4) -> str:
    """
    Generate a roll number for a student
    Example: 26FLY0001
    """
    return f"{year}{programme_code}{str(student_id).zfill(padding)}"

# ============================================================
# DATE AND TIME HELPERS
# ============================================================

def calculate_age(birth_date: date) -> int:
    """
    Calculate age from birth date
    """
    if not birth_date:
        return 0
    today = datetime.now().date()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )

def format_date(date_obj: Optional[Union[date, datetime]], format_str: str = '%Y-%m-%d') -> str:
    """
    Format a date object to string
    """
    if not date_obj:
        return ''
    if isinstance(date_obj, datetime):
        return date_obj.strftime(format_str)
    return date_obj.strftime(format_str)

def format_datetime(dt: Optional[datetime], format_str: str = '%Y-%m-%d %H:%M:%S') -> str:
    """
    Format a datetime object to string
    """
    if not dt:
        return ''
    return dt.strftime(format_str)

def parse_date(date_str: str, format_str: str = '%Y-%m-%d') -> Optional[date]:
    """
    Parse a date string to date object
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, format_str).date()
    except ValueError:
        return None

def parse_datetime(dt_str: str, format_str: str = '%Y-%m-%d %H:%M:%S') -> Optional[datetime]:
    """
    Parse a datetime string to datetime object
    """
    if not dt_str:
        return None
    try:
        return datetime.strptime(dt_str, format_str)
    except ValueError:
        return None

def get_date_range(start_date: date, end_date: date) -> List[date]:
    """
    Get a list of dates between start_date and end_date (inclusive)
    """
    if not start_date or not end_date:
        return []
    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)
    return dates

def get_days_between(start_date: date, end_date: date) -> int:
    """
    Get the number of days between two dates
    """
    if not start_date or not end_date:
        return 0
    return (end_date - start_date).days

def get_current_academic_year() -> Optional[str]:
    """
    Get the current academic year based on current date
    Returns format: '2026-27'
    """
    today = datetime.now().date()
    year = today.year
    # If month is April or later, academic year is current_year - (next_year)
    if today.month >= 4:
        return f"{year}-{str(year + 1)[-2:]}"
    else:
        return f"{year - 1}-{str(year)[-2:]}"

def is_holiday(date_obj: date, holidays: List[date]) -> bool:
    """
    Check if a date is a holiday
    """
    if not date_obj or not holidays:
        return False
    return date_obj in holidays

def get_holidays_in_range(start_date: date, end_date: date, holidays: List[date]) -> List[date]:
    """
    Get holidays within a date range
    """
    if not start_date or not end_date or not holidays:
        return []
    return [h for h in holidays if start_date <= h <= end_date]

# ============================================================
# VALIDATION HELPERS
# ============================================================

def is_valid_email(email: str) -> bool:
    """
    Validate email address format
    """
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def is_valid_phone(phone: str) -> bool:
    """
    Validate phone number format (10 digits)
    """
    if not phone:
        return False
    return bool(re.match(r'^[0-9]{10}$', phone))

def is_valid_date(date_str: str, format_str: str = '%Y-%m-%d') -> bool:
    """
    Check if a string is a valid date
    """
    if not date_str:
        return False
    try:
        datetime.strptime(date_str, format_str)
        return True
    except ValueError:
        return False

def is_valid_isbn(isbn: str) -> bool:
    """
    Validate ISBN-10 or ISBN-13
    """
    if not isbn:
        return False
    # Remove hyphens and spaces
    isbn = re.sub(r'[-\s]', '', isbn)
    
    # Check ISBN-10
    if len(isbn) == 10:
        if not isbn[:-1].isdigit():
            return False
        total = 0
        for i in range(9):
            total += int(isbn[i]) * (10 - i)
        check = (11 - (total % 11)) % 11
        return check == (10 if isbn[9].upper() == 'X' else int(isbn[9]))
    
    # Check ISBN-13
    elif len(isbn) == 13:
        if not isbn.isdigit():
            return False
        total = 0
        for i in range(12):
            total += int(isbn[i]) * (1 if i % 2 == 0 else 3)
        check = (10 - (total % 10)) % 10
        return check == int(isbn[12])
    
    return False

def validate_required_fields(data: Dict, required_fields: List[str]) -> tuple:
    """
    Validate that all required fields are present in data
    Returns: (is_valid, missing_fields)
    """
    missing = [field for field in required_fields if field not in data or data[field] is None or data[field] == '']
    return len(missing) == 0, missing

def sanitize_string(text: str) -> str:
    """
    Sanitize a string (remove special characters, extra spaces)
    """
    if not text:
        return ''
    # Remove extra spaces
    text = ' '.join(text.split())
    # Remove special characters (keep alphanumeric, spaces, and basic punctuation)
    text = re.sub(r'[^a-zA-Z0-9\s\.\-\_\,\(\)]', '', text)
    return text.strip()

def slugify(text: str) -> str:
    """
    Convert text to URL-friendly slug
    """
    if not text:
        return ''
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def truncate_text(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """
    Truncate text to a maximum length
    """
    if not text:
        return ''
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

# ============================================================
# FORMATTING HELPERS
# ============================================================

def format_currency(amount: Union[int, float, Decimal], currency: str = '₹') -> str:
    """
    Format amount as currency
    """
    if amount is None:
        return f"{currency}0.00"
    return f"{currency}{float(amount):,.2f}"

def get_percentage(part: float, total: float, decimals: int = 2) -> float:
    """
    Calculate percentage
    """
    if total == 0:
        return 0.0
    return round((part / total) * 100, decimals)

def safe_int(value: Any, default: int = 0) -> int:
    """
    Safely convert value to int
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value: Any, default: float = 0.0) -> float:
    """
    Safely convert value to float
    """
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_str(value: Any, default: str = '') -> str:
    """
    Safely convert value to string
    """
    if value is None:
        return default
    return str(value)

def safe_bool(value: Any, default: bool = False) -> bool:
    """
    Safely convert value to boolean
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    if isinstance(value, (int, float)):
        return bool(value)
    return default

# ============================================================
# REQUEST HELPERS
# ============================================================

def get_client_ip(request) -> str:
    """
    Get client IP address from request
    """
    if not request:
        return ''
    # Check for proxy headers
    ip = request.headers.get('X-Forwarded-For', '')
    if ip:
        return ip.split(',')[0].strip()
    return request.remote_addr or ''

def get_user_agent(request) -> str:
    """
    Get user agent from request
    """
    if not request:
        return ''
    return request.headers.get('User-Agent', '')

# ============================================================
# STATUS HELPERS
# ============================================================

def get_status_badge_color(status: str) -> str:
    """
    Get badge color for status
    """
    status_colors = {
        'ACTIVE': 'success',
        'INACTIVE': 'danger',
        'PENDING': 'warning',
        'COMPLETED': 'info',
        'CANCELLED': 'danger',
        'EXPIRED': 'secondary',
        'AVAILABLE': 'success',
        'ISSUED': 'warning',
        'DAMAGED': 'danger',
        'LOST': 'danger',
        'RESERVED': 'info',
        'OVERDUE': 'danger',
        'RETURNED': 'success',
    }
    return status_colors.get(status.upper(), 'secondary')

def get_status_label(status: str) -> str:
    """
    Get human-readable status label
    """
    status_labels = {
        'ACTIVE': 'Active',
        'INACTIVE': 'Inactive',
        'PENDING': 'Pending',
        'COMPLETED': 'Completed',
        'CANCELLED': 'Cancelled',
        'EXPIRED': 'Expired',
        'AVAILABLE': 'Available',
        'ISSUED': 'Issued',
        'DAMAGED': 'Damaged',
        'LOST': 'Lost',
        'RESERVED': 'Reserved',
        'OVERDUE': 'Overdue',
        'RETURNED': 'Returned',
        'WITHDRAWN': 'Withdrawn',
        'TRANSFERRED': 'Transferred',
    }
    return status_labels.get(status.upper(), status.title())

def get_enum_choices(enum_class) -> List[tuple]:
    """
    Get choices from enum for form dropdowns
    """
    if not enum_class:
        return []
    return [(e.value, e.name.title()) for e in enum_class]

# ============================================================
# FINE CALCULATION
# ============================================================

def calculate_fine(days_overdue: int, fine_per_day: float = 5.0, max_fine: Optional[float] = None) -> float:
    """
    Calculate fine based on days overdue
    """
    if days_overdue <= 0:
        return 0.0
    
    fine = days_overdue * fine_per_day
    if max_fine and fine > max_fine:
        return max_fine
    return fine

# ============================================================
# JSON HELPERS
# ============================================================

def is_json(data: str) -> bool:
    """
    Check if a string is valid JSON
    """
    if not data:
        return False
    try:
        json.loads(data)
        return True
    except ValueError:
        return False

def json_serialize(obj: Any) -> str:
    """
    Serialize object to JSON
    """
    try:
        return json.dumps(obj, default=str)
    except (TypeError, ValueError):
        return '{}'

def json_deserialize(json_str: str) -> Optional[Dict]:
    """
    Deserialize JSON string to dict
    """
    if not json_str:
        return None
    try:
        return json.loads(json_str)
    except ValueError:
        return None

# ============================================================
# DICTIONARY HELPERS
# ============================================================

def convert_to_dict(obj: Any) -> Dict:
    """
    Convert object to dictionary if it has to_dict method
    """
    if hasattr(obj, 'to_dict'):
        return obj.to_dict()
    if isinstance(obj, dict):
        return obj
    if isinstance(obj, (list, tuple)):
        return [convert_to_dict(item) for item in obj]
    return obj

def deep_merge(dict1: Dict, dict2: Dict) -> Dict:
    """
    Deep merge two dictionaries
    """
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

# ============================================================
# LOGGING HELPERS
# ============================================================

def log_error(message: str, error: Optional[Exception] = None, context: Optional[Dict] = None):
    """
    Log error message
    """
    import logging
    logger = logging.getLogger(__name__)
    if error:
        logger.error(f"{message}: {str(error)}", exc_info=True)
    else:
        logger.error(message)
    if context:
        logger.debug(f"Context: {json_serialize(context)}")

def log_info(message: str, context: Optional[Dict] = None):
    """
    Log info message
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(message)
    if context:
        logger.debug(f"Context: {json_serialize(context)}")

def log_warning(message: str, context: Optional[Dict] = None):
    """
    Log warning message
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(message)
    if context:
        logger.debug(f"Context: {json_serialize(context)}")

# ============================================================
# HASHING HELPERS
# ============================================================

def hash_string(text: str, algorithm: str = 'sha256') -> str:
    """
    Hash a string using the specified algorithm
    """
    if not text:
        return ''
    hash_obj = hashlib.new(algorithm)
    hash_obj.update(text.encode('utf-8'))
    return hash_obj.hexdigest()

def generate_random_token(length: int = 32) -> str:
    """
    Generate a random token
    """
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_uuid() -> str:
    """
    Generate a UUID
    """
    return str(uuid.uuid4())

# ============================================================
# VALIDATION SUMMARY
# ============================================================

def validate_student_data(data: Dict) -> tuple:
    """
    Validate student data
    Returns: (is_valid, errors)
    """
    errors = {}
    
    # Required fields
    if not data.get('student_name'):
        errors['student_name'] = 'Student name is required'
    
    if not data.get('date_of_birth'):
        errors['date_of_birth'] = 'Date of birth is required'
    elif data.get('date_of_birth'):
        # Check if date is valid and not in future
        dob = parse_date(data['date_of_birth'])
        if not dob:
            errors['date_of_birth'] = 'Invalid date format'
        elif dob > datetime.now().date():
            errors['date_of_birth'] = 'Date of birth cannot be in the future'
    
    # Email validation
    if data.get('mother_email') and not is_valid_email(data['mother_email']):
        errors['mother_email'] = 'Invalid email format'
    if data.get('father_email') and not is_valid_email(data['father_email']):
        errors['father_email'] = 'Invalid email format'
    
    # Phone validation
    if data.get('mother_phone') and not is_valid_phone(data['mother_phone']):
        errors['mother_phone'] = 'Invalid phone number (must be 10 digits)'
    if data.get('father_phone') and not is_valid_phone(data['father_phone']):
        errors['father_phone'] = 'Invalid phone number (must be 10 digits)'
    
    return len(errors) == 0, errors

def validate_book_data(data: Dict) -> tuple:
    """
    Validate book data
    Returns: (is_valid, errors)
    """
    errors = {}
    
    # Required fields
    if not data.get('title'):
        errors['title'] = 'Book title is required'
    
    if not data.get('author'):
        errors['author'] = 'Author is required'
    
    # ISBN validation (optional)
    if data.get('isbn') and not is_valid_isbn(data['isbn']):
        errors['isbn'] = 'Invalid ISBN format'
    
    return len(errors) == 0, errors

def validate_user_data(data: Dict) -> tuple:
    """
    Validate user data
    Returns: (is_valid, errors)
    """
    errors = {}
    
    # Required fields
    if not data.get('username'):
        errors['username'] = 'Username is required'
    elif len(data.get('username', '')) < 3:
        errors['username'] = 'Username must be at least 3 characters'
    
    if not data.get('email'):
        errors['email'] = 'Email is required'
    elif not is_valid_email(data['email']):
        errors['email'] = 'Invalid email format'
    
    if not data.get('password'):
        errors['password'] = 'Password is required'
    elif len(data.get('password', '')) < 6:
        errors['password'] = 'Password must be at least 6 characters'
    
    return len(errors) == 0, errors

# ============================================================
# EXPORT ALL HELPER FUNCTIONS
# ============================================================

__all__ = [
    'generate_uid',
    'generate_barcode',
    'generate_roll_number',
    'calculate_age',
    'format_date',
    'format_datetime',
    'parse_date',
    'parse_datetime',
    'get_date_range',
    'get_days_between',
    'get_current_academic_year',
    'is_holiday',
    'get_holidays_in_range',
    'is_valid_email',
    'is_valid_phone',
    'is_valid_date',
    'is_valid_isbn',
    'validate_required_fields',
    'sanitize_string',
    'slugify',
    'truncate_text',
    'format_currency',
    'get_percentage',
    'safe_int',
    'safe_float',
    'safe_str',
    'safe_bool',
    'get_client_ip',
    'get_user_agent',
    'get_status_badge_color',
    'get_status_label',
    'get_enum_choices',
    'calculate_fine',
    'is_json',
    'json_serialize',
    'json_deserialize',
    'convert_to_dict',
    'deep_merge',
    'log_error',
    'log_info',
    'log_warning',
    'hash_string',
    'generate_random_token',
    'generate_uuid',
    'validate_student_data',
    'validate_book_data',
    'validate_user_data'
]