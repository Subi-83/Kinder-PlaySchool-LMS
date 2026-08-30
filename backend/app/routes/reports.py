from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.book import BookCopy, BookTitle
from app.models.student import Student
from app.models.library import BookIssue, BookReturn
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.subscription import StudentSubscription
from app.models.academic import AcademicYear, StudentEnrollment
from app.services.settings_service import SettingsService
from app.middleware.auth_middleware import permission_required
from datetime import datetime, timedelta

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/stock', methods=['GET'])
@jwt_required()
@permission_required('report.stock')
def stock_report():
    """Get book stock report"""
    total_books = BookCopy.query.count()
    available = BookCopy.query.filter_by(status='AVAILABLE').count()
    issued = BookCopy.query.filter_by(status='ISSUED').count()
    damaged = BookCopy.query.filter_by(status='DAMAGED').count()
    lost = BookCopy.query.filter_by(status='LOST').count()
    reserved = BookCopy.query.filter_by(status='RESERVED').count()
    
    return jsonify({
        'total_books': total_books,
        'available': available,
        'issued': issued,
        'damaged': damaged,
        'lost': lost,
        'reserved': reserved,
        'available_percentage': round((available / total_books * 100) if total_books > 0 else 0, 2)
    }), 200

@reports_bp.route('/members', methods=['GET'])
@jwt_required()
@permission_required('report.member')
def member_report():
    """Get member report"""
    total_students = Student.query.count()
    active_members = StudentSubscription.query.filter_by(status='ACTIVE').count()
    expired_members = StudentSubscription.query.filter_by(status='EXPIRED').count()
    
    # Students with no subscription
    students_with_subs = db.session.query(StudentSubscription.student_id).distinct().subquery()
    no_subscription = Student.query.filter(~Student.student_id.in_(students_with_subs)).count()
    
    return jsonify({
        'total_students': total_students,
        'active_members': active_members,
        'expired_members': expired_members,
        'no_subscription': no_subscription,
        'active_percentage': round((active_members / total_students * 100) if total_students > 0 else 0, 2)
    }), 200

@reports_bp.route('/fines', methods=['GET'])
@jwt_required()
@permission_required('report.fine')
def fine_report():
    """Get assessed late fines from returns, independent of deposit deductions."""
    total_fines = db.session.query(
        db.func.sum(BookReturn.fine_amount)
    ).filter(BookReturn.fine_amount > 0).scalar() or 0
    
    # Fines from last 30 days
    thirty_days_ago = datetime.now().date() - timedelta(days=30)
    recent_fines = db.session.query(
        db.func.sum(BookReturn.fine_amount)
    ).filter(
        BookReturn.fine_amount > 0,
        BookReturn.return_date >= thirty_days_ago
    ).scalar() or 0
    
    # Fines by month (last 6 months)
    monthly_fines = []
    for i in range(6):
        month_index = datetime.now().year * 12 + (datetime.now().month - 1) - i
        year, zero_based_month = divmod(month_index, 12)
        month_start = datetime(year, zero_based_month + 1, 1).date()
        next_month_index = month_index + 1
        next_year, next_zero_based_month = divmod(next_month_index, 12)
        month_end = datetime(next_year, next_zero_based_month + 1, 1).date()
        
        amount = db.session.query(
            db.func.sum(BookReturn.fine_amount)
        ).filter(
            BookReturn.fine_amount > 0,
            BookReturn.return_date >= month_start,
            BookReturn.return_date < month_end
        ).scalar() or 0
        
        monthly_fines.append({
            'month': month_start.strftime('%b %Y'),
            'amount': float(amount)
        })

    fine_returns = BookReturn.query.filter(BookReturn.fine_amount > 0).order_by(
        BookReturn.return_date.desc(), BookReturn.return_id.desc()
    ).all()
    
    return jsonify({
        'total_fines': float(total_fines),
        'this_month_fines': monthly_fines[0]['amount'] if monthly_fines else 0.0,
        'recent_fines_30days': float(recent_fines),
        'monthly_fines': monthly_fines,
        'fine_transactions': [
            {
                'return_id': book_return.return_id,
                'issue_id': book_return.issue_id,
                'student_id': book_return.issue.student_ref.student_uid if book_return.issue and book_return.issue.student_ref else None,
                'student_name': book_return.issue.student_ref.student_name if book_return.issue and book_return.issue.student_ref else None,
                'book_id': book_return.issue.copy_ref.barcode if book_return.issue and book_return.issue.copy_ref else None,
                'book_title': book_return.issue.copy_ref.title_ref.title if book_return.issue and book_return.issue.copy_ref and book_return.issue.copy_ref.title_ref else None,
                'amount': float(book_return.fine_amount or 0),
                'return_date': book_return.return_date.strftime('%Y-%m-%d') if book_return.return_date else None,
                'received_by': book_return.receiver.username if book_return.receiver else None,
                'notes': book_return.notes or '-'
            }
            for book_return in fine_returns
        ]
    }), 200

