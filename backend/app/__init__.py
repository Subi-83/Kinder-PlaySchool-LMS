"""
Application Factory - Creates and configures the Flask application
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from flask_cors import CORS  # type: ignore
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate  # type: ignore
from flask_jwt_extended import JWTManager
from datetime import datetime
import sys

# ============================================================
# EXTENSIONS INITIALIZATION
# ============================================================

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app(config_class=None):
    """Application factory function"""
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    
    # Load configuration
    if config_class:
        app.config.from_object(config_class)
    else:
        from app.config import get_config
        app.config.from_object(get_config())
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)  # type: ignore
    jwt.init_app(app)
    
    CORS(app,  # type: ignore 
         origins=app.config.get('CORS_ORIGINS', ['*']),
         supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', True),
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    )
    
    # Setup logging
    setup_logging(app)
    
    # JWT Error Handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({'error': 'Unauthorized access', 'message': 'Valid authentication token required'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({'error': 'Invalid token', 'message': 'The provided token is invalid or expired'}), 401
    
    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({'error': 'Token expired', 'message': 'The provided token has expired. Please login again.'}), 401
    
    # Register blueprints
    from app.routes import register_blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    return app

def register_error_handlers(app):
    """Register custom error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': str(error) or 'Invalid request parameters'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': 'You do not have permission to access this resource'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': 'The requested resource was not found'}), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'error': 'Method Not Allowed', 'message': 'The HTTP method is not allowed for this endpoint'}), 405
    
    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"Internal server error: {error}", exc_info=True)
        return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred'}), 500

def setup_logging(app):
    """Configure application logging"""
    
    # Create logs directory
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_format = logging.Formatter(
        app.config.get('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'),
        app.config.get('LOG_DATE_FORMAT', '%Y-%m-%d %H:%M:%S')
    )
    console_handler.setFormatter(console_format)
    root_logger.addHandler(console_handler)
    
    # File handler
    log_filename = os.path.basename(app.config.get('LOG_FILE', 'app.log'))
    log_file = os.path.join(log_dir, log_filename)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(console_format)
    root_logger.addHandler(file_handler)
    
    app.logger.info("Logging configured successfully")
    app.logger.info(f"Environment: {app.config.get('FLASK_ENV', 'development')}")

