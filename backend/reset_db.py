#!/usr/bin/env python
"""
DEV-ONLY: Drop every table this app knows about and recreate them from
the current SQLAlchemy models, then run seed.py's steps fresh.

You've hit schema drift on more than one table now (academic_years,
programmes, and likely others) — the database has tables from an
earlier version of the models, and db.create_all() only creates
MISSING tables, it never alters existing ones. The clean fix for a
disposable dev database is to drop everything the app owns and let
it recreate them correctly.

⚠️  THIS DELETES ALL DATA IN THE TABLES THIS APP MANAGES. Only run
this against a dev/test database you're OK losing data in. It will
NOT touch tables outside the app's models (there aren't any here,
but if you've pointed DB_NAME at a shared database, stop and check
first).

Usage:
    python reset_db.py            # asks for confirmation
    python reset_db.py --yes      # skips the confirmation prompt
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.config import get_config


def main():
    skip_confirm = '--yes' in sys.argv or '-y' in sys.argv

    app = create_app(get_config())
    with app.app_context():
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        # Don't print credentials if they're embedded in the URL.
        safe_url = db_url.split('@')[-1] if '@' in db_url else db_url
        print(f"Target database: {safe_url}")

        if not skip_confirm:
            answer = input(
                "This will DROP ALL TABLES this app manages and recreate them "
                "empty. Continue? [y/N] "
            ).strip().lower()
            if answer != 'y':
                print("Aborted — no changes made.")
                return

        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables from current models...")
        db.create_all()
        print("Done. Tables now match the current models exactly.")
        print("\nNext step:")
        print("    python seed.py")


if __name__ == '__main__':
    main()