@reports_bp.route('/financial', methods=['GET'])
@jwt_required()
@permission_required('report.financial')
def financial_report():
    """Get financial report"""
    total_deposits = db.session.query(
        db.func.sum(DepositTransaction.amount)
    ).filter(
        DepositTransaction.transaction_type.in_(['INITIAL_DEPOSIT', 'TOP_UP'])
    ).scalar() or 0
    
    total_fines = db.session.query(
        db.func.abs(db.func.sum(DepositTransaction.amount))
    ).filter_by(transaction_type='FINE').scalar() or 0
    
    total_damages = db.session.query(
        db.func.abs(db.func.sum(DepositTransaction.amount))
    ).filter_by(transaction_type='DAMAGE_CHARGE').scalar() or 0
    
    total_lost = db.session.query(
        db.func.abs(db.func.sum(DepositTransaction.amount))
    ).filter_by(transaction_type='LOST_BOOK').scalar() or 0
    
    # Current total balance across all accounts
    total_balance = db.session.query(
        db.func.sum(DepositAccount.current_balance)
    ).scalar() or 0

    total_subscription_payments = db.session.query(
        db.func.sum(StudentSubscription.amount_paid)
    ).scalar() or 0

    financial_transactions = DepositTransaction.query.order_by(
        DepositTransaction.created_at.desc()
    ).all()
    subscription_payments = StudentSubscription.query.filter(
        StudentSubscription.amount_paid.isnot(None)
    ).order_by(StudentSubscription.payment_date.desc()).all()
    
    return jsonify({
        'total_deposits': float(total_deposits),
        'total_fines': float(total_fines),
        'total_damages': float(total_damages),
        'total_lost_books': float(total_lost),
        'net_collection': float(total_fines + total_damages + total_lost),
        'total_subscription_payments': float(total_subscription_payments),
        'gross_collection': float(total_deposits + total_subscription_payments),
        'total_balance': float(total_balance),
        'deposit_transactions': [
            {
                'transaction_id': transaction.transaction_id,
                'student_id': transaction.account_ref.student.student_uid if transaction.account_ref and transaction.account_ref.student else None,
                'student_name': transaction.account_ref.student.student_name if transaction.account_ref and transaction.account_ref.student else None,
                'transaction_type': transaction.transaction_type,
                'amount': float(transaction.amount),
                'balance_after': float(transaction.balance_after),
                'reference_id': transaction.reference_id,
                'description': transaction.description,
                'created_at': transaction.created_at.strftime('%Y-%m-%d %H:%M:%S') if transaction.created_at else None,
            }
            for transaction in financial_transactions
        ],
        'subscription_payments': [
            {
                'subscription_id': subscription.subscription_id,
                'student_id': subscription.student_ref.student_uid if subscription.student_ref else None,
                'student_name': subscription.student_ref.student_name if subscription.student_ref else None,
                'plan_name': subscription.plan_ref.plan_name if subscription.plan_ref else None,
                'amount_paid': float(subscription.amount_paid),
                'payment_date': subscription.payment_date.strftime('%Y-%m-%d') if subscription.payment_date else None,
                'payment_method': subscription.payment_method,
                'status': subscription.status,
            }
            for subscription in subscription_payments
        ]
    }), 200

