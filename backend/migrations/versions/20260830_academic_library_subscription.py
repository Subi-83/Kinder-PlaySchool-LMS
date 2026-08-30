"""Academic-year library access and subscription payments.

Revision ID: 20260830_academic_library
Revises: 20260827_student_uid_to_jk
"""
from alembic import op
import sqlalchemy as sa

revision = '20260830_academic_library'
down_revision = '20260827_student_uid_to_jk'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('student_enrollments', sa.Column('library_access', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.execute('UPDATE student_enrollments se JOIN students s ON s.student_id = se.student_id SET se.library_access = s.library_access')
    op.add_column('student_subscriptions', sa.Column('academic_year_id', sa.Integer(), nullable=True))
    op.add_column('student_subscriptions', sa.Column('payment_proof_url', sa.Text(), nullable=True))
    op.create_foreign_key('fk_subscription_academic_year', 'student_subscriptions', 'academic_years', ['academic_year_id'], ['academic_year_id'])
    op.execute('UPDATE student_subscriptions ss JOIN student_enrollments se ON se.student_id = ss.student_id SET ss.academic_year_id = se.academic_year_id WHERE ss.academic_year_id IS NULL')

def downgrade():
    op.drop_constraint('fk_subscription_academic_year', 'student_subscriptions', type_='foreignkey')
    op.drop_column('student_subscriptions', 'payment_proof_url')
    op.drop_column('student_subscriptions', 'academic_year_id')
    op.drop_column('student_enrollments', 'library_access')
