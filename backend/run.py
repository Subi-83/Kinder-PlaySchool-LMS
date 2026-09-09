#!/usr/bin/env python
"""
Application Entry Point - Runs the Flask application
"""
import os
import sys

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.config import get_config
from waitress import serve

# Create application
app = create_app(get_config())

if __name__ == '__main__':
    # Get host and port from environment or use defaults
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    threads = int(os.getenv('WAITRESS_THREADS', 8))

    # Waitress is a production-style WSGI server. It binds to all interfaces
    # by default here, so the LMS is available through the machine's LAN IP.
    serve(
        app,
        host=host,
        port=port,
        threads=threads,
    )