@reports_bp.route('/issue-return', methods=['GET'])
@jwt_required()
@permission_required('report.issue_return')
def issue_return_report():
    """Get issue/return report"""
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Today's stats
    today_issues = BookIssue.query.filter_by(issue_date=today).count()
    today_returns = BookReturn.query.filter_by(return_date=today).count()
    
    # Weekly stats
    weekly_issues = BookIssue.query.filter(
        BookIssue.issue_date >= week_ago
    ).count()
    weekly_returns = BookReturn.query.filter(
        BookReturn.return_date >= week_ago
    ).count()
    
    # Monthly stats
    monthly_issues = BookIssue.query.filter(
        BookIssue.issue_date >= month_ago
    ).count()
    monthly_returns = BookReturn.query.filter(
        BookReturn.return_date >= month_ago
    ).count()
    
    # Overdue books
    overdue = BookIssue.query.filter(
        BookIssue.due_date < today,
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).count()
    
    # Active issues
    active_issues = BookIssue.query.filter(
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).count()

    issue_records = BookIssue.query.order_by(BookIssue.issue_date.desc(), BookIssue.issue_id.desc()).all()
    
    return jsonify({
        'today_issues': today_issues,
        'today_returns': today_returns,
        'weekly_issues': weekly_issues,
        'weekly_returns': weekly_returns,
        'monthly_issues': monthly_issues,
        'monthly_returns': monthly_returns,
        'overdue': overdue,
        'active_issues': active_issues,
        'issue_return_records': [
            {
                'issue_id': issue.issue_id,
                'student_id': issue.student_ref.student_uid if issue.student_ref else None,
                'student_name': issue.student_ref.student_name if issue.student_ref else None,
                'book_id': issue.copy_ref.barcode if issue.copy_ref else None,
                'book_title': issue.copy_ref.title_ref.title if issue.copy_ref and issue.copy_ref.title_ref else None,
                'issue_date': issue.issue_date.strftime('%Y-%m-%d') if issue.issue_date else None,
                'due_date': issue.due_date.strftime('%Y-%m-%d') if issue.due_date else None,
                'return_date': issue.returns.return_date.strftime('%Y-%m-%d') if issue.returns and issue.returns.return_date else None,
                'status': issue.status,
                'fine_amount': float(issue.returns.fine_amount) if issue.returns else 0.0,
                'damage_charge': float(issue.returns.damage_charge) if issue.returns else 0.0,
            }
            for issue in issue_records
        ]
    }), 200

@reports_bp.route('/dashboard-alerts', methods=['GET'])
@jwt_required()
@permission_required('report.issue_return')
def dashboard_alerts():
    """Return the actionable student warnings displayed on the dashboard."""
    today = datetime.now().date()
    overdue_issues = BookIssue.query.filter(
        BookIssue.due_date < today,
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).order_by(BookIssue.due_date.asc()).all()

    current_year = AcademicYear.get_current()
    threshold = SettingsService.get_float('low_deposit_threshold', 300)
    low_balance_accounts = [] if not current_year else DepositAccount.query.join(Student).join(StudentEnrollment).join(StudentSubscription, StudentSubscription.student_id == Student.student_id).filter(
        StudentEnrollment.academic_year_id == current_year.academic_year_id,
        StudentEnrollment.library_access == True,
        StudentSubscription.academic_year_id == current_year.academic_year_id,
        StudentSubscription.status == 'ACTIVE',
        Student.is_active == True,
        DepositAccount.current_balance <= threshold
    ).distinct().order_by(DepositAccount.current_balance.asc()).all()

    return jsonify({
        'overdue_books': [
            {
                'issue_id': issue.issue_id,
                'student_id': issue.student_id,
                'student_uid': issue.student_ref.student_uid if issue.student_ref else None,
                'student_name': issue.student_ref.student_name if issue.student_ref else None,
                'book_title': issue.copy_ref.title_ref.title if issue.copy_ref and issue.copy_ref.title_ref else None,
                'due_date': issue.due_date.strftime('%Y-%m-%d'),
                'days_overdue': (today - issue.due_date).days,
            }
            for issue in overdue_issues
        ],
        'low_deposits': [
            {
                'student_id': account.student_id,
                'student_uid': account.student.student_uid if account.student else None,
                'student_name': account.student.student_name if account.student else None,
                'current_balance': float(account.current_balance),
                'warning_threshold': threshold,
            }
            for account in low_balance_accounts
        ],
    }), 200

