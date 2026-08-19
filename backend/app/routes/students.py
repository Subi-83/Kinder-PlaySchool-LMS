from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import text
from app import db
from app.models.student import Student
from app.models.academic import AcademicYear, Programme, StudentEnrollment, GradeLevel
from app.models.deposit import DepositAccount
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, get_current_user
from datetime import datetime, timedelta
from io import BytesIO, StringIO
from zipfile import ZipFile, BadZipFile
from xml.etree import ElementTree as ET
import csv
import re

students_bp = Blueprint('students', __name__, url_prefix='/api/students')

XLSX_NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def _clean_header(value):
    return re.sub(r'[^a-z0-9]+', ' ', str(value or '').lower()).strip()

def _index_to_col_letter(n):
    string = ""
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        string = chr(65 + remainder) + string
    return string

def _xlsx_date(value):
    val_str = str(value or '').strip()
    if not val_str:
        return None

    # Handle Excel float/int serial numbers (e.g. 44562 -> 2022-01-01)
    try:
        num = float(val_str)
        if 10000 <= num <= 80000:
            return (datetime(1899, 12, 30) + timedelta(days=num)).date()
    except (ValueError, TypeError, OverflowError):
        pass

    clean_str = re.sub(r'\s+00:00:00.*$', '', val_str)
    clean_str = re.sub(r'T00:00:00.*$', '', clean_str)

    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y', '%Y/%m/%d', '%d-%b-%Y', '%d %b %Y'):
        try:
            return datetime.strptime(clean_str, fmt).date()
        except ValueError:
            pass

    try:
        from dateutil import parser as date_parser  # type: ignore
        dt = date_parser.parse(clean_str, dayfirst=True)
        return dt.date()
    except Exception:
        pass

    return None

def _parse_student_file(file_bytes, filename="file.xlsx"):
    """Parse .xlsx Excel spreadsheets or .csv files into a list of row dictionaries."""
    filename_lower = (filename or '').lower()

    # Handle CSV files
    if filename_lower.endswith('.csv'):
        text = None
        for encoding in ('utf-8-sig', 'utf-8', 'latin-1', 'cp1252'):
            try:
                text = file_bytes.decode(encoding)
                break
            except (UnicodeDecodeError, AttributeError):
                continue
        if text is None:
            raise ValueError('Unable to read CSV file encoding.')
        reader = csv.reader(StringIO(text))
        all_rows = [row for row in reader if any(cell.strip() for cell in row)]
        if len(all_rows) < 2:
            return []
        headers = [_clean_header(val) for val in all_rows[0]]
        result = []
        for row in all_rows[1:]:
            row_dict = {}
            for i, val in enumerate(row):
                if i < len(headers) and headers[i]:
                    row_dict[headers[i]] = val.strip()
            if row_dict:
                result.append(row_dict)
        return result

    # Handle XLSX files
    try:
        with ZipFile(BytesIO(file_bytes)) as archive:
            shared_strings = []
            shared_xml_path = None
            for name in archive.namelist():
                if name.lower() == 'xl/sharedstrings.xml':
                    shared_xml_path = name
                    break
            
            if shared_xml_path:
                root = ET.fromstring(archive.read(shared_xml_path))
                for item in root.findall('.//x:si', XLSX_NS):
                    parts = [elem.text for elem in item.iter() if elem.tag.endswith('t') and elem.text]
                    shared_strings.append(''.join(parts))
            
            sheet_paths = [name for name in archive.namelist() if 'xl/worksheets/sheet' in name.lower() and name.lower().endswith('.xml')]
            if not sheet_paths:
                sheet_paths = [name for name in archive.namelist() if 'xl/worksheets/' in name.lower() and name.lower().endswith('.xml')]
            
            if not sheet_paths:
                raise ValueError('No worksheet found in the Excel archive.')
            
            sheet_paths.sort()
            sheet = ET.fromstring(archive.read(sheet_paths[0]))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise ValueError('Please upload a valid .xlsx spreadsheet or .csv file.') from exc

    raw_rows = []
    for row_elem in sheet.findall('.//x:sheetData/x:row', XLSX_NS):
        row_values = {}
        col_index = 1
        for cell in row_elem.findall('x:c', XLSX_NS):
            r_attr = cell.get('r', '')
            match = re.match(r'([A-Z]+)', r_attr) if r_attr else None
            col_letter = match.group(1) if match else _index_to_col_letter(col_index)
            
            val = ''
            t_attr = cell.get('t', '')
            if t_attr == 's':
                v_text = cell.findtext('x:v', default='', namespaces=XLSX_NS)
                if v_text and v_text.isdigit() and int(v_text) < len(shared_strings):
                    val = shared_strings[int(v_text)]
            elif t_attr == 'inlineStr':
                parts = [elem.text for elem in cell.iter() if elem.tag.endswith('t') and elem.text]
                val = ''.join(parts)
            else:
                v_text = cell.findtext('x:v', default='', namespaces=XLSX_NS)
                if v_text is not None:
                    val = v_text
            
            val = val.strip()
            if val:
                row_values[col_letter] = val
            col_index += 1
        
        if row_values:
            raw_rows.append(row_values)

    if len(raw_rows) < 2:
        return []

    headers = {col: _clean_header(val) for col, val in raw_rows[0].items()}
    result = []
    for row in raw_rows[1:]:
        row_dict = {}
        for col, val in row.items():
            header = headers.get(col)
            if header:
                row_dict[header] = val
        if row_dict:
            result.append(row_dict)
    return result

