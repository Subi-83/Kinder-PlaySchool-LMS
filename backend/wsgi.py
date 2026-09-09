"""
WSGI Entry Point - For production deployment
"""
from app import create_app
from app.config import get_config

# WSGI entry point for process managers.
app = create_app(get_config())

# For Gunicorn/uWSGI
if __name__ == '__main__':
    app.run()