@reports_bp.route('/top-students', methods=['GET'])
@jwt_required()
@permission_required('report.member')
def top_students_report():
    """Get top students by book issues"""
    limit = request.args.get('limit', 10, type=int)
    
    results = db.session.query(
        Student.student_uid,
        Student.student_name,
        db.func.count(BookIssue.issue_id).label('issue_count')
    ).join(BookIssue, BookIssue.student_id == Student.student_id)\
     .filter(BookIssue.status == 'RETURNED')\
     .group_by(Student.student_id)\
     .order_by(db.desc('issue_count'))\
     .limit(limit).all()
    
    return jsonify([
        {
            'student_uid': r[0],
            'student_name': r[1],
            'issue_count': r[2]
        } for r in results
    ]), 200

@reports_bp.route('/popular-books', methods=['GET'])
@jwt_required()
@permission_required('report.stock')
def popular_books_report():
    """Get most popular books"""
    limit = request.args.get('limit', 10, type=int)
    
    results = db.session.query(
        BookTitle.book_title_id,
        BookTitle.title,
        BookTitle.author,
        db.func.count(BookIssue.issue_id).label('issue_count')
    ).join(BookCopy, BookCopy.book_title_id == BookTitle.book_title_id)\
     .join(BookIssue, BookIssue.book_copy_id == BookCopy.book_copy_id)\
     .filter(BookIssue.status == 'RETURNED')\
     .group_by(BookTitle.book_title_id)\
     .order_by(db.desc('issue_count'))\
     .limit(limit).all()
    
    return jsonify([
        {
            'book_title_id': r[0],
            'title': r[1],
            'author': r[2],
            'issue_count': r[3]
        } for r in results
    ]), 200

