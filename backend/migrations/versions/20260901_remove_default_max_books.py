"""Remove obsolete system-wide maximum-book settings.

Revision ID: 20260901_remove_default_max_books
Revises: 20260901_new_page_permissions
"""
from alembic import op

revision = '20260901_remove_default_max_books'
down_revision = '20260901_new_page_permissions'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("DELETE FROM system_settings WHERE setting_key IN ('max_books_default', 'max_books_per_student')")


def downgrade():
    op.execute(
        "INSERT IGNORE INTO system_settings "
        "(setting_key, setting_value, data_type, category, description, is_editable, created_at, updated_at) "
        "VALUES ('max_books_per_student', '3', 'INTEGER', 'Library', "
        "'Maximum books a student can borrow', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
