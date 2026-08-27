"""Change permanent member IDs from STU#### to JK####.

Revision ID: 20260827_student_uid_to_jk
Revises: 20260826_ebook_count
"""
from alembic import op

revision = '20260827_student_uid_to_jk'
down_revision = '20260826_ebook_count'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("UPDATE students SET student_uid = CONCAT('JK', SUBSTRING(student_uid, 4)) WHERE student_uid LIKE 'STU%'")

def downgrade():
    op.execute("UPDATE students SET student_uid = CONCAT('STU', SUBSTRING(student_uid, 3)) WHERE student_uid LIKE 'JK%'")