@reports_bp.route('/students-detailed', methods=['GET'])
@jwt_required()
@permission_required('report.member')
def students_detailed_report():
    """Get detailed students report with filters for Level, Library Access, Subscription, Deposit, and Date Range"""
    from app.models.academic import StudentEnrollment, Programme
    
    level_filter = (request.args.get('level') or '').strip()
    library_access_filter = request.args.get('library_access')
    sub_status_filter = request.args.get('subscription_status')
    deposit_status_filter = request.args.get('deposit_status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    academic_year_id = request.args.get('academic_year_id', type=int)
    search = (request.args.get('search') or '').strip()

    query = Student.query.filter_by(is_active=True)
    if search:
        query = query.filter(db.or_(
            Student.student_name.like(f'%{search}%'), Student.student_uid.like(f'%{search}%'),
            Student.mother_name.like(f'%{search}%'), Student.father_name.like(f'%{search}%'),
            Student.mother_phone.like(f'%{search}%'), Student.father_phone.like(f'%{search}%')
        ))

    if start_date:
        try:
            sd = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Student.created_at >= sd)
        except ValueError: pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(Student.created_at < ed)
        except ValueError: pass

    students = query.order_by(Student.student_name).all()
    results = []

    for s in students:
        enrollment_query = StudentEnrollment.query.filter_by(student_id=s.student_id)
        if academic_year_id:
            enrollment_query = enrollment_query.filter_by(academic_year_id=academic_year_id)
        enrollment = enrollment_query.order_by(StudentEnrollment.enrollment_id.desc()).first()
        if academic_year_id and not enrollment:
            continue
        effective_library_access = enrollment.library_access if enrollment else bool(s.library_access)
        if library_access_filter is not None and library_access_filter != '':
            requested_access = library_access_filter.lower() in ('true', 'yes', '1')
            if effective_library_access != requested_access:
                continue
        student_level = enrollment.programme.display_name if enrollment and enrollment.programme else 'Unassigned'
        grade = enrollment.grade if enrollment else ''
        
        # Level filter check
        if level_filter and level_filter != 'ALL':
            if level_filter.lower() not in (student_level or '').lower() and level_filter.lower() not in (grade or '').lower():
                continue

        sub_query = StudentSubscription.query.filter_by(student_id=s.student_id)
        if academic_year_id:
            sub_query = sub_query.filter_by(academic_year_id=academic_year_id)
        active_sub_model = sub_query.filter_by(status='ACTIVE').first()
        active_sub = active_sub_model.to_dict() if active_sub_model else None
        sub_status = 'NOT_SUBSCRIBED'
        start_dt = '-'
        end_dt = '-'

        if active_sub:
            sub_status = 'ACTIVE'
            start_dt = active_sub.get('start_date', '-')
            end_dt = active_sub.get('end_date', '-')
        else:
            last_sub = sub_query.order_by(StudentSubscription.end_date.desc()).first()
            if last_sub:
                sub_status = 'EXPIRED'
                start_dt = last_sub.start_date.strftime('%Y-%m-%d') if last_sub.start_date else '-'
                end_dt = last_sub.end_date.strftime('%Y-%m-%d') if last_sub.end_date else '-'

        # Subscription status filter check
        if sub_status_filter and sub_status_filter != 'ALL' and sub_status != sub_status_filter:
            continue

        dep_ref = s.deposit_account_ref
        dep_acc = dep_ref[0] if dep_ref and isinstance(dep_ref, list) else dep_ref
        dep_amount = float(dep_acc.current_balance) if dep_acc and hasattr(dep_acc, 'current_balance') else 0.0
        warning_thresh = SettingsService.get_float('low_deposit_threshold', 300)

        # A deposit is required only for a member with an active subscription
        # in the selected academic year. Non-subscribers must not be reported
        # as low-balance accounts merely because their balance is zero.
        has_active_subscription = active_sub_model is not None
        is_low = has_active_subscription and dep_amount < warning_thresh
        deposit_status = ('Low Balance Warning' if is_low else 'Healthy') if has_active_subscription else 'Not Applicable'

        # Deposit status filter check
        if deposit_status_filter and deposit_status_filter != 'ALL':
            if deposit_status_filter == 'LOW_BALANCE' and not is_low:
                continue
            if deposit_status_filter == 'HEALTHY' and (is_low or not has_active_subscription):
                continue

        results.append({
            'student_id': s.student_uid,
            'student_name': s.student_name,
            'date_of_birth': s.date_of_birth.strftime('%Y-%m-%d') if s.date_of_birth else '-',
            'gender': s.gender or '-', 'school': s.school_name or '-',
            'mother_name': s.mother_name or '-', 'mother_phone': s.mother_phone or '-',
            'father_name': s.father_name or '-', 'father_phone': s.father_phone or '-',
            'academic_year': enrollment.academic_year.year_code if enrollment and enrollment.academic_year else '-',
            'programme': student_level, 'grade': grade or '-',
            'roll_number': enrollment.roll_number if enrollment else '-',
            'library_access': 'Yes' if effective_library_access else 'No',
            'subscription_status': 'Active' if sub_status == 'ACTIVE' else ('Expired' if sub_status == 'EXPIRED' else 'Not Subscribed'),
            'subscription_plan': (active_sub.get('plan') or {}).get('plan_name', '-') if active_sub else (last_sub.plan_ref.plan_name if not active_sub and last_sub and last_sub.plan_ref else '-'),
            'subscription_start_date': start_dt,
            'subscription_end_date': end_dt,
            'subscription_amount': float(active_sub_model.amount_paid or 0) if active_sub_model else (float(last_sub.amount_paid or 0) if not active_sub and last_sub else 0),
            'deposit_amount': dep_amount,
            'outstanding_amount': float(getattr(dep_acc, 'outstanding_balance', 0) or 0) if dep_acc else 0,
            'deposit_status': deposit_status
        })

    return jsonify({
        'total_students': len(results),
        'library_access_enabled': sum(1 for r in results if r['library_access'] == 'Yes'),
        'active_subscriptions': sum(1 for r in results if r['subscription_status'] == 'Active'),
        'low_deposits': sum(1 for r in results if r['deposit_status'] == 'Low Balance Warning'),
        'students_list': results
    }), 200