def _sheet_value(row, *names):
    for name in names:
        cleaned_alias = _clean_header(name)
        if cleaned_alias in row and str(row[cleaned_alias] or '').strip():
            return str(row[cleaned_alias]).strip()
    
    # Secondary check for partial/substring matching
    for name in names:
        cleaned_alias = _clean_header(name)
        if not cleaned_alias:
            continue
        for key, val in row.items():
            if str(val or '').strip() and (cleaned_alias in key or key in cleaned_alias):
                return str(val).strip()
    return ''

def _match_programme(value, default_programme=None, auto_create=True):
    val_str = str(value or '').strip()
    if not val_str:
        return default_programme

    needle = _clean_header(val_str)

    # 1. Exact clean header match against active programmes
    for p in Programme.get_active_programmes():
        p_name = _clean_header(p.programme_name)
        p_code = _clean_header(p.programme_code or '')
        p_grade = _clean_header(p.grade_level or '')
        if needle == p_name or needle == p_code or needle == p_grade:
            return p

    # 2. Strict prefix/whole code match
    for p in Programme.get_active_programmes():
        p_code = _clean_header(p.programme_code or '')
        p_name = _clean_header(p.programme_name)
        if p_code and (needle == p_code or needle.startswith(p_code + ' ')):
            return p
        if p_name and p_name == needle:
            return p

    # 3. Auto-create new distinct programme if auto_create is enabled
    if auto_create:
        clean_title = val_str[:100]
        words = [w for w in clean_title.upper().split() if w.isalnum()]
        code = ''.join(w[0] for w in words[:4]) if words else clean_title[:4].upper()
        
        base_code = code[:25]
        counter = 1
        while Programme.query.filter_by(programme_code=code).first():
            code = f"{base_code}{counter}"
            counter += 1

        new_prog = Programme(
            programme_name=clean_title,
            programme_code=code[:30],
            description="Auto-created from Excel import",
            grade_level=clean_title[:50],
            is_active=True
        )
        db.session.add(new_prog)
        db.session.flush()
        return new_prog

    return default_programme

def _match_subscription_plan(value):
    from app.models.subscription import SubscriptionPlan
    needle = _clean_header(value)
    if not needle or needle in {'not applicable', 'no', 'none', 'false'}:
        return None
    for plan in SubscriptionPlan.get_active_plans():
        tokens = (_clean_header(plan.plan_name), _clean_header(plan.plan_code))
        if any(token and (token in needle or needle in token) for token in tokens):
            return plan
    return None

@students_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('student.view')
def get_students():
    """Get all students"""
    students = Student.query.filter_by(is_active=True).order_by(Student.student_name).all()
    return jsonify([s.to_dict() for s in students]), 200

@students_bp.route('/search', methods=['GET'])
@jwt_required()
@permission_required('student.view')
def search_students():
    """Search students by name, roll number, STU ID, phone, email, school, grade"""
    q = (request.args.get('q') or '').strip()
    library_only = (request.args.get('library_only') or '').lower() in ('true', '1', 'yes')
    
    query = Student.query.filter_by(is_active=True)
    if library_only:
        query = query.filter(Student.library_access == True)
        
    if q:
        from app.models.academic import StudentEnrollment
        query = query.outerjoin(StudentEnrollment, Student.student_id == StudentEnrollment.student_id).filter(
            db.or_(
                Student.student_name.like(f'%{q}%'),
                Student.student_uid.like(f'%{q}%'),
                Student.mother_phone.like(f'%{q}%'),
                Student.father_phone.like(f'%{q}%'),
                Student.school_name.like(f'%{q}%'),
                StudentEnrollment.roll_number.like(f'%{q}%'),
                StudentEnrollment.grade.like(f'%{q}%')
            )
        ).distinct()
        
    students = query.limit(50).all()
    return jsonify([s.to_dict() for s in students]), 200

