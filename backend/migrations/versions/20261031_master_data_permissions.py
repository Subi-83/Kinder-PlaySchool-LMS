"""Add master-data access permissions.

Revision ID: 20261031_master_data_permissions
Revises: 20260901_remove_default_max_books, 20260907_ebook_id_sequences
"""
from alembic import op


revision = '20261031_master_data_permissions'
down_revision = ('20260901_remove_default_max_books', '20260907_ebook_id_and_sequences')
branch_labels = None
depends_on = None


PERMISSIONS = (
    ('master_data.view', 'View Master Data', 'master data', 'Can view master data configuration'),
    ('master_data.create', 'Create Master Data', 'master data', 'Can create master data records'),
    ('master_data.edit', 'Edit Master Data', 'master data', 'Can edit master data records'),
    ('master_data.delete', 'Delete Master Data', 'master data', 'Can deactivate or delete master data records'),
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
