"""
WSGI Entry Point - For production deployment
"""
from app import create_app
from app.config import ProductionConfig

# Create application for production
app = create_app(ProductionConfig)

# For Gunicorn/uWSGI
if __name__ == '__main__':
    app.run()