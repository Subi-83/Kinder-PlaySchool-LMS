"""
Resequence book copies for levels 1-5 to eliminate gaps, update BookLevelSequence,
and fix any missing level_id associations.
"""
import re
from app import create_app, db
from app.models.book import BookLevel, BookLevelSequence, BookTitle, BookCopy

app = create_app()

def run_resequence():
    with app.app_context():
        print("Starting Book Copies Resequencing...")

        # 1. Fix books with missing level_id
        missing_level_titles = BookTitle.query.filter_by(level_id=None).all()
        print(f"Found {len(missing_level_titles)} titles with level_id=None")
        for t in missing_level_titles:
            # Check copy barcode to determine level
            copies = BookCopy.query.filter_by(book_title_id=t.book_title_id).all()
            if copies and copies[0].barcode:
                pfx = copies[0].barcode[0]
                lvl = BookLevel.query.filter(BookLevel.level_code.like(f"%{pfx}%")).first()
                if lvl:
                    print(f"  Setting Title {t.book_title_id} ('{t.title}') level_id to {lvl.level_id} ({lvl.level_name})")
                    t.level_id = lvl.level_id
        db.session.commit()

        # 2. Resequence copies for each level
        levels = BookLevel.query.order_by(BookLevel.level_id).all()
        for lvl in levels:
            digits = re.findall(r'\d+', lvl.level_code or lvl.level_name or '')
            lnum = int(digits[0]) if digits else lvl.level_id

            # Find all copies for this level
            # We match copies by barcode prefix or by title.level_id
            copies = (
                BookCopy.query
                .join(BookTitle, BookCopy.book_title_id == BookTitle.book_title_id)
                .filter(
                    (BookCopy.barcode.like(f"{lnum}%")) | (BookTitle.level_id == lvl.level_id)
                )
                .all()
            )

            # Sort copies deterministically:
            # First by numeric barcode sequence if available, then copy_id
            def sort_key(c):
                bc = c.barcode or ''
                if len(bc) == 6 and bc.startswith(str(lnum)) and bc[1:].isdigit():
                    return (int(bc[1:]), c.book_copy_id)
                return (999999, c.book_copy_id)

            copies.sort(key=sort_key)
            total_copies = len(copies)
            print(f"\nProcessing Level {lnum} ({lvl.level_name}, ID: {lvl.level_id}): {total_copies} copies")

            # Phase 1: Set temporary barcodes to prevent duplicate key constraint errors
            for idx, copy in enumerate(copies, start=1):
                copy.barcode = f"T{lnum}_{idx:05d}_{copy.book_copy_id}"
            db.session.flush()

            avoid = {
                1: {173, 175},
                4: {172, 173, 346},
                5: {9, 10, 163}
            }.get(lnum, set())

            # Phase 2: Set final barcodes skipping avoided sequences
            seq = 1
            for copy in copies:
                while seq in avoid:
                    seq += 1
                copy.barcode = f"{lnum}{seq:05d}"
                seq += 1
            db.session.flush()

            final_max_seq = seq - 1

            # Phase 3: Update BookLevelSequence
            seq_rec = BookLevelSequence.query.filter_by(level_id=lvl.level_id).first()
            if not seq_rec:
                seq_rec = BookLevelSequence(level_id=lvl.level_id, last_sequence=final_max_seq)
                db.session.add(seq_rec)
            else:
                seq_rec.last_sequence = final_max_seq
            db.session.flush()

            print(f"  Level {lnum}: Barcodes resequenced up to {lnum}{final_max_seq:05d}. Sequence table set to {final_max_seq}.")

        # 3. Clean up obsolete sequence records (e.g. level_id=1 which does not correspond to any BookLevel)
        valid_level_ids = [lvl.level_id for lvl in levels]
        obsolete_seqs = BookLevelSequence.query.filter(~BookLevelSequence.level_id.in_(valid_level_ids)).all()
        for s in obsolete_seqs:
            print(f"Removing obsolete BookLevelSequence record with level_id={s.level_id}")
            db.session.delete(s)

        db.session.commit()
        print("\nAll levels successfully resequenced and committed!")

if __name__ == '__main__':
    run_resequence()
