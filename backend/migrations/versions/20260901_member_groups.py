"""Add configurable member groups and classify existing members.

Revision ID: 20260901_member_groups
Revises: 20260901_deposit_refund_permission
"""
from alembic import op
import sqlalchemy as sa

revision = '20260901_member_groups'
down_revision = '20260901_deposit_refund_permission'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'member_groups',
        sa.Column('group_code', sa.String(40), primary_key=True),
        sa.Column('group_name', sa.String(100), nullable=False),
        sa.Column('singular_label', sa.String(100), nullable=False),
        sa.Column('plural_label', sa.String(100), nullable=False),
        sa.Column('library_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('programmes_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('subscriptions_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.execute("INSERT INTO member_groups VALUES ('JK_MEMBERS','JK Members','JK Member','JK Members',1,1,1,1,CURRENT_TIMESTAMP)")
    op.execute("INSERT INTO member_groups VALUES ('KINDER_PARK','Kinder Park','Kinder Park Student','Kinder Park Students',0,0,0,1,CURRENT_TIMESTAMP)")
    op.add_column('students', sa.Column('member_group_code', sa.String(40), nullable=False, server_default='JK_MEMBERS'))


def downgrade():
    op.drop_column('students', 'member_group_code')
    op.drop_table('member_groups')
