"""Add e_book_id, purchase_year to book_titles and create ebook_level_sequences table.

Revision ID: 20260907_ebook_id_and_sequences
Revises: 20260901_member_groups
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

revision = '20260907_ebook_id_and_sequences'
down_revision = '20260901_member_groups'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add e_book_id and purchase_year to book_titles
    op.add_column('book_titles', sa.Column('e_book_id', sa.String(50), nullable=True))
    op.create_unique_constraint('uq_book_titles_e_book_id', 'book_titles', ['e_book_id'])
    op.add_column('book_titles', sa.Column('purchase_year', sa.Integer(), nullable=True))

    # 2. Create ebook_level_sequences table
    op.create_table(
        'ebook_level_sequences',
        sa.Column('level_id', sa.Integer(), sa.ForeignKey('book_levels.level_id'), primary_key=True),
        sa.Column('last_sequence', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, default=datetime.utcnow)
    )


def downgrade():
    op.drop_table('ebook_level_sequences')
    op.drop_constraint('uq_book_titles_e_book_id', 'book_titles', type_='unique')
    op.drop_column('book_titles', 'purchase_year')
    op.drop_column('book_titles', 'e_book_id')
