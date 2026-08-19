from flask import Blueprint

def register_blueprints(app):
    """Register all route blueprints with the Flask app"""
    
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.students import students_bp
    from app.routes.books import books_bp
    from app.routes.library import library_bp
    from app.routes.deposits import deposits_bp
    from app.routes.subscriptions import subscriptions_bp
    from app.routes.reports import reports_bp
    from app.routes.settings import settings_bp
    from app.routes.audit import audit_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp)  # ✅ This must be here
    app.register_blueprint(users_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(deposits_bp)
    app.register_blueprint(subscriptions_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(audit_bp)
    
    return app