@reports_bp.route('/subscription-payments', methods=['GET'])
@jwt_required()
@permission_required('report.financial')
def subscription_payment_report():
    """Subscription plan payment register, optionally scoped by academic year."""
    academic_year_id = request.args.get('academic_year_id', type=int)
    query = StudentSubscription.query
    if academic_year_id:
        query = query.filter(StudentSubscription.academic_year_id == academic_year_id)
    subscriptions = query.order_by(StudentSubscription.payment_date.desc(), StudentSubscription.subscription_id.desc()).all()

    rows = [{
        'subscription_id': subscription.subscription_id,
        'student_id': subscription.student_ref.student_uid if subscription.student_ref else None,
        'student_name': subscription.student_ref.student_name if subscription.student_ref else None,
        'academic_year': subscription.academic_year_ref.year_code if subscription.academic_year_ref else '-',
        'plan_name': subscription.plan_ref.plan_name if subscription.plan_ref else None,
        'plan_price': float(subscription.plan_ref.price or 0) if subscription.plan_ref else 0.0,
        'amount_paid': float(subscription.amount_paid or 0),
        'payment_date': subscription.payment_date.strftime('%Y-%m-%d') if subscription.payment_date else None,
        'payment_method': subscription.payment_method or '-',
        'start_date': subscription.start_date.strftime('%Y-%m-%d') if subscription.start_date else None,
        'end_date': subscription.end_date.strftime('%Y-%m-%d') if subscription.end_date else None,
        'status': subscription.status,
        'notes': subscription.notes or '-'
    } for subscription in subscriptions]

    return jsonify({
        'total_payments': len(rows),
        'total_amount_paid': sum(row['amount_paid'] for row in rows),
        'active_subscriptions': sum(1 for row in rows if row['status'] == 'ACTIVE'),
        'pending_subscriptions': sum(1 for row in rows if row['status'] == 'PENDING'),
        'subscription_payments': rows
    }), 200


