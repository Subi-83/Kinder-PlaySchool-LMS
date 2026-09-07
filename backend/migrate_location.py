import sys
sys.path.insert(0, '/home/subitha/Projects/PlaySchool/playschool-main/backend')
from app import create_app, db
from app.models.book import LibraryCupboard, LibraryShelf
from sqlalchemy import text, inspect

app = create_app()
with app.app_context():
    insp = inspect(db.engine)
    tables = insp.get_table_names()

    # 1. Create tables if they don't exist
    print("Ensuring tables library_cupboards and library_shelves exist...")
    db.create_all()

    # 2. Check book_copies columns for cupboard_id and shelf_id
    copy_cols = [c['name'] for c in insp.get_columns('book_copies')]
    if 'cupboard_id' not in copy_cols:
        db.session.execute(text("ALTER TABLE book_copies ADD COLUMN cupboard_id INT NULL, ADD CONSTRAINT fk_book_copies_cupboard FOREIGN KEY (cupboard_id) REFERENCES library_cupboards(cupboard_id) ON DELETE SET NULL"))
        print("Added cupboard_id column to book_copies")
    else:
        print("cupboard_id already exists in book_copies")

    if 'shelf_id' not in copy_cols:
        db.session.execute(text("ALTER TABLE book_copies ADD COLUMN shelf_id INT NULL, ADD CONSTRAINT fk_book_copies_shelf FOREIGN KEY (shelf_id) REFERENCES library_shelves(shelf_id) ON DELETE SET NULL"))
        print("Added shelf_id column to book_copies")
    else:
        print("shelf_id already exists in book_copies")

    db.session.commit()

    # 3. Seed initial cupboards and shelves if table is empty
    cupboard_count = LibraryCupboard.query.count()
    if cupboard_count == 0:
        print("Seeding initial cupboards and shelves...")
        c1 = LibraryCupboard(cupboard_code='CUP-01', cupboard_name='Cupboard 1', description='Main Cupboard near entrance', is_active=True)
        c2 = LibraryCupboard(cupboard_code='CUP-02', cupboard_name='Cupboard 2', description='Secondary Cupboard on east wall', is_active=True)
        db.session.add_all([c1, c2])
        db.session.flush()

        s1_1 = LibraryShelf(cupboard_id=c1.cupboard_id, shelf_code='SH-01', shelf_name='Shelf 1', description='Top shelf', is_active=True)
        s1_2 = LibraryShelf(cupboard_id=c1.cupboard_id, shelf_code='SH-02', shelf_name='Shelf 2', description='Second shelf', is_active=True)
        s1_3 = LibraryShelf(cupboard_id=c1.cupboard_id, shelf_code='SH-03', shelf_name='Shelf 3', description='Third shelf', is_active=True)
        s1_4 = LibraryShelf(cupboard_id=c1.cupboard_id, shelf_code='SH-04', shelf_name='Shelf 4', description='Bottom shelf', is_active=True)

        s2_1 = LibraryShelf(cupboard_id=c2.cupboard_id, shelf_code='SH-01', shelf_name='Shelf 1', description='Top shelf', is_active=True)
        s2_2 = LibraryShelf(cupboard_id=c2.cupboard_id, shelf_code='SH-02', shelf_name='Shelf 2', description='Middle shelf', is_active=True)
        s2_3 = LibraryShelf(cupboard_id=c2.cupboard_id, shelf_code='SH-03', shelf_name='Shelf 3', description='Bottom shelf', is_active=True)

        db.session.add_all([s1_1, s1_2, s1_3, s1_4, s2_1, s2_2, s2_3])
        db.session.commit()
        print("Default cupboards and shelves created successfully!")
    else:
        print(f"Found {cupboard_count} cupboards already configured.")

    # 4. Map existing copies without cupboard_id/shelf_id to Cupboard 1 / Shelf 1 if available
    first_shelf = LibraryShelf.query.filter_by(is_active=True).first()
    if first_shelf:
        unassigned_count = db.session.execute(text("SELECT COUNT(*) FROM book_copies WHERE cupboard_id IS NULL OR shelf_id IS NULL")).scalar()
        if unassigned_count > 0:
            db.session.execute(text(f"""
                UPDATE book_copies 
                SET cupboard_id = {first_shelf.cupboard_id}, 
                    shelf_id = {first_shelf.shelf_id},
                    location = 'Cupboard 1 / Shelf 1'
                WHERE cupboard_id IS NULL OR shelf_id IS NULL
            """))
            db.session.commit()
            print(f"Updated {unassigned_count} unassigned book copies with default location Cupboard 1 / Shelf 1")

    print("Migration finished successfully!")