@students_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
@permission_required('student.view')
def get_student(student_id):
    """Get a specific student by ID"""
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    return jsonify(student.to_dict()), 200

@students_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('student.create')
def create_student():
    """Create a student and initial enrollment with an automatic roll number."""
    data = request.get_json() or {}
    required_fields = {
        'student_name': 'Student name', 'date_of_birth': 'Date of birth', 'school_name': 'School name',
        'programme_id': 'Programme', 'academic_year_id': 'Academic year', 'grade': 'Grade',
        'mother_name': "Mother''s name", 'mother_phone': "Mother''s phone number",
        'father_name': "Father''s name", 'father_phone': "Father''s phone number",
    }
    missing = [label for key, label in required_fields.items() if not str(data.get(key) or '').strip()]
    if missing:
        return jsonify({'error': f"Required fields missing: {', '.join(missing)}"}), 400
    programme = Programme.query.filter_by(programme_id=data['programme_id'], is_active=True).first()
    academic_year = AcademicYear.query.filter_by(academic_year_id=data['academic_year_id'], is_active=True).first()
    if not programme or not academic_year:
        return jsonify({'error': 'Please select an active programme and academic year'}), 400
    try:
        date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Date of birth must use YYYY-MM-DD'}), 400

    duplicates = Student.find_duplicate_candidates(data)
    if duplicates:
        return jsonify({
            'error': 'A matching student already exists. Select Existing / Old Student to add a new enrollment.',
            'existing_students': [student.to_dict() for student in duplicates]
        }), 409
    student = Student(student_uid=Student.generate_uid(), student_name=data['student_name'].strip(), date_of_birth=date_of_birth,
        gender=data.get('gender'), school_name=data['school_name'].strip(), student_email=data.get('student_email') or None, mother_name=data['mother_name'].strip(),
        mother_phone=data['mother_phone'].strip(), mother_email=data.get('mother_email') or None, father_name=data['father_name'].strip(),
        father_phone=data['father_phone'].strip(), father_email=data.get('father_email') or None, address=data.get('address'),
        emergency_contact_name=data.get('emergency_contact_name'), emergency_contact_phone=data.get('emergency_contact_phone'),
        medical_notes=data.get('medical_notes'), library_access=data.get('library_access', True))
    db.session.add(student)
    db.session.flush()
    db.session.add(DepositAccount(student_id=student.student_id))
    db.session.add(StudentEnrollment(student_id=student.student_id, academic_year_id=academic_year.academic_year_id,
        programme_id=programme.programme_id, grade=data['grade'].strip(), section=data.get('section'),
        roll_number=Student.generate_roll_number(academic_year, programme), enrollment_date=datetime.now().date()))
    db.session.commit()
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'
    AuditLog.log_action(user_id=user_id, username=username, action='CREATE_STUDENT', module='Student', record_id=student.student_uid, details=f'Created student: {student.student_name}')
    return jsonify(student.to_dict()), 201

