from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.book import BookCopy, BookTitle
from app.models.student import Student
from app.models.library import BookIssue, BookReturn
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.subscription import StudentSubscription
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
    """Get fine report"""
    total_fines = db.session.query(
        db.func.abs(db.func.sum(DepositTransaction.amount))
    ).filter_by(transaction_type='FINE').scalar() or 0
    
    # Fines from last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_fines = db.session.query(
        db.func.abs(db.func.sum(DepositTransaction.amount))
    ).filter(
        DepositTransaction.transaction_type == 'FINE',
        DepositTransaction.created_at >= thirty_days_ago
    ).scalar() or 0
    
    # Fines by month (last 6 months)
    monthly_fines = []
    for i in range(6):
        month_start = datetime.now().replace(day=1) - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=30)
        if i == 0:
            month_start = month_start.replace(day=1)
        
        amount = db.session.query(
            db.func.abs(db.func.sum(DepositTransaction.amount))
        ).filter(
            DepositTransaction.transaction_type == 'FINE',
            DepositTransaction.created_at >= month_start,
            DepositTransaction.created_at < month_end
        ).scalar() or 0
        
        monthly_fines.append({
            'month': month_start.strftime('%b %Y'),
            'amount': float(amount)
        })
    
    return jsonify({
        'total_fines': float(total_fines),
        'recent_fines_30days': float(recent_fines),
        'monthly_fines': monthly_fines
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
    
    return jsonify({
        'total_deposits': float(total_deposits),
        'total_fines': float(total_fines),
        'total_damages': float(total_damages),
        'total_lost_books': float(total_lost),
        'net_collection': float(total_fines + total_damages + total_lost),
        'total_balance': float(total_balance)
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
    
    return jsonify({
        'today_issues': today_issues,
        'today_returns': today_returns,
        'weekly_issues': weekly_issues,
        'weekly_returns': weekly_returns,
        'monthly_issues': monthly_issues,
        'monthly_returns': monthly_returns,
        'overdue': overdue,
        'active_issues': active_issues
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

    low_balance_accounts = DepositAccount.query.join(Student).filter(
        Student.library_access == True,
        Student.is_active == True,
        DepositAccount.current_balance <= DepositAccount.warning_threshold
    ).order_by(DepositAccount.current_balance.asc()).all()

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
                'warning_threshold': float(account.warning_threshold),
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

    query = Student.query.filter_by(is_active=True)

    if library_access_filter is not None and library_access_filter != '':
        if library_access_filter.lower() in ('true', 'yes', '1'):
            query = query.filter(Student.library_access == True)
        elif library_access_filter.lower() in ('false', 'no', '0'):
            query = query.filter(db.or_(Student.library_access == False, Student.library_access == None))

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
        curr_enc = s.get_current_enrollment_brief()
        student_level = curr_enc.get('programme') if curr_enc else 'Unassigned'
        grade = curr_enc.get('grade') if curr_enc else ''
        
        # Level filter check
        if level_filter and level_filter != 'ALL':
            if level_filter.lower() not in (student_level or '').lower() and level_filter.lower() not in (grade or '').lower():
                continue

        active_sub = s.get_active_subscription()
        sub_status = 'NOT_SUBSCRIBED'
        start_dt = '-'
        end_dt = '-'

        if active_sub:
            sub_status = 'ACTIVE'
            start_dt = active_sub.get('start_date', '-')
            end_dt = active_sub.get('end_date', '-')
        else:
            last_sub = StudentSubscription.query.filter_by(student_id=s.student_id).order_by(StudentSubscription.end_date.desc()).first()
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
        warning_thresh = float(dep_acc.warning_threshold) if dep_acc and hasattr(dep_acc, 'warning_threshold') else 100.0
        
        is_low = dep_amount < warning_thresh
        deposit_status = 'Low Balance Warning' if is_low else 'Healthy'

        # Deposit status filter check
        if deposit_status_filter and deposit_status_filter != 'ALL':
            if deposit_status_filter == 'LOW_BALANCE' and not is_low:
                continue
            if deposit_status_filter == 'HEALTHY' and is_low:
                continue

        results.append({
            'student_id': s.student_uid,
            'student_name': s.student_name,
            'level': student_level + (f" ({grade})" if grade else ""),
            'library_access': 'Yes' if s.library_access else 'No',
            'subscription_status': 'Active' if sub_status == 'ACTIVE' else ('Expired' if sub_status == 'EXPIRED' else 'Not Subscribed'),
            'subscription_start_date': start_dt,
            'subscription_end_date': end_dt,
            'deposit_amount': dep_amount,
            'deposit_status': deposit_status
        })

    return jsonify({
        'total_students': len(results),
        'library_access_enabled': sum(1 for r in results if r['library_access'] == 'Yes'),
        'active_subscriptions': sum(1 for r in results if r['subscription_status'] == 'Active'),
        'low_deposits': sum(1 for r in results if r['deposit_status'] == 'Low Balance Warning'),
        'students_list': results
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

    query = BookTitle.query

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

    for b in book_titles:
        level_name = b.level_ref.level_name if b.level_ref else (b.level_ref.level_code if b.level_ref else 'General')
        cat_name = b.category_ref.category_name if b.category_ref else 'Uncategorized'

        # Level filter check
        if level_filter and level_filter != 'ALL':
            if level_filter.lower() not in level_name.lower():
                continue

        total_copies = b.copies.count()
        avail_copies = b.copies.filter_by(status='AVAILABLE').count()
        issued_copies = b.copies.filter_by(status='ISSUED').count()
        damaged_copies = b.copies.filter_by(status='DAMAGED').count()
        lost_copies = b.copies.filter_by(status='LOST').count()

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
            'book_id': f"BK-{b.book_title_id:04d}",
            'isbn': b.isbn or 'N/A',
            'book_title': b.title,
            'author': b.author,
            'category': cat_name,
            'level': level_name,
            'total_quantity': total_copies,
            'available_quantity': avail_copies,
            'issued_quantity': issued_copies,
            'book_status': status_str
        })

    return jsonify({
        'total_titles': len(results),
        'total_copies': sum(int(r['total_quantity']) for r in results),
        'available_copies': sum(int(r['available_quantity']) for r in results),
        'issued_copies': sum(int(r['issued_quantity']) for r in results),
        'books_list': results
    }), 200
