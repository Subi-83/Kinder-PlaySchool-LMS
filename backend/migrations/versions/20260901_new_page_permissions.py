"""Add permissions for newly separated pages.

Revision ID: 20260901_new_page_permissions
Revises: 20260830_academic_library
"""
from alembic import op

revision = '20260901_new_page_permissions'
down_revision = '20260830_academic_library'
branch_labels = None
depends_on = None


PERMISSIONS = (
    ('user.create', 'Create Users', 'users', 'Can create system users'),
    ('user.edit', 'Edit Users', 'users', 'Can edit system users and permissions'),
    ('user.delete', 'Delete Users', 'users', 'Can disable or delete system users'),
    ('ebook.view', 'View E-books Page', 'e-books', 'Can view information-only e-book records'),
    ('ebook.create', 'Create E-books', 'e-books', 'Can add information-only e-book records'),
    ('ebook.edit', 'Edit E-books', 'e-books', 'Can edit information-only e-book records'),
    ('ebook.delete', 'Delete E-books', 'e-books', 'Can delete information-only e-book records'),
    ('subscription.payment.view', 'View Subscription Payments Page', 'subscription payments', 'Can view academic-year subscription payments'),
    ('subscription.payment.edit', 'Edit Subscription Payments', 'subscription payments', 'Can correct subscription payment details'),
    ('holiday.create', 'Create Holidays', 'holidays', 'Can add holidays to the calendar'),
    ('holiday.edit', 'Edit Holidays', 'holidays', 'Can edit holidays in the calendar'),
    ('holiday.delete', 'Delete Holidays', 'holidays', 'Can delete holidays from the calendar'),
)


def upgrade():
    for code, name, module, description in PERMISSIONS:
        op.execute(
            "INSERT IGNORE INTO permissions (permission_code, permission_name, module, description, created_at) "
            f"VALUES ('{code}', '{name}', '{module}', '{description}', CURRENT_TIMESTAMP)"
        )


def downgrade():
    codes = ', '.join(f"'{item[0]}'" for item in PERMISSIONS)
    op.execute(f'DELETE FROM user_permissions WHERE permission_id IN (SELECT permission_id FROM permissions WHERE permission_code IN ({codes}))')
    op.execute(f'DELETE FROM role_permissions WHERE permission_id IN (SELECT permission_id FROM permissions WHERE permission_code IN ({codes}))')
    op.execute(f'DELETE FROM permissions WHERE permission_code IN ({codes})')