@students_bp.route('/<int:student_id>', methods=['PUT'])
@jwt_required()
@permission_required('student.edit')
def update_student(student_id):
    """Update a student"""
    try:
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        data = request.get_json() or {}
        
        # Update fields
        if 'student_name' in data and data['student_name']:
            student.student_name = data['student_name'].strip()
        if 'date_of_birth' in data and data['date_of_birth']:
            if isinstance(data['date_of_birth'], str) and data['date_of_birth'].strip():
                try:
                    student.date_of_birth = datetime.strptime(data['date_of_birth'].split('T')[0], '%Y-%m-%d').date()
                except ValueError:
                    pass
        if 'gender' in data:
            g = str(data['gender'] or '').upper()
            student.gender = g if g in ['MALE', 'FEMALE', 'OTHER'] else 'OTHER'
        if 'school_name' in data:
            student.school_name = data['school_name']
        if 'student_email' in data:
            student.student_email = data['student_email'] or None
        if 'mother_name' in data:
            student.mother_name = data['mother_name']
        if 'mother_phone' in data:
            student.mother_phone = data['mother_phone']
        if 'mother_email' in data:
            student.mother_email = data['mother_email']
        if 'father_name' in data:
            student.father_name = data['father_name']
        if 'father_phone' in data:
            student.father_phone = data['father_phone']
        if 'father_email' in data:
            student.father_email = data['father_email']
        if 'address' in data:
            student.address = data['address']
        if 'emergency_contact_name' in data:
            student.emergency_contact_name = data['emergency_contact_name']
        if 'emergency_contact_phone' in data:
            student.emergency_contact_phone = data['emergency_contact_phone']
        if 'medical_notes' in data:
            student.medical_notes = data['medical_notes']
        if 'library_access' in data:
            student.library_access = bool(data['library_access'])
        if 'is_active' in data:
            student.is_active = data['is_active']

        # Profile edits deliberately never change academic history.  Use the
        # enrollment endpoint for every new year/programme/class assignment.

        db.session.commit()
        
        current_user = get_current_user()
        user_id = current_user.user_id if current_user else None
        username = current_user.username if current_user else 'system'
        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action='UPDATE_STUDENT',
            module='Student',
            record_id=student.student_uid,
            details=f'Updated student: {student.student_name}'
        )
        
        return jsonify(student.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Unable to update student: {str(e)}'}), 400

@students_bp.route('/<int:student_id>', methods=['DELETE'])
@jwt_required()
@permission_required('student.delete')
def delete_student(student_id):
    """Delete a student and their related records permanently."""
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    student_uid = student.student_uid
    student_name = student.student_name
    
    # Check if student has active book issues
    if hasattr(student, 'issues') and student.issues.filter_by(status='ACTIVE').count() > 0:
        return jsonify({'error': f'Cannot delete student {student_name}; they have active book issues. Please return books first.'}), 400
    
    try:
        from app.models.subscription import StudentSubscription
        from app.models.deposit import DepositAccount, DepositTransaction
        
        # Clean up related records
        StudentSubscription.query.filter_by(student_id=student_id).delete()
        
        dep_acc = DepositAccount.query.filter_by(student_id=student_id).first()
        if dep_acc:
            DepositTransaction.query.filter_by(account_id=dep_acc.account_id).delete()
            db.session.delete(dep_acc)
            
        StudentEnrollment.query.filter_by(student_id=student_id).delete()
        db.session.delete(student)
        db.session.commit()
        
        current_user = get_current_user()
        user_id = current_user.user_id if current_user else None
        username = current_user.username if current_user else 'system'
        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action='DELETE_STUDENT',
            module='Student',
            record_id=student_uid,
            details=f'Permanently deleted student: {student_name}'
        )
        return jsonify({'message': f'Student {student_name} deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete student: {str(e)}'}), 400


@students_bp.route('/reset-all', methods=['POST'])
@jwt_required()
@permission_required('student.delete')
def reset_all_students():
    """Clear all student records, enrollments, deposit accounts, subscriptions, and reset counters."""
    try:
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        tables = [
            "student_subscriptions",
            "deposit_transactions",
            "deposit_accounts",
            "student_enrollments",
            "students"
        ]
        cleared_summary = {}
        for tbl in tables:
            try:
                cnt = db.session.execute(text(f"SELECT COUNT(*) FROM {tbl};")).scalar()
                db.session.execute(text(f"DELETE FROM {tbl};"))
                db.session.execute(text(f"ALTER TABLE {tbl} AUTO_INCREMENT = 1;"))
                cleared_summary[tbl] = cnt
            except Exception:
                pass
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()

        current_user = get_current_user()
        user_id = current_user.user_id if current_user else None
        username = current_user.username if current_user else 'system'
        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action='RESET_ALL_STUDENTS',
            module='Student',
            record_id='ALL',
            details='Cleared all student records, enrollments, and reset sequence counters.'
        )

        return jsonify({'message': 'All student data cleared and roll numbers reset to 0001 successfully.', 'details': cleared_summary}), 200
    except Exception as exc:
        db.session.rollback()
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        return jsonify({'error': f'Failed to reset student data: {str(exc)}'}), 500


