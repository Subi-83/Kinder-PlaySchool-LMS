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

# Create application
app = create_app(get_config())

if __name__ == '__main__':
    # Get host and port from environment or use defaults
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Run the application
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True,
        # Avoid watchdog restarts that interrupt authenticated requests.
        use_reloader=False
    )
