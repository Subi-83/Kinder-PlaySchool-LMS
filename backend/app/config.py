"""
Configuration - Application configuration settings for Kinder Park Library System
"""
import os
from dotenv import load_dotenv
from datetime import timedelta

# Load .env relative to this file's location, not the current working
# directory. If the app is launched from a different CWD (e.g. an IDE
# running seed.py or run.py from the project root instead of backend/),
# a CWD-relative load_dotenv() can silently fail to find the .env file,
# leaving every secret (JWT_SECRET_KEY, DB credentials, etc.) on its
# hardcoded fallback instead of the real value. That's especially
# dangerous for JWT_SECRET_KEY: a token minted by one process (using
# the real secret) will fail to verify against another process that
# didn't load the .env (and is using the fallback secret) — every
# authenticated request after login returns 401 even though the token
# looks valid.
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(dotenv_path=_ENV_PATH)

class Config:
    """Base configuration class"""
    
    # ============================================================
    # FLASK CONFIGURATION
    # ============================================================
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    TESTING = os.getenv('TESTING', 'False').lower() == 'true'
    
    # ============================================================
    # DATABASE CONFIGURATION
    # ============================================================
    
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'kinder_park_library')
    DB_PORT = os.getenv('DB_PORT', '3306')
    
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', 10)),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 3600)),
        'pool_pre_ping': True,
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', 30)),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 20)),
    }
    
    # ============================================================
    # JWT CONFIGURATION
    # ============================================================
    
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'liugiwquegvbcg;oiwiqeucghhogh2qkedfgd8uigiu22bdfkjcguWGHFCBC;OIUUG;WWEIOFUUG8GOBF;O234HYCWEEC;OIICHH2WE')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 7))
    )
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ACCESS_CSRF_HEADER_NAME = 'X-CSRF-TOKEN'
    JWT_CSRF_IN_COOKIES = False
    
    # ============================================================
    # CORS CONFIGURATION
    # ============================================================
    
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    CORS_SUPPORTS_CREDENTIALS = True
    
    # ============================================================
    # API CONFIGURATION
    # ============================================================
    
    API_TITLE = 'Kinder Park Library Management System API'
    API_VERSION = '1.0.0'
    API_PREFIX = '/api'
    
    # Open Library API
    OPEN_LIBRARY_API_URL = os.getenv(
        'OPEN_LIBRARY_API_URL',
        'https://openlibrary.org/api/books'
    )
    OPEN_LIBRARY_API_TIMEOUT = int(os.getenv('OPEN_LIBRARY_API_TIMEOUT', 10))
    OPEN_LIBRARY_API_RETRIES = int(os.getenv('OPEN_LIBRARY_API_RETRIES', 3))
    
    # ============================================================
    # SECURITY CONFIGURATION
    # ============================================================
    
    # Password hashing
    BCRYPT_ROUNDS = int(os.getenv('BCRYPT_ROUNDS', 12))
    
    # Session
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(
        hours=int(os.getenv('SESSION_LIFETIME_HOURS', 24))
    )
    
    # Rate limiting
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'True').lower() == 'true'
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100 per hour')
    
    # ============================================================
    # FILE UPLOAD CONFIGURATION
    # ============================================================
    
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
    
    # ============================================================
    # BACKUP CONFIGURATION
    # ============================================================
    
    BACKUP_DIR = os.getenv('BACKUP_DIR', 'backups')
    BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', 30))
    BACKUP_ENABLED = os.getenv('BACKUP_ENABLED', 'True').lower() == 'true'
    
    # ============================================================
    # LOGGING CONFIGURATION
    # ============================================================
    
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'app.log')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
    
    # ============================================================
    # EMAIL CONFIGURATION
    # ============================================================
    
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@kinderpark.com')
    
    # ============================================================
    # FRONTEND CONFIGURATION
    # ============================================================
    
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    FRONTEND_RESET_PASSWORD_URL = f"{FRONTEND_URL}/reset-password"
    
    # ============================================================
    # ENVIRONMENT-SPECIFIC CONFIGURATION
    # ============================================================
    
    @classmethod
    def get_env(cls):
        """Get the current environment"""
        return os.getenv('FLASK_ENV', 'development')
    
    @classmethod
    def is_development(cls):
        """Check if in development environment"""
        return cls.get_env() == 'development'
    
    @classmethod
    def is_production(cls):
        """Check if in production environment"""
        return cls.get_env() == 'production'
    
    @classmethod
    def is_testing(cls):
        """Check if in testing environment"""
        return cls.get_env() == 'testing' or cls.TESTING

class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False
    
    # Development-specific settings
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_RECORD_QUERIES = True
    
    # Less strict security for development
    SESSION_COOKIE_SECURE = False
    JWT_COOKIE_SECURE = False
    
    # Enable more logging
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing environment configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False
    
    # Shorter token expiry for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(minutes=30)

class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    
    # Production security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    JWT_COOKIE_SECURE = True
    
    # Strict CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')
    
    # Logging
    LOG_LEVEL = 'WARNING'
    
    # Disable SQL echoing
    SQLALCHEMY_ECHO = False
    
    # More conservative timeouts
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get the appropriate configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, DevelopmentConfig)