@reports_bp.route('/books-detailed', methods=['GET'])
@jwt_required()
@permission_required('report.stock')
def books_detailed_report():
    """Get detailed books report with filters for Level, Category, Author, Availability, Status, and Date Range"""
    from app.models.book import BookLevel, BookCategory
    
    level_filter = (request.args.get('level') or '').strip()
    category_filter = (request.args.get('category') or '').strip()
    author_filter = (request.args.get('author') or '').strip()
    availability_filter = request.args.get('availability')
    book_status_filter = request.args.get('book_status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # Match the Books page: only titles with at least one physical copy.
    query = BookTitle.query.filter(BookTitle.copies.any())

    if category_filter and category_filter != 'ALL':
        query = query.join(BookCategory, BookTitle.category_id == BookCategory.category_id).filter(
            db.or_(BookCategory.category_name.like(f'%{category_filter}%'), BookCategory.category_code.like(f'%{category_filter}%'))
        )
    if author_filter:
        query = query.filter(BookTitle.author.like(f'%{author_filter}%'))
    if start_date:
        try:
            sd = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(BookTitle.created_at >= sd)
        except ValueError: pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(BookTitle.created_at < ed)
        except ValueError: pass

    book_titles = query.order_by(BookTitle.title).all()
    results = []
    copy_results = []

    for b in book_titles:
        level_name = b.level_ref.level_name if b.level_ref else (b.level_ref.level_code if b.level_ref else 'General')
        cat_name = b.category_ref.category_name if b.category_ref else 'Uncategorized'

        # Level filter check
        if level_filter and level_filter != 'ALL':
            if level_filter.lower() not in level_name.lower():
                continue

        copies = b.copies.order_by(BookCopy.barcode.asc(), BookCopy.copy_number.asc()).all()
        total_copies = len(copies)
        avail_copies = sum(1 for copy in copies if copy.status == 'AVAILABLE')
        issued_copies = sum(1 for copy in copies if copy.status == 'ISSUED')
        damaged_copies = sum(1 for copy in copies if copy.status == 'DAMAGED')
        lost_copies = sum(1 for copy in copies if copy.status == 'LOST')
        first_copy = copies[0] if copies else None

        if total_copies == 0:
            status_str = 'Out of Stock'
        elif avail_copies > 0:
            status_str = 'Available'
        else:
            status_str = 'All Issued'

        # Availability filter check
        if availability_filter and availability_filter != 'ALL':
            if availability_filter == 'AVAILABLE' and avail_copies == 0:
                continue
            if availability_filter == 'ISSUED' and issued_copies == 0:
                continue

        # Status filter check
        if book_status_filter and book_status_filter != 'ALL' and status_str != book_status_filter:
            continue

        results.append({
            # Use the real level-based copy ID shown in Books (for example 100001),
            # instead of inventing a title ID such as BK-0001.
            'book_id': first_copy.barcode if first_copy and first_copy.barcode else '-',
            'isbn': b.isbn or 'N/A',
            'book_title': b.title,
            'author': b.author,
            'category': cat_name,
            'level': level_name,
            'mrp': float(b.mrp) if b.mrp is not None else None,
            'publisher': b.publisher or '-',
            'publication_year': b.publication_year or '-',
            'purchase_years': ', '.join(str(year) for year in sorted({copy.purchase_year for copy in copies if copy.purchase_year})) or '-',
            'copy_ids': ', '.join(copy.barcode for copy in copies if copy.barcode) or '-',
            'total_quantity': total_copies,
            'available_quantity': avail_copies,
            'issued_quantity': issued_copies,
            'damaged_quantity': damaged_copies,
            'lost_quantity': lost_copies,
            'book_status': status_str
        })
        copy_results.extend({
            'book_id': copy.barcode or '-',
            'book_title': b.title,
            'copy_number': copy.copy_number,
            'accession_number': copy.accession_number or '-',
            'purchase_year': copy.purchase_year or '-',
            'purchase_price': float(copy.purchase_price) if copy.purchase_price is not None else None,
            'condition': copy.condition,
            'status': copy.status,
            'location': copy.location or '-',
            'notes': copy.notes or '-'
        } for copy in copies)

    return jsonify({
        'total_titles': len(results),
        'total_copies': sum(int(r['total_quantity']) for r in results),
        'available_copies': sum(int(r['available_quantity']) for r in results),
        'issued_copies': sum(int(r['issued_quantity']) for r in results),
        'damaged_copies': sum(int(r['damaged_quantity']) for r in results),
        'lost_copies': sum(int(r['lost_quantity']) for r in results),
        'books_list': results,
        'physical_copy_register': copy_results
    }), 200


@reports_bp.route('/ebooks-detailed', methods=['GET'])
@jwt_required()
@permission_required('report.stock')
def ebooks_detailed_report():
    """Information-only e-book register, kept separate from physical stock."""
    search = (request.args.get('search') or '').strip()
    query = BookTitle.query.filter(BookTitle.ebook_count > 0)
    if search:
        term = f'%{search}%'
        query = query.filter(db.or_(
            BookTitle.title.like(term), BookTitle.author.like(term),
            BookTitle.isbn.like(term), BookTitle.publisher.like(term)
        ))
    ebooks = query.order_by(BookTitle.title).all()
    rows = [{
        'record_id': f'EB-{book.book_title_id:04d}',
        'book_title': book.title,
        'author': book.author,
        'isbn': book.isbn or '-',
        'publisher': book.publisher or '-',
        'publication_year': book.publication_year or '-',
        'record_count': int(book.ebook_count or 0),
        'description': book.description or '-'
    } for book in ebooks]
    return jsonify({
        'total_titles': len(rows),
        'total_records': sum(row['record_count'] for row in rows),
        'ebooks_list': rows
    }), 200
