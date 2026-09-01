"""Add the explicit deposit refund permission.

Revision ID: 20260901_deposit_refund_permission
Revises: 20260901_remove_default_max_books
"""
from alembic import op

revision = '20260901_deposit_refund_permission'
down_revision = '20260901_remove_default_max_books'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "INSERT IGNORE INTO permissions (permission_code, permission_name, module, description, created_at) "
        "VALUES ('deposit.refund', 'Refund Deposit', 'deposits', "
        "'Can return the complete deposit when next-year library subscription is declined', CURRENT_TIMESTAMP)"
    )


def downgrade():
    op.execute("DELETE FROM user_permissions WHERE permission_id IN (SELECT permission_id FROM permissions WHERE permission_code = 'deposit.refund')")
    op.execute("DELETE FROM role_permissions WHERE permission_id IN (SELECT permission_id FROM permissions WHERE permission_code = 'deposit.refund')")
    op.execute("DELETE FROM permissions WHERE permission_code = 'deposit.refund'")