@students_bp.route('/import-students', methods=['POST'])
@students_bp.route('/import-membership', methods=['POST'])  # Backwards-compatible URL
@jwt_required()
@permission_required('student.create')
def import_membership_spreadsheet():
    """Import a student spreadsheet (.xlsx or .csv) into student records and enrollments."""
    upload = request.files.get('file')
    if not upload or not upload.filename:
        return jsonify({'error': 'Please choose a student Excel (.xlsx) or CSV (.csv) file to import.'}), 400
    
    filename_lower = upload.filename.lower()
    if not (filename_lower.endswith('.xlsx') or filename_lower.endswith('.csv')):
        return jsonify({'error': 'Only .xlsx Excel and .csv files are supported.'}), 400
        
    try:
        academic_year_id = int(request.form.get('academic_year_id', ''))
    except (ValueError, TypeError):
        return jsonify({'error': 'Select the target academic year for this student import.'}), 400
        
    academic_year = AcademicYear.query.filter_by(academic_year_id=academic_year_id, is_active=True).first()
    if not academic_year:
        return jsonify({'error': 'Select an active academic year for this student import.'}), 400
        
    try:
        default_programme_id = int(request.form.get('default_programme_id', ''))
    except (ValueError, TypeError):
        default_programme_id = None
        
    default_programme = Programme.query.filter_by(programme_id=default_programme_id, is_active=True).first() if default_programme_id else None

    try:
        rows = _parse_student_file(upload.read(), upload.filename)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
        
    if not rows:
        return jsonify({'error': 'The uploaded file has no data rows.'}), 400

    from app.models.subscription import StudentSubscription
    result = {'rows_read': len(rows), 'new_students': 0, 'existing_students': 0, 'enrollments_created': 0, 'subscriptions_created': 0, 'skipped': []}
    
    try:
        for row_number, row in enumerate(rows, start=2):
            name = _sheet_value(row, "CHILD'S NAME", "Child's Name", "Child Name", "Childs Name", "Student Name", "Student", "Name", "Full Name", "Student Full Name", "First Name")
            dob_val = _sheet_value(row, "DOB - DOB", "BIRTHDATE", "Birthdate", "Birth Date", "Date of Birth", "DOB", "Bday", "Birthday")
            dob = _xlsx_date(dob_val)
            programme_value = _sheet_value(row, "WHICH PROGRAMME ARE YOU SIGNING UP FOR", "WHICH PROGRAM ARE YOU SIGING UP FOR ?", "which program are you signing up for", "Programme", "Program", "Course", "Stream")
            programme = _match_programme(programme_value, default_programme=default_programme, auto_create=True)

            if not name or not programme:
                missing = []
                if not name: missing.append("Student Name")
                if not programme: missing.append(f"Programme (Excel value: '{programme_value or 'blank'}')")
                result['skipped'].append({'row': row_number, 'reason': f"Missing or unmapped {', '.join(missing)}. Select a Default Programme above if not present in Excel."})
                continue

            email = _sheet_value(row, "Email address", "Email Address", "Email", "Student Email", "Parent Email", "Contact Email")
            mother_phone = _sheet_value(row, "MOTHER'S MOBILE NUMBER", "Mother's Mobile Number", "Mother Phone", "Mother Mobile", "Mother Contact", "Mother Phone Number", "Mother Mobile Number")
            father_phone = _sheet_value(row, "FATHER'S MOBILE NUMBER", "Father's Mobile Number", "Father Phone", "Father Mobile", "Father Contact", "Father Phone Number", "Father Mobile Number")
            mother_email = _sheet_value(row, "Mother Email", "Mother's Email") or email
            father_email = _sheet_value(row, "Father Email", "Father's Email") or email
            raw_payment = _sheet_value(row, "MODE OF PAYMENT", "WHICH MODE OF PAYMENT DO YOU PREFER ?", "Payment Method", "Payment Mode")

            student_data = {
                'student_name': name,
                'date_of_birth': dob.strftime('%Y-%m-%d') if dob else None,
                'student_email': email,
                'mother_phone': mother_phone,
                'father_phone': father_phone,
                'mother_email': mother_email,
                'father_email': father_email,
            }
            
            matches = Student.find_duplicate_candidates(student_data)
            if len(matches) > 1:
                result['skipped'].append({'row': row_number, 'reason': f"Multiple existing student records matched '{name}'; re-enroll manually."})
                continue
                
            if matches:
                student = matches[0]
                result['existing_students'] += 1
            else:
                gender_raw = _sheet_value(row, "GENDER", "Gender", "Sex").upper()
                gender = 'MALE' if 'MALE' in gender_raw or gender_raw.startswith('M') else ('FEMALE' if 'FEMALE' in gender_raw or gender_raw.startswith('F') else 'OTHER')
                
                student = Student(
                    student_uid=Student.generate_uid(),
                    student_name=name,
                    date_of_birth=dob,
                    gender=gender,
                    student_email=email or None,
                    school_name=_sheet_value(row, "SCHOOL", "School Name", "School", "Previous School") or 'Kinder Park',
                    mother_name=_sheet_value(row, "MOTHER'S NAME", "Mother's Name", "Mother Name", "Mother") or None,
                    mother_phone=mother_phone or None,
                    father_name=_sheet_value(row, "FATHER'S NAME", "Father's Name", "Father Name", "Father") or None,
                    father_phone=father_phone or None,
                    mother_email=mother_email or None,
                    father_email=father_email or None,
                    address=_sheet_value(row, "Address", "Residential Address", "Home Address") or None,
                    emergency_contact_name=_sheet_value(row, "Emergency Contact Name", "Emergency Contact", "Emergency Name") or None,
                    emergency_contact_phone=_sheet_value(row, "Emergency Contact Phone", "Emergency Phone", "Emergency Mobile") or None,
                    medical_notes=_sheet_value(row, "Medical Notes", "Medical Condition", "Allergies", "Remarks") or None,
                    library_access=True
                )
                db.session.add(student)
                db.session.flush()
                db.session.add(DepositAccount(student_id=student.student_id))
                result['new_students'] += 1

            enrollment = StudentEnrollment.query.filter_by(
                student_id=student.student_id,
                academic_year_id=academic_year.academic_year_id,
                programme_id=programme.programme_id,
            ).first()
            
            if not enrollment:
                raw_grade = _sheet_value(row, "GRADE", "Grade", "Class", "Standard", "Section")
                enrollment = StudentEnrollment(
                    student_id=student.student_id,
                    academic_year_id=academic_year.academic_year_id,
                    programme_id=programme.programme_id,
                    grade=raw_grade[:50] if raw_grade else None,
                    roll_number=Student.generate_roll_number(academic_year, programme),
                    enrollment_date=datetime.now().date(),
                    registration_source='EXCEL_IMPORT',
                    payment_method=raw_payment[:100] if raw_payment else None,
                    payment_proof_url=_sheet_value(row, "PROOF OF PAYMENT SCAN QR CODE 2", "Proof of Payment", "PROOF OF PAYMENT") or None,
                    payment_qr_url=_sheet_value(row, "SCAN QR CODE", "SCAN QR CODE 2") or None,
                )
                db.session.add(enrollment)
                db.session.flush()
                result['enrollments_created'] += 1

            wants_subscription = _clean_header(_sheet_value(row, "WOULD YOU LIKE TO TAKE A LIBRARY SUBSCRIPTION / IF YES, WHICH LIBRARY PACKAGE WOULD YOU LIKE TO CHOOSE?", "WOULD YOU LIKE TO TAKE A LIBRARY SUBSCRIPTION ?", "WOULD YOU LIKE TO TAKE A LIBRARY SUBSCRIPTION", "Library Subscription", "Library Package")) in {'yes', 'y', 'true', '1'}
            plan = _match_subscription_plan(_sheet_value(row, "LIBRARY PACKAGE", "IF YES, WHICH LIBRARY PACKAGE WOULD YOU LIKE TO SUBSCRIBE TO ?", "Subscription Plan", "Library Package"))
            
            if wants_subscription and plan and not StudentSubscription.query.filter_by(student_id=student.student_id, subscription_plan_id=plan.subscription_plan_id, status='ACTIVE').first():
                StudentSubscription.query.filter_by(student_id=student.student_id, status='ACTIVE').update({'status': 'EXPIRED'})
                db.session.add(StudentSubscription(
                    student_id=student.student_id,
                    subscription_plan_id=plan.subscription_plan_id,
                    start_date=datetime.now().date(),
                    end_date=datetime.now().date() + timedelta(days=plan.duration_months * 30),
                    status='ACTIVE',
                    amount_paid=plan.price,
                    payment_date=datetime.now().date(),
                    payment_method=raw_payment[:50] if raw_payment else None,
                    notes='Created from student Excel import',
                ))
                result['subscriptions_created'] += 1
            elif wants_subscription and not plan:
                result['skipped'].append({'row': row_number, 'reason': f"Student '{name}' imported, but selected library package was not found in Subscription Plans."})
                
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({'error': f'Import failed; no rows were saved: {str(exc)}'}), 400

    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='IMPORT_STUDENT_SPREADSHEET',
        module='Student',
        details=f"Imported {result['enrollments_created']} enrollment(s) from {upload.filename}"
    )
    return jsonify(result), 201

