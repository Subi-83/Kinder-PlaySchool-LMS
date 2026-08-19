#!/usr/bin/env python
"""
Seed Script for Kinder Park Preschool & Library System
Populates the database with rich, realistic sample data for showcase and testing.
"""
import os
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal
import random

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.config import get_config
from app.models import (
    User, Permission, RolePermission, UserPermission,
    AcademicYear, Programme, GradeLevel, StudentEnrollment,
    Student, BookLevel, BookCategory, BookTitle, BookCopy,
    BookIssue, BookReturn, DamageLossRecord,
    DepositAccount, DepositTransaction,
    SubscriptionPlan, StudentSubscription,
    SystemSetting, Holiday, AuditLog
)

def seed_database():
    app = create_app(get_config())
    with app.app_context():
        print("🌱 Seeding Kinder Park Library Database with Showcase Data...")

        # ----------------------------------------------------
        # 1. PERMISSIONS & ROLES
        # ----------------------------------------------------
        print(" -> Seeding permissions & default users...")
        permissions_data = [
            ('USERS', 'user.view', 'View Users', 'Can view system user list'),
            ('USERS', 'user.manage', 'Manage Users', 'Can create, edit, disable system users'),
            ('STUDENTS', 'student.view', 'View Students', 'Can view student profiles and roster'),
            ('STUDENTS', 'student.create', 'Create Students', 'Can create new student records'),
            ('STUDENTS', 'student.edit', 'Edit Students', 'Can edit student details'),
            ('STUDENTS', 'student.delete', 'Delete Students', 'Can delete student records'),
            ('PROGRAMMES', 'programme.view', 'View Programmes', 'Can view academic programmes'),
            ('PROGRAMMES', 'programme.create', 'Create Programmes', 'Can create academic programmes'),
            ('PROGRAMMES', 'programme.edit', 'Edit Programmes', 'Can edit academic programmes'),
            ('PROGRAMMES', 'programme.delete', 'Delete Programmes', 'Can delete academic programmes'),
            ('SUBSCRIPTIONS', 'subscription.view', 'View Subscriptions', 'Can view subscription plans'),
            ('SUBSCRIPTIONS', 'subscription.create', 'Create Subscriptions', 'Can assign or create subscriptions'),
            ('SUBSCRIPTIONS', 'subscription.edit', 'Edit Subscriptions', 'Can edit subscription details'),
            ('SUBSCRIPTIONS', 'subscription.delete', 'Delete Subscriptions', 'Can cancel or delete subscriptions'),
            ('BOOKS', 'book.view', 'View Books', 'Can search and view catalog'),
            ('BOOKS', 'book.create', 'Create Books', 'Can add new book titles and copies'),
            ('BOOKS', 'book.edit', 'Edit Books', 'Can edit book catalog'),
            ('BOOKS', 'book.delete', 'Delete Books', 'Can delete books'),
            ('LIBRARY', 'book.issue', 'Issue Books', 'Can issue books to students'),
            ('LIBRARY', 'book.return', 'Return Books', 'Can process book returns'),
            ('DAMAGE', 'damage.create', 'Record Damage', 'Can record book damage or loss'),
            ('DEPOSITS', 'deposit.view', 'View Deposits', 'Can view deposit accounts'),
            ('DEPOSITS', 'deposit.topup', 'Top-up Deposit', 'Can process deposit top-ups'),
            ('DEPOSITS', 'deposit.adjust', 'Adjust Deposit', 'Can adjust deposit balances'),
            ('REPORTS', 'report.stock', 'Stock Report', 'Can view stock report'),
            ('REPORTS', 'report.member', 'Member Report', 'Can view member report'),
            ('REPORTS', 'report.fine', 'Fine Report', 'Can view fine report'),
            ('REPORTS', 'report.financial', 'Financial Report', 'Can view financial report'),
            ('REPORTS', 'report.issue_return', 'Issue/Return Report', 'Can view issue/return report'),
            ('SETTINGS', 'settings.view', 'View Settings', 'Can view system settings'),
            ('AUDIT', 'audit.view', 'View Audit Logs', 'Can view audit logs'),
            ('HOLIDAYS', 'holiday.view', 'View Holidays', 'Can view holidays'),
            ('BACKUP', 'backup.create', 'Create Backup', 'Can create database backups'),
            ('EXPORT', 'export.create', 'Export Data', 'Can export data'),
        ]

        permission_objs = {}
        for module, code, name, desc in permissions_data:
            perm = Permission.query.filter_by(permission_code=code).first()
            if not perm:
                perm = Permission(
                    permission_code=code,
                    permission_name=name,
                    module=module.lower(),
                    description=desc
                )
                db.session.add(perm)
                db.session.flush()
            permission_objs[code] = perm

        # Admin user
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@kinderpark.com',
                full_name='System Administrator',
                role='ADMIN',
                is_active=True
            )
            admin.set_password('admin123')
            db.session.add(admin)

        # Staff user 1
        staff1 = User.query.filter_by(username='sarah').first()
        if not staff1:
            staff1 = User(
                username='sarah',
                email='sarah.librarian@kinderpark.com',
                full_name='Sarah Jenkins',
                role='STAFF',
                is_active=True
            )
            staff1.set_password('staff123')
            db.session.add(staff1)

        # Staff user 2
        staff2 = User.query.filter_by(username='david').first()
        if not staff2:
            staff2 = User(
                username='david',
                email='david.clerk@kinderpark.com',
                full_name='David Miller',
                role='STAFF',
                is_active=True
            )
            staff2.set_password('staff123')
            db.session.add(staff2)

        db.session.commit()
        admin = User.query.filter_by(username='admin').first()

        # Grant permissions to STAFF role
        staff_permissions = [
            'student.view', 'student.create', 'student.edit',
            'programme.view',
            'subscription.view', 'subscription.create', 'subscription.edit',
            'book.view', 'book.create', 'book.edit',
            'book.issue', 'book.return',
            'damage.create',
            'deposit.view', 'deposit.topup', 'deposit.adjust',
            'report.stock', 'report.member', 'report.fine', 'report.financial', 'report.issue_return',
            'holiday.view'
        ]
        for perm_code in staff_permissions:
            p = permission_objs.get(perm_code)
            if p:
                rp = RolePermission.query.filter_by(role='STAFF', permission_id=p.permission_id).first()
                if not rp:
                    db.session.add(RolePermission(role='STAFF', permission_id=p.permission_id))

        db.session.commit()

        # ----------------------------------------------------
        # 2. ACADEMIC YEARS
        # ----------------------------------------------------
        print(" -> Seeding Academic Years...")
        academic_years_data = [
            ('2024-25', 'Academic Year 2024-25', date(2024, 6, 1), date(2025, 4, 30), False, True),
            ('2025-26', 'Academic Year 2025-26', date(2025, 6, 1), date(2026, 4, 30), True, True),
            ('2026-27', 'Academic Year 2026-27', date(2026, 6, 1), date(2027, 4, 30), False, True),
        ]
        ay_objs = {}
        for code, name, start_d, end_d, is_curr, is_act in academic_years_data:
            ay = AcademicYear.query.filter_by(year_code=code).first()
            if not ay:
                ay = AcademicYear(
                    year_code=code,
                    year_name=name,
                    start_date=start_d,
                    end_date=end_d,
                    is_current=is_curr,
                    is_active=is_act
                )
                db.session.add(ay)
                db.session.flush()
            ay_objs[code] = ay
        db.session.commit()

        # ----------------------------------------------------
        # 3. PROGRAMMES & GRADE LEVELS
        # ----------------------------------------------------
        print(" -> Seeding Programmes and Grade Levels...")
        grades_data = [
            ('PG', 'Playgroup', 'Playgroup for ages 2-3', 1),
            ('NUR', 'Nursery', 'Nursery for ages 3-4', 2),
            ('JKG', 'Junior KG', 'Junior Kindergarten for ages 4-5', 3),
            ('SKG', 'Senior KG', 'Senior Kindergarten for ages 5-6', 4),
            ('1', 'Grade 1', 'Primary Grade 1', 5),
            ('2', 'Grade 2', 'Primary Grade 2', 6),
        ]
        for g_code, g_name, g_desc, order in grades_data:
            gl = GradeLevel.query.filter_by(grade_code=g_code).first()
            if not gl:
                db.session.add(GradeLevel(grade_code=g_code, grade_name=g_name, description=g_desc, sort_order=order))

        programmes_data = [
            ('Playgroup', 'PG', 'Early learning playgroup programme', 'PG', 2, 1),
            ('Nursery', 'NUR', 'Nursery foundational programme', 'NUR', 2, 2),
            ('Junior KG', 'JKG', 'Junior kindergarten reading & activity', 'JKG', 3, 3),
            ('Senior KG', 'SKG', 'Senior kindergarten preparatory', 'SKG', 3, 4),
            ('Grade 1', 'G1', 'Primary Grade 1 standard curriculum', '1', 4, 5),
            ('Grade 2', 'G2', 'Primary Grade 2 standard curriculum', '2', 4, 6),
            ('Lit Readers Club', 'FLY', 'Special literacy and reading club (Lit Readers)', 'ALL', 5, 7),
        ]
        prog_objs = {}
        for p_name, p_code, p_desc, g_lvl, max_b, s_ord in programmes_data:
            prg = Programme.query.filter_by(programme_name=p_name).first()
            if not prg:
                prg = Programme(
                    programme_name=p_name,
                    programme_code=p_code,
                    description=p_desc,
                    grade_level=g_lvl,
                    library_access=True,
                    max_books_allowed=max_b,
                    sort_order=s_ord,
                    is_active=True
                )
                db.session.add(prg)
                db.session.flush()
            prog_objs[p_code] = prg
        db.session.commit()

        # ----------------------------------------------------
        # 4. BOOK LEVELS & CATEGORIES
        # ----------------------------------------------------
        print(" -> Seeding Book Levels & Categories...")
        levels_data = [
            ('L1', 'Level 1: Early Beginners', 'Board books, picture wordbooks for toddlers (Age 2-4)', 1),
            ('L2', 'Level 2: Early Readers', 'Simple sentences, phonics & rhymes (Age 4-6)', 2),
            ('L3', 'Level 3: Independent Readers', 'Short stories with illustrations (Age 6-8)', 3),
            ('L4', 'Level 4: Chapter Books', 'Early chapter books & non-fiction (Age 8+)', 4),
        ]
        level_objs = {}
        for l_code, l_name, l_desc, s_ord in levels_data:
            bl = BookLevel.query.filter_by(level_code=l_code).first()
            if not bl:
                bl = BookLevel(level_code=l_code, level_name=l_name, description=l_desc, sort_order=s_ord)
                db.session.add(bl)
                db.session.flush()
            level_objs[l_code] = bl

        categories_data = [
            ('FIC', 'Picture Fiction & Stories', 'Charming illustrated fiction and bedtime tales'),
            ('SCI', 'Science & Nature Exploration', 'Fun facts, animals, space and nature'),
            ('FAIRY', 'Fairy Tales & Fables', 'Classic fables, folklore and magical adventures'),
            ('ART', 'Art, Craft & Creativity', 'Drawing, coloring, activity and music books'),
            ('HIST', 'History & Biographies', 'Inspiring figures and historical tales for kids'),
            ('POET', 'Nursery Rhymes & Poetry', 'Rhythm, poems, and classic nursery rhymes'),
        ]
        cat_objs = {}
        for c_code, c_name, c_desc in categories_data:
            bc = BookCategory.query.filter_by(category_code=c_code).first()
            if not bc:
                bc = BookCategory(category_code=c_code, category_name=c_name, description=c_desc)
                db.session.add(bc)
                db.session.flush()
            cat_objs[c_code] = bc
        db.session.commit()

        # ----------------------------------------------------
        # 5. SUBSCRIPTION PLANS
        # ----------------------------------------------------
        print(" -> Seeding Subscription Plans...")
        plans_data = [
            ('Basic Starter', 'SUB-BASIC', 1, 3, Decimal('500.00'), 'Basic plan: 1 book at a time for 3 months'),
            ('Standard Reader', 'SUB-STD', 2, 6, Decimal('1200.00'), 'Standard plan: 2 books at a time for 6 months'),
            ('Premium Lit Club', 'SUB-PREM', 4, 12, Decimal('2200.00'), 'Premium plan: 4 books at a time for 1 full year'),
        ]
        plan_objs = {}
        for p_name, p_code, max_b, dur, pr, desc in plans_data:
            sp = SubscriptionPlan.query.filter_by(plan_name=p_name).first()
            if not sp:
                sp = SubscriptionPlan(
                    plan_name=p_name,
                    plan_code=p_code,
                    max_books=max_b,
                    duration_months=dur,
                    price=pr,
                    description=desc,
                    is_active=True
                )
                db.session.add(sp)
                db.session.flush()
            plan_objs[p_code] = sp
        db.session.commit()

        # ----------------------------------------------------
        # 6. BOOK TITLES AND COPIES
        # ----------------------------------------------------
        print(" -> Seeding Book Titles & Physical Copies...")
        books_data = [
            {
                'title': 'The Very Hungry Caterpillar',
                'author': 'Eric Carle',
                'isbn': '9780399226908',
                'level': 'L1', 'category': 'FIC',
                'publisher': 'World of Eric Carle', 'year': 1969,
                'desc': 'A classic picture book following the story of a caterpillar as it eats its way through a variety of foods.',
                'copies_count': 3
            },
            {
                'title': 'Goodnight Moon',
                'author': 'Margaret Wise Brown',
                'isbn': '9780060755355',
                'level': 'L1', 'category': 'FIC',
                'publisher': 'HarperCollins', 'year': 1947,
                'desc': 'A gentle bedtime story saying goodnight to everything in the cozy green room.',
                'copies_count': 3
            },
            {
                'title': 'Where the Wild Things Are',
                'author': 'Maurice Sendak',
                'isbn': '9780064431781',
                'level': 'L2', 'category': 'FIC',
                'publisher': 'HarperCollins', 'year': 1963,
                'desc': 'Max’s journey to the land of Wild Things after being sent to bed without supper.',
                'copies_count': 3
            },
            {
                'title': 'The Cat in the Hat',
                'author': 'Dr. Seuss',
                'isbn': '9780394800011',
                'level': 'L2', 'category': 'POET',
                'publisher': 'Random House', 'year': 1957,
                'desc': 'A rainy day turns wild when the mischievous Cat in the Hat visits Sally and her brother.',
                'copies_count': 3
            },
            {
                'title': 'Green Eggs and Ham',
                'author': 'Dr. Seuss',
                'isbn': '9780394800165',
                'level': 'L2', 'category': 'POET',
                'publisher': 'Random House', 'year': 1960,
                'desc': 'Sam-I-Am tries relentlessly to convince his friend to try green eggs and ham.',
                'copies_count': 2
            },
            {
                'title': 'The Gruffalo',
                'author': 'Julia Donaldson',
                'isbn': '9780333710937',
                'level': 'L2', 'category': 'FAIRY',
                'publisher': 'Macmillan Children\'s', 'year': 1999,
                'desc': 'A clever mouse outwits hungry woodland predators with tales of an imaginary monster—the Gruffalo!',
                'copies_count': 3
            },
            {
                'title': 'Room on the Broom',
                'author': 'Julia Donaldson',
                'isbn': '9780333903384',
                'level': 'L2', 'category': 'FAIRY',
                'publisher': 'Macmillan Children\'s', 'year': 2001,
                'desc': 'A friendly witch and her cat invite a dog, bird and frog onto their broomstick.',
                'copies_count': 2
            },
            {
                'title': 'Don\'t Let the Pigeon Drive the Bus!',
                'author': 'Mo Willems',
                'isbn': '9780375828379',
                'level': 'L1', 'category': 'FIC',
                'publisher': 'Hyperion Books', 'year': 2003,
                'desc': 'An interactive hilarity-filled tale where children decide if a pigeon can drive a bus.',
                'copies_count': 2
            },
            {
                'title': 'Brown Bear, Brown Bear, What Do You See?',
                'author': 'Bill Martin Jr.',
                'isbn': '9780805047905',
                'level': 'L1', 'category': 'FIC',
                'publisher': 'Henry Holt & Co.', 'year': 1967,
                'desc': 'Rhythmic text and vivid collage illustrations help toddlers recognize colors and animals.',
                'copies_count': 3
            },
            {
                'title': 'Curious George',
                'author': 'H.A. Rey',
                'isbn': '9780395150238',
                'level': 'L2', 'category': 'FIC',
                'publisher': 'Houghton Mifflin', 'year': 1941,
                'desc': 'The first adventure of the playful monkey who gets into all sorts of humorous trouble.',
                'copies_count': 2
            },
            {
                'title': 'Charlotte\'s Web',
                'author': 'E.B. White',
                'isbn': '9780064400558',
                'level': 'L4', 'category': 'FIC',
                'publisher': 'HarperCollins', 'year': 1952,
                'desc': 'The timeless story of Wilbur the pig and his wise spider friend Charlotte.',
                'copies_count': 2
            },
            {
                'title': 'Matilda',
                'author': 'Roald Dahl',
                'isbn': '9780141365466',
                'level': 'L4', 'category': 'FIC',
                'publisher': 'Puffin Books', 'year': 1988,
                'desc': 'A brilliant young girl with telekinetic powers stands up to her cruel parents and headmistress.',
                'copies_count': 2
            },
            {
                'title': 'The Magic School Bus: Inside the Human Body',
                'author': 'Joanna Cole',
                'isbn': '9780590414272',
                'level': 'L3', 'category': 'SCI',
                'publisher': 'Scholastic', 'year': 1989,
                'desc': 'Ms. Frizzle takes her class on an extraordinary field trip inside Arnold’s stomach!',
                'copies_count': 3
            },
            {
                'title': 'National Geographic Little Kids First Big Book of Why',
                'author': 'Amy Shields',
                'isbn': '9781426307935',
                'level': 'L3', 'category': 'SCI',
                'publisher': 'National Geographic', 'year': 2011,
                'desc': 'Answers common child questions about body, sky, world and animals with colorful photos.',
                'copies_count': 2
            },
            {
                'title': 'Peppa Pig: Little Library',
                'author': 'Ladybird Books',
                'isbn': '9781409306160',
                'level': 'L1', 'category': 'FIC',
                'publisher': 'Ladybird', 'year': 2010,
                'desc': 'Six pocket-sized board books featuring Peppa, George, Mummy and Daddy Pig.',
                'copies_count': 3
            },
            {
                'title': 'Press Here',
                'author': 'Hervé Tullet',
                'isbn': '9780811879544',
                'level': 'L1', 'category': 'ART',
                'publisher': 'Chronicle Books', 'year': 2011,
                'desc': 'An interactive book created entirely of dots that invites magic through touch and imagination.',
                'copies_count': 2
            },
            {
                'title': 'A Child\'s Garden of Verses',
                'author': 'Robert Louis Stevenson',
                'isbn': '9780060259778',
                'level': 'L3', 'category': 'POET',
                'publisher': 'HarperCollins', 'year': 1999,
                'desc': 'Classic poetry celebrating play, imagination and bedtime for young children.',
                'copies_count': 2
            }
        ]

        book_copy_pool = []
        barcode_counter = 1000

        for bdata in books_data:
            bt = BookTitle.query.filter_by(title=bdata['title']).first()
            if not bt:
                bt = BookTitle(
                    title=bdata['title'],
                    author=bdata['author'],
                    isbn=bdata['isbn'],
                    level_id=level_objs[bdata['level']].level_id,
                    category_id=cat_objs[bdata['category']].category_id,
                    publication_year=bdata['year'],
                    publisher=bdata['publisher'],
                    description=bdata['desc']
                )
                db.session.add(bt)
                db.session.flush()

            # Create copies if none exist
            if bt.copies.count() == 0:
                for c_idx in range(1, bdata['copies_count'] + 1):
                    barcode_counter += 1
                    bcode = f"BC{barcode_counter}"
                    accession = f"ACC{barcode_counter}"
                    shelf = f"Rack {chr(65 + (barcode_counter % 4))}{(barcode_counter % 5) + 1}"
                    
                    copy = BookCopy(
                        book_title_id=bt.book_title_id,
                        copy_number=c_idx,
                        barcode=bcode,
                        accession_number=accession,
                        purchase_year=2024,
                        purchase_price=Decimal(str(random.choice([299.00, 350.00, 499.00, 650.00, 799.00]))),
                        condition='NEW' if c_idx == 1 else 'GOOD',
                        status='AVAILABLE',
                        location=shelf
                    )
                    db.session.add(copy)
                    db.session.flush()
                    book_copy_pool.append(copy)

        db.session.commit()

        # Fetch all available copies
        all_copies = BookCopy.query.all()

        # ----------------------------------------------------
        # 7. STUDENTS, ENROLLMENTS, DEPOSITS, SUBSCRIPTIONS
        # ----------------------------------------------------
        print(" -> Seeding Students, Enrollments, Deposit Accounts & Subscriptions...")
        current_ay = ay_objs['2025-26']

        students_sample = [
            {
                'uid': 'STU0001', 'name': 'Aarav Sharma', 'gender': 'MALE', 'dob': date(2019, 4, 12),
                'prog': 'JKG', 'roll': '25JKG0001',
                'mother_name': 'Priya Sharma', 'mother_phone': '9876543210', 'mother_email': 'priya.sharma@example.com',
                'father_name': 'Rajesh Sharma', 'father_phone': '9876543211', 'father_email': 'rajesh.sharma@example.com',
                'address': 'Flat 402, Sunshine Apartments, MG Road', 'plan': 'SUB-STD', 'deposit': Decimal('1500.00')
            },
            {
                'uid': 'STU0002', 'name': 'Ananya Patel', 'gender': 'FEMALE', 'dob': date(2020, 1, 25),
                'prog': 'NUR', 'roll': '25NUR0001',
                'mother_name': 'Meera Patel', 'mother_phone': '9876543212', 'mother_email': 'meera.p@example.com',
                'father_name': 'Amit Patel', 'father_phone': '9876543213', 'father_email': 'amit.p@example.com',
                'address': '12 Park Avenue, Residency Road', 'plan': 'SUB-BASIC', 'deposit': Decimal('1000.00')
            },
            {
                'uid': 'STU0003', 'name': 'Vihaan Rao', 'gender': 'MALE', 'dob': date(2018, 9, 10),
                'prog': 'G1', 'roll': '25G10001',
                'mother_name': 'Kavita Rao', 'mother_phone': '9876543214', 'mother_email': 'kavita.rao@example.com',
                'father_name': 'Srinivas Rao', 'father_phone': '9876543215', 'father_email': 'srini.rao@example.com',
                'address': '78 Lotus Greens, Indiranagar', 'plan': 'SUB-PREM', 'deposit': Decimal('2000.00')
            },
            {
                'uid': 'STU0004', 'name': 'Diya Gupta', 'gender': 'FEMALE', 'dob': date(2019, 11, 5),
                'prog': 'JKG', 'roll': '25JKG0002',
                'mother_name': 'Sneha Gupta', 'mother_phone': '9876543216', 'mother_email': 'sneha.g@example.com',
                'father_name': 'Vikas Gupta', 'father_phone': '9876543217', 'father_email': 'vikas.g@example.com',
                'address': '55 Rose Gardens, Koramangala', 'plan': 'SUB-STD', 'deposit': Decimal('1200.00')
            },
            {
                'uid': 'STU0005', 'name': 'Kabir Verma', 'gender': 'MALE', 'dob': date(2018, 3, 15),
                'prog': 'G2', 'roll': '25G20001',
                'mother_name': 'Ritu Verma', 'mother_phone': '9876543218', 'mother_email': 'ritu.v@example.com',
                'father_name': 'Sanjay Verma', 'father_phone': '9876543219', 'father_email': 'sanjay.v@example.com',
                'address': '99 Palm Enclave, HSR Layout', 'plan': 'SUB-PREM', 'deposit': Decimal('1800.00')
            },
            {
                'uid': 'STU0006', 'name': 'Myra Reddy', 'gender': 'FEMALE', 'dob': date(2021, 2, 18),
                'prog': 'PG', 'roll': '25PG0001',
                'mother_name': 'Anitha Reddy', 'mother_phone': '9876543220', 'mother_email': 'anitha.r@example.com',
                'father_name': 'Vikram Reddy', 'father_phone': '9876543221', 'father_email': 'vikram.r@example.com',
                'address': '14 Lakeview Towers, Whitefield', 'plan': 'SUB-BASIC', 'deposit': Decimal('1000.00')
            },
            {
                'uid': 'STU0007', 'name': 'Reyansh Joshi', 'gender': 'MALE', 'dob': date(2019, 7, 22),
                'prog': 'SKG', 'roll': '25SKG0001',
                'mother_name': 'Pooja Joshi', 'mother_phone': '9876543222', 'mother_email': 'pooja.j@example.com',
                'father_name': 'Nitin Joshi', 'father_phone': '9876543223', 'father_email': 'nitin.j@example.com',
                'address': '303 Silver Heights, Jayanagar', 'plan': 'SUB-STD', 'deposit': Decimal('1500.00')
            },
            {
                'uid': 'STU0008', 'name': 'Ishaan Mehta', 'gender': 'MALE', 'dob': date(2018, 12, 30),
                'prog': 'G1', 'roll': '25G10002',
                'mother_name': 'Neha Mehta', 'mother_phone': '9876543224', 'mother_email': 'neha.m@example.com',
                'father_name': 'Karan Mehta', 'father_phone': '9876543225', 'father_email': 'karan.m@example.com',
                'address': '22 Windsor Park, JP Nagar', 'plan': 'SUB-STD', 'deposit': Decimal('1200.00')
            },
            {
                'uid': 'STU0009', 'name': 'Avani Nair', 'gender': 'FEMALE', 'dob': date(2020, 5, 14),
                'prog': 'NUR', 'roll': '25NUR0002',
                'mother_name': 'Lakshmi Nair', 'mother_phone': '9876543226', 'mother_email': 'lakshmi.n@example.com',
                'father_name': 'Gautam Nair', 'father_phone': '9876543227', 'father_email': 'gautam.n@example.com',
                'address': '45 Jasmine Villa, Electronic City', 'plan': 'SUB-BASIC', 'deposit': Decimal('800.00')
            },
            {
                'uid': 'STU0010', 'name': 'Arjun Singh', 'gender': 'MALE', 'dob': date(2019, 1, 8),
                'prog': 'SKG', 'roll': '25SKG0002',
                'mother_name': 'Simran Singh', 'mother_phone': '9876543228', 'mother_email': 'simran.s@example.com',
                'father_name': 'Gurpreet Singh', 'father_phone': '9876543229', 'father_email': 'gurpreet.s@example.com',
                'address': '88 Maple Drive, Sarjapur Road', 'plan': 'SUB-STD', 'deposit': Decimal('1400.00')
            },
            {
                'uid': 'STU0011', 'name': 'Saisha Fernandez', 'gender': 'FEMALE', 'dob': date(2018, 6, 20),
                'prog': 'G2', 'roll': '25G20002',
                'mother_name': 'Maria Fernandez', 'mother_phone': '9876543230', 'mother_email': 'maria.f@example.com',
                'father_name': 'Anthony Fernandez', 'father_phone': '9876543231', 'father_email': 'anthony.f@example.com',
                'address': '10 Ocean View, Ulsoor', 'plan': 'SUB-PREM', 'deposit': Decimal('2500.00')
            },
            {
                'uid': 'STU0012', 'name': 'Rohan Banerjee', 'gender': 'MALE', 'dob': date(2019, 10, 17),
                'prog': 'FLY', 'roll': '25FLY0001',
                'mother_name': 'Sarmistha Banerjee', 'mother_phone': '9876543232', 'mother_email': 'sarmistha.b@example.com',
                'father_name': 'Subhabrata Banerjee', 'father_phone': '9876543233', 'father_email': 'subha.b@example.com',
                'address': '67 Orchard Grove, Bellandur', 'plan': 'SUB-PREM', 'deposit': Decimal('3000.00')
            }
        ]

        student_objs = []

        for sdata in students_sample:
            stu = Student.query.filter_by(student_uid=sdata['uid']).first()
            if not stu:
                stu = Student(
                    student_uid=sdata['uid'],
                    student_name=sdata['name'],
                    date_of_birth=sdata['dob'],
                    gender=sdata['gender'],
                    school_name='Kinder Park Preschool',
                    student_email=sdata['mother_email'],
                    mother_name=sdata['mother_name'],
                    mother_phone=sdata['mother_phone'],
                    mother_email=sdata['mother_email'],
                    father_name=sdata['father_name'],
                    father_phone=sdata['father_phone'],
                    father_email=sdata['father_email'],
                    address=sdata['address'],
                    emergency_contact_name=sdata['mother_name'],
                    emergency_contact_phone=sdata['mother_phone'],
                    is_active=True
                )
                db.session.add(stu)
                db.session.flush()

            student_objs.append(stu)

            # Enrollment
            prg = prog_objs[sdata['prog']]
            enr = StudentEnrollment.query.filter_by(
                student_id=stu.student_id,
                academic_year_id=current_ay.academic_year_id,
                programme_id=prg.programme_id
            ).first()

            if not enr:
                enr = StudentEnrollment(
                    student_id=stu.student_id,
                    academic_year_id=current_ay.academic_year_id,
                    programme_id=prg.programme_id,
                    grade=prg.grade_level,
                    roll_number=sdata['roll'],
                    section='A',
                    status='ACTIVE',
                    enrollment_date=date(2025, 6, 1),
                    registration_source='MANUAL',
                    payment_method='UPI'
                )
                db.session.add(enr)
                db.session.flush()

            # Deposit Account
            dep_acc = DepositAccount.query.filter_by(student_id=stu.student_id).first()
            if not dep_acc:
                dep_acc = DepositAccount(
                    student_id=stu.student_id,
                    current_balance=sdata['deposit'],
                    minimum_balance=Decimal('0.00'),
                    warning_threshold=Decimal('100.00'),
                    last_transaction_date=datetime.utcnow() - timedelta(days=random.randint(5, 45))
                )
                db.session.add(dep_acc)
                db.session.flush()

                # Add initial transaction
                txn = DepositTransaction(
                    deposit_account_id=dep_acc.deposit_account_id,
                    transaction_type='INITIAL_DEPOSIT',
                    amount=sdata['deposit'],
                    balance_after=sdata['deposit'],
                    description='Initial security deposit on registration',
                    created_by=admin.user_id,
                    created_at=datetime.utcnow() - timedelta(days=60)
                )
                db.session.add(txn)

            # Subscription
            sub_plan = plan_objs[sdata['plan']]
            sub = StudentSubscription.query.filter_by(student_id=stu.student_id).first()
            if not sub:
                start_d = date(2025, 6, 1)
                end_d = start_d + timedelta(days=sub_plan.duration_months * 30)
                sub = StudentSubscription(
                    student_id=stu.student_id,
                    subscription_plan_id=sub_plan.subscription_plan_id,
                    start_date=start_d,
                    end_date=end_d,
                    status='ACTIVE',
                    amount_paid=sub_plan.price,
                    payment_date=start_d,
                    payment_method='GPay / UPI',
                    notes='Membership active for academic year'
                )
                db.session.add(sub)

        db.session.commit()

        # ----------------------------------------------------
        # 8. BOOK ISSUES & RETURNS (ACTIVE, OVERDUE & PAST)
        # ----------------------------------------------------
        print(" -> Seeding Book Issues, Returns & Damage Records...")
        today = datetime.now().date()
        available_copies = [c for c in BookCopy.query.all() if c.status == 'AVAILABLE']

        # A) Past Returned Issues
        past_issues_count = 10
        copy_idx = 0
        for i in range(past_issues_count):
            if copy_idx >= len(available_copies):
                copy_idx = 0
            copy = available_copies[copy_idx]
            copy_idx += 1
            student = student_objs[i % len(student_objs)]
            enr = StudentEnrollment.query.filter_by(student_id=student.student_id, status='ACTIVE').first()

            issue_d = today - timedelta(days=35 - i * 2)
            due_d = issue_d + timedelta(days=14)
            return_d = issue_d + timedelta(days=10 + (i % 3))

            issue = BookIssue(
                book_copy_id=copy.book_copy_id,
                student_id=student.student_id,
                enrollment_id=enr.enrollment_id if enr else None,
                issue_date=issue_d,
                issue_time=datetime.strptime('10:30', '%H:%M').time(),
                due_date=due_d,
                expected_return_date=due_d,
                issued_by=admin.user_id,
                status='RETURNED',
                notes='Returned in good condition'
            )
            db.session.add(issue)
            db.session.flush()

            ret = BookReturn(
                issue_id=issue.issue_id,
                return_date=return_d,
                return_time=datetime.strptime('14:15', '%H:%M').time(),
                received_by=admin.user_id,
                condition_returned='GOOD',
                is_damaged=False,
                is_lost=False,
                fine_amount=Decimal('0.00'),
                damage_charge=Decimal('0.00'),
                notes='Returned on time'
            )
            db.session.add(ret)

        # B) Current Active Issues (On-Time)
        active_samples = [
            (student_objs[0], 5),  # Aarav Sharma - issued 5 days ago (due in 9 days)
            (student_objs[2], 3),  # Vihaan Rao - issued 3 days ago (due in 11 days)
            (student_objs[4], 7),  # Kabir Verma - issued 7 days ago (due in 7 days)
            (student_objs[11], 2), # Rohan Banerjee - issued 2 days ago (due in 12 days)
        ]

        for student, days_ago in active_samples:
            if copy_idx >= len(available_copies):
                break
            copy = available_copies[copy_idx]
            copy_idx += 1
            enr = StudentEnrollment.query.filter_by(student_id=student.student_id, status='ACTIVE').first()

            issue_d = today - timedelta(days=days_ago)
            due_d = issue_d + timedelta(days=14)

            issue = BookIssue(
                book_copy_id=copy.book_copy_id,
                student_id=student.student_id,
                enrollment_id=enr.enrollment_id if enr else None,
                issue_date=issue_d,
                issue_time=datetime.strptime('11:00', '%H:%M').time(),
                due_date=due_d,
                expected_return_date=due_d,
                issued_by=admin.user_id,
                status='ACTIVE',
                notes='Active checkout'
            )
            db.session.add(issue)
            copy.status = 'ISSUED'

        # C) Current Overdue Issues (Demonstrating Alerts & Penalties)
        overdue_samples = [
            (student_objs[1], 20), # Ananya Patel - issued 20 days ago (6 days overdue)
            (student_objs[6], 25), # Reyansh Joshi - issued 25 days ago (11 days overdue)
        ]

        for student, days_ago in overdue_samples:
            if copy_idx >= len(available_copies):
                break
            copy = available_copies[copy_idx]
            copy_idx += 1
            enr = StudentEnrollment.query.filter_by(student_id=student.student_id, status='ACTIVE').first()

            issue_d = today - timedelta(days=days_ago)
            due_d = issue_d + timedelta(days=14)

            issue = BookIssue(
                book_copy_id=copy.book_copy_id,
                student_id=student.student_id,
                enrollment_id=enr.enrollment_id if enr else None,
                issue_date=issue_d,
                issue_time=datetime.strptime('15:30', '%H:%M').time(),
                due_date=due_d,
                expected_return_date=due_d,
                issued_by=admin.user_id,
                status='OVERDUE',
                notes='Overdue notice sent to parent phone'
            )
            db.session.add(issue)
            copy.status = 'ISSUED'

        # D) 1 Damaged Book Record & Charge
        if copy_idx < len(available_copies):
            copy_damaged = available_copies[copy_idx]
            copy_idx += 1
            student_damaged = student_objs[3] # Diya Gupta
            copy_damaged.status = 'DAMAGED'
            copy_damaged.condition = 'DAMAGED'

            dmg = DamageLossRecord(
                book_copy_id=copy_damaged.book_copy_id,
                student_id=student_damaged.student_id,
                record_type='DAMAGE',
                severity='SMALL',
                charge_amount=Decimal('50.00'),
                description='Torn cover page upon return of picture book',
                recorded_by=admin.user_id,
                status='CHARGED'
            )
            db.session.add(dmg)
            db.session.flush()

            # Deduct from deposit
            dep_acc = DepositAccount.query.filter_by(student_id=student_damaged.student_id).first()
            if dep_acc and dep_acc.current_balance >= Decimal('50.00'):
                new_bal = dep_acc.current_balance - Decimal('50.00')
                txn = DepositTransaction(
                    deposit_account_id=dep_acc.deposit_account_id,
                    transaction_type='DAMAGE_CHARGE',
                    amount=Decimal('-50.00'),
                    balance_after=new_bal,
                    reference_id=str(dmg.record_id),
                    description='Deduction for minor book damage charge',
                    created_by=admin.user_id
                )
                dep_acc.current_balance = new_bal
                dmg.deposit_transaction_id = txn.transaction_id
                db.session.add(txn)

        db.session.commit()

        # ----------------------------------------------------
        # 9. SYSTEM SETTINGS
        # ----------------------------------------------------
        print(" -> Seeding System Settings & Holidays...")
        settings_data = [
            ('school_name', 'Kinder Park Preschool & Reading Club', 'STRING', 'GENERAL', 'Official institution name'),
            ('fine_per_day', '5.00', 'DECIMAL', 'LIBRARY', 'Daily overdue fine in INR'),
            ('default_issue_days', '14', 'INTEGER', 'LIBRARY', 'Standard issue period in days'),
            ('max_books_default', '2', 'INTEGER', 'LIBRARY', 'Default max books allowed per student'),
            ('currency_symbol', '₹', 'STRING', 'FINANCE', 'Currency symbol used in display'),
            ('warning_threshold_default', '100.00', 'DECIMAL', 'FINANCE', 'Minimum balance warning threshold'),
        ]

        for key, val, dtype, cat, desc in settings_data:
            st = SystemSetting.query.filter_by(setting_key=key).first()
            if not st:
                st = SystemSetting(
                    setting_key=key,
                    setting_value=val,
                    data_type=dtype,
                    category=cat,
                    description=desc,
                    is_editable=True
                )
                db.session.add(st)

        # Sample Holidays
        holidays_data = [
            ('Independence Day', date(2025, 8, 15), True, 'National Holiday'),
            ('Ganesh Chaturthi', date(2025, 8, 27), False, 'Festival Holiday'),
            ('Gandhi Jayanti', date(2025, 10, 2), True, 'National Holiday'),
            ('Diwali Break', date(2025, 10, 20), False, 'Diwali Festival'),
            ('Christmas Holiday', date(2025, 12, 25), True, 'Christmas Day'),
            ('Republic Day', date(2026, 1, 26), True, 'National Holiday'),
        ]
        for hname, hdate, rec, hdesc in holidays_data:
            hol = Holiday.query.filter_by(holiday_name=hname, holiday_date=hdate).first()
            if not hol:
                db.session.add(Holiday(holiday_name=hname, holiday_date=hdate, is_recurring=rec, description=hdesc))

        db.session.commit()

        # ----------------------------------------------------
        # 10. AUDIT LOGS
        # ----------------------------------------------------
        print(" -> Creating Showcase Audit Trail...")
        AuditLog.log_action(
            user_id=admin.user_id,
            username='admin',
            action='INITIALIZE_DATABASE',
            module='SYSTEM',
            details='Database populated with Kinder Park showcase dataset (12 Students, 17 Books, 41 Copies, Issues & Returns)'
        )

        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")

if __name__ == '__main__':
    seed_database()
