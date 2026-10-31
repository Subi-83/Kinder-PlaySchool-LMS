"""Add default Saturday and Sunday weekly holiday rule.

Revision ID: 20261031_weekly_holiday_rule
Revises: 20261031_book_catalog_indexes
"""
from alembic import op


revision = '20261031_weekly_holiday_rule'
down_revision = '20261031_book_catalog_indexes'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "INSERT IGNORE INTO system_settings "
        "(setting_key, setting_value, data_type, category, description, is_editable, created_at, updated_at) "
        "VALUES ('weekly_holiday_days', '[5, 6]', 'JSON', 'Library', "
        "'Weekly holidays (Monday=0 through Sunday=6)', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )


def downgrade():
    op.execute("DELETE FROM system_settings WHERE setting_key = 'weekly_holiday_days'")
