"""Add informational e-book count to book titles.

Revision ID: 20260826_ebook_count
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = '20260826_ebook_count'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('book_titles', sa.Column('ebook_count', sa.Integer(), nullable=False, server_default='0'))

def downgrade():
    op.drop_column('book_titles', 'ebook_count')