@students_bp.route('/enrollments', methods=['POST'])
@jwt_required()
@permission_required('student.edit')
def create_enrollment():
    """Create a new student enrollment or re-enroll for next academic year"""
    try:
        data = request.get_json() or {}
        
        s_id = data.get('student_id')
        ay_id = data.get('academic_year_id')
        p_id = data.get('programme_id')
        if not s_id or not ay_id or not p_id:
            return jsonify({'error': 'Please select an active Academic Year and Programme.'}), 400
        try:
            student_id = int(s_id)
            academic_year_id = int(ay_id)
            programme_id = int(p_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Valid student, academic year, and programme IDs are required'}), 400

        student = Student.query.get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        programme = Programme.query.filter_by(programme_id=programme_id, is_active=True).first()
        academic_year = AcademicYear.query.filter_by(academic_year_id=academic_year_id, is_active=True).first()
        if not programme or not academic_year:
            return jsonify({'error': 'Please select an active programme and academic year'}), 400

        existing_enrollment = StudentEnrollment.query.filter_by(
            student_id=student_id,
            academic_year_id=academic_year_id,
            programme_id=programme_id,
        ).first()
        if existing_enrollment:
            return jsonify({
                'message': 'This enrollment already exists; no new enrollment was created.',
                'enrollment': existing_enrollment.to_dict(),
            }), 200

        # Preserve old records.  The new enrollment is appended; only a prior
        # active enrollment from a different academic year is marked complete.
        active_enrollments = StudentEnrollment.query.filter_by(student_id=student_id, status='ACTIVE').all()
        for enc in active_enrollments:
            if enc.academic_year_id != academic_year_id:
                enc.status = 'COMPLETED'
                enc.completion_date = datetime.now().date()

        enrollment = StudentEnrollment(
            student_id=student_id,
            academic_year_id=academic_year_id,
            programme_id=programme_id,
            grade=str(data.get('grade') or '').strip(),
            section=data.get('section'),
            roll_number=Student.generate_roll_number(academic_year, programme),
            enrollment_date=datetime.now().date(),
            status='ACTIVE'
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        current_user = get_current_user()
        user_id = current_user.user_id if current_user else None
        username = current_user.username if current_user else 'system'
        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action='CREATE_ENROLLMENT',
            module='Student',
            record_id=str(enrollment.enrollment_id),
            details=f'Created enrollment for student {enrollment.student_id}'
        )
        
        return jsonify(enrollment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@students_bp.route('/promote', methods=['POST'])
@jwt_required()
@permission_required('student.edit')
def promote_students():
    """Bulk promote students to new academic year"""
    data = request.get_json()
    
    student_ids = data.get('student_ids', [])
    new_academic_year_id = data.get('academic_year_id')
    new_programme_id = data.get('programme_id')
    new_grade = data.get('grade')
    
    if not student_ids or not new_academic_year_id or not new_programme_id:
        return jsonify({'error': 'Student IDs, academic year and programme required'}), 400
    
    promoted = []
    errors = []
    
    for student_id in student_ids:
        try:
            enrollment = StudentEnrollment.promote_student(
                student_id=student_id,
                new_academic_year_id=new_academic_year_id,
                new_programme_id=new_programme_id,
                new_grade=new_grade
            )
            
            # Generate roll number
            programme = Programme.query.get(new_programme_id)
            if programme:
                enrollment.roll_number = Student.generate_roll_number(AcademicYear.query.get(new_academic_year_id), programme)
            
            db.session.commit()
            promoted.append(enrollment.to_dict())
        except Exception as e:
            errors.append({'student_id': student_id, 'error': str(e)})
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='PROMOTE_STUDENTS',
        module='Student',
        details=f'Promoted {len(promoted)} students to new academic year'
    )
    
    return jsonify({
        'promoted': promoted,
        'errors': errors,
        'total': len(promoted)
    }), 200

# Academic Years endpoints
@students_bp.route('/academic-years', methods=['GET'])
@jwt_required()
@permission_required('student.view')
def get_academic_years():
    """Get all academic years"""
    years = AcademicYear.get_active_years()
    return jsonify([y.to_dict() for y in years]), 200

@students_bp.route('/academic-years', methods=['POST'])
@jwt_required()
@permission_required('programme.create')
def create_academic_year():
    """Create a new academic year"""
    data = request.get_json() or {}
    
    # If setting as current, unset others
    if data.get('is_current'):
        AcademicYear.query.update({'is_current': False})
    
    try:
        start_d = datetime.strptime(data.get('start_date', ''), '%Y-%m-%d').date()
        end_d = datetime.strptime(data.get('end_date', ''), '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return jsonify({'error': 'Valid start_date and end_date (YYYY-MM-DD) are required'}), 400

    year = AcademicYear(
        year_code=data.get('year_code'),
        year_name=data.get('year_name'),
        start_date=start_d,
        end_date=end_d,
        is_current=data.get('is_current', False)
    )
    
    db.session.add(year)
    db.session.commit()
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='CREATE_ACADEMIC_YEAR',
        module='Academic',
        record_id=data.get('year_code'),
        details=f'Created academic year: {data.get("year_code")}'
    )
    
    return jsonify(year.to_dict()), 201

@students_bp.route('/academic-years/<int:academic_year_id>', methods=['PUT'])
@jwt_required()
@permission_required('programme.edit')
def update_academic_year(academic_year_id):
    """Update an academic year"""
    year = AcademicYear.query.get(academic_year_id)
    if not year:
        return jsonify({'error': 'Academic year not found'}), 404

    data = request.get_json() or {}

    if data.get('is_current'):
        AcademicYear.query.update({'is_current': False})

    for field in ('year_code', 'year_name', 'is_current', 'is_active'):
        if field in data:
            setattr(year, field, data[field])
    if data.get('start_date'):
        try: year.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        except ValueError: pass
    if data.get('end_date'):
        try: year.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError: pass

    db.session.commit()
    return jsonify(year.to_dict()), 200

@students_bp.route('/academic-years/<int:academic_year_id>', methods=['DELETE'])
@jwt_required()
@permission_required('programme.delete')
def delete_academic_year(academic_year_id):
    """Deactivate an academic year (soft delete — student enrollments may reference it)"""
    year = AcademicYear.query.get(academic_year_id)
    if not year:
        return jsonify({'error': 'Academic year not found'}), 404

    year.is_active = False
    db.session.commit()
    return jsonify({'message': f'Academic year {year.year_code} deactivated'}), 200

# Programmes endpoints
@students_bp.route('/programmes', methods=['GET'])
@jwt_required()
@permission_required('programme.view')
def get_programmes():
    """Get all programmes"""
    programmes = Programme.get_active_programmes()
    return jsonify([p.to_dict() for p in programmes]), 200

@students_bp.route('/programmes', methods=['POST'])
@jwt_required()
@permission_required('programme.create')
def create_programme():
    """Create a new programme"""
    data = request.get_json() or {}
    
    def _to_i(v, default=0):
        try: return int(v)
        except (TypeError, ValueError): return default

    programme = Programme(
        programme_name=data.get('programme_name'),
        programme_code=data.get('programme_code'),
        description=data.get('description'),
        grade_level=data.get('grade_level'),
        max_books_allowed=_to_i(data.get('max_books_allowed'), 2),
        library_access=bool(data.get('library_access', True)),
        sort_order=_to_i(data.get('sort_order'), 0)
    )
    
    db.session.add(programme)
    db.session.commit()
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='CREATE_PROGRAMME',
        module='Programme',
        record_id=data.get('programme_code'),
        details=f'Created programme: {data.get("programme_name")}'
    )
    
    return jsonify(programme.to_dict()), 201

