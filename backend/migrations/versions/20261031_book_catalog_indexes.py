"""Add indexes for book catalog and report queries.

Revision ID: 20261031_book_catalog_indexes
Revises: 20261031_master_data_permissions
"""
from alembic import op


revision = '20261031_book_catalog_indexes'
down_revision = '20261031_master_data_permissions'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index('ix_book_titles_level_category_created', 'book_titles', ['level_id', 'category_id', 'created_at'])
    op.create_index('ix_book_titles_publication_year', 'book_titles', ['publication_year'])
    op.create_index('ix_book_copies_title_status', 'book_copies', ['book_title_id', 'status'])
    op.create_index('ix_book_copies_status_barcode', 'book_copies', ['status', 'barcode'])
    op.create_index('ix_book_copies_title_copy_number', 'book_copies', ['book_title_id', 'copy_number'])
    op.create_index('ix_book_copies_location', 'book_copies', ['cupboard_id', 'shelf_id'])


def downgrade():
    op.drop_index('ix_book_copies_location', table_name='book_copies')
    op.drop_index('ix_book_copies_title_copy_number', table_name='book_copies')
    op.drop_index('ix_book_copies_status_barcode', table_name='book_copies')
    op.drop_index('ix_book_copies_title_status', table_name='book_copies')
    op.drop_index('ix_book_titles_publication_year', table_name='book_titles')
    op.drop_index('ix_book_titles_level_category_created', table_name='book_titles')