@students_bp.route('/programmes/<int:programme_id>', methods=['PUT'])
@jwt_required()
@permission_required('programme.edit')
def update_programme(programme_id):
    """Update a programme"""
    programme = Programme.query.get(programme_id)
    if not programme:
        return jsonify({'error': 'Programme not found'}), 404

    data = request.get_json() or {}
    
    def _to_i(v, default=0):
        try: return int(v)
        except (TypeError, ValueError): return default

    for field in ('programme_name', 'programme_code', 'description', 'grade_level', 'library_access', 'is_active'):
        if field in data:
            setattr(programme, field, data[field])
    if 'max_books_allowed' in data:
        programme.max_books_allowed = _to_i(data['max_books_allowed'], 2)
    if 'sort_order' in data:
        programme.sort_order = _to_i(data['sort_order'], 0)

    db.session.commit()
    return jsonify(programme.to_dict()), 200

@students_bp.route('/programmes/<int:programme_id>', methods=['DELETE'])
@jwt_required()
@permission_required('programme.delete')
def delete_programme(programme_id):
    """Deactivate a programme (soft delete — students may reference it)"""
    programme = Programme.query.get(programme_id)
    if not programme:
        return jsonify({'error': 'Programme not found'}), 404

    programme.is_active = False
    db.session.commit()
    return jsonify({'message': f'Programme {programme.programme_name} deactivated'}), 200
@students_bp.route('/grades', methods=['GET'])
@jwt_required()
@permission_required('student.view')
def get_grades():
    """Get all grade levels"""
    grades = GradeLevel.get_active_grades()
    return jsonify([g.to_dict() for g in grades]), 200
