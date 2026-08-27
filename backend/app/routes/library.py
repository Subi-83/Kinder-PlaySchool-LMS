from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.book import BookCopy
from app.models.student import Student
from app.models.library import BookIssue, BookReturn, DamageLossRecord
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.audit import AuditLog
from app.models.settings import Holiday
from app.middleware.auth_middleware import permission_required, get_current_user
from app.services.settings_service import SettingsService
from datetime import datetime, timedelta

library_bp = Blueprint('library', __name__, url_prefix='/api/library')

def count_holidays_during_overdue_period(due_date, return_date):
    """Return the non-chargeable holiday dates after the due date."""
    if not SettingsService.get_bool('holiday_adjustment', True) or not due_date or not return_date or return_date <= due_date:
        return 0

    holidays = Holiday.query.all()
    excluded_days = 0
    current_date = due_date + timedelta(days=1)
    while current_date <= return_date:
        if any(
            holiday.holiday_date == current_date or
            (holiday.is_recurring and holiday.holiday_date.month == current_date.month
             and holiday.holiday_date.day == current_date.day)
            for holiday in holidays
        ):
            excluded_days += 1
        current_date += timedelta(days=1)
    return excluded_days

def is_configured_holiday(date_value, holidays):
    return any(
        holiday.holiday_date == date_value or
        (holiday.is_recurring and holiday.holiday_date.month == date_value.month
         and holiday.holiday_date.day == date_value.day)
        for holiday in holidays
    )

def adjust_due_date_for_holidays(due_date):
    """Move a due date forward until it lands on a working day."""
    if not SettingsService.get_bool('holiday_adjustment', True):
        return due_date
    holidays = Holiday.query.all()
    adjusted = due_date
    while is_configured_holiday(adjusted, holidays):
        adjusted += timedelta(days=1)
    return adjusted

@library_bp.route('/calendar-info', methods=['GET'])
@jwt_required()
@permission_required('book.issue')
def get_library_calendar_info():
    """Holiday and charge settings required by the lending screen."""
    return jsonify({
        'holidays': [holiday.to_dict() for holiday in Holiday.query.order_by(Holiday.holiday_date).all()],
        'holiday_adjustment': SettingsService.get_bool('holiday_adjustment', True),
        'issue_period_days': SettingsService.get_int('issue_period_days', 14),
        'late_fine_per_day': SettingsService.get_float('late_fine_per_day', 5),
        'damage_small': SettingsService.get_float('damage_small', 100),
        'damage_large': SettingsService.get_float('damage_large', 200),
        'damage_lost': SettingsService.get_float('damage_lost', 300),
        'damage_default': SettingsService.get_float('damage_default', 100),
    }), 200

@library_bp.route('/issues', methods=['GET'])
@jwt_required()
@permission_required('book.issue')
def get_issues():
    """Get all book issues"""
    status = request.args.get('status')
    query = BookIssue.query
    
    if status:
        query = query.filter_by(status=status)
    
    issues = query.order_by(BookIssue.issue_date.desc()).limit(100).all()
    return jsonify([i.to_dict() for i in issues]), 200

@library_bp.route('/issues/active', methods=['GET'])
@jwt_required()
@permission_required('book.issue')
def get_active_issues():
    """Get all active issues"""
    issues = BookIssue.query.filter(
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).order_by(BookIssue.due_date).all()
    return jsonify([i.to_dict() for i in issues]), 200

@library_bp.route('/issues/student/<int:student_id>', methods=['GET'])
@jwt_required()
@permission_required('book.issue')
def get_student_issues(student_id):
    """Get issues for a specific student"""
    issues = BookIssue.query.filter_by(
        student_id=student_id
    ).order_by(BookIssue.issue_date.desc()).all()
    return jsonify([i.to_dict() for i in issues]), 200

@library_bp.route('/issues', methods=['POST'])
@jwt_required()
@permission_required('book.issue')
def issue_book():
    """Issue a book to a student"""
    data = request.get_json() or {}
    
    book_copy_id = data.get('book_copy_id')
    student_id = data.get('student_id')
    
    if not book_copy_id or not student_id:
        return jsonify({'error': 'Book copy and student required'}), 400
    
    # Check if book copy is available
    copy = BookCopy.query.get(book_copy_id)
    if not copy:
        return jsonify({'error': 'Book copy not found'}), 404
    
    if copy.status != 'AVAILABLE':
        return jsonify({'error': f'Book is not available (status: {copy.status})'}), 400
    
    # Check if student exists
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    if not getattr(student, 'library_access', True):
        return jsonify({'error': 'Student does not have library access enabled.'}), 400
    
    # Check if student has active subscription
    from app.models.subscription import StudentSubscription
    subscription = StudentSubscription.query.filter_by(
        student_id=student_id,
        status='ACTIVE'
    ).first()
    
    if not subscription or subscription.is_expired():
        return jsonify({'error': 'Student library subscription is inactive or expired.'}), 400
    
    # Check if student has reached book limit
    current_issues = BookIssue.query.filter(
        BookIssue.student_id == student_id,
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).count()
    
    plan = subscription.plan_ref
    if not plan:
        return jsonify({'error': 'The student subscription does not have a valid plan'}), 400
    if current_issues >= plan.max_books:
        return jsonify({'error': f'This student has reached the maximum borrowing limit ({plan.max_books}) for the current subscription plan.'}), 400
    
    # Students at or below the low-deposit threshold must top up unless an
    # administrator gives an explicit, auditable, one-time approval.
    deposit_account = DepositAccount.query.filter_by(student_id=student_id).first()
    low_deposit_threshold = SettingsService.get_float('low_deposit_threshold', 300)
    deposit_balance = float(deposit_account.current_balance or 0) if deposit_account else 0.0
    book_mrp = float(copy.title_ref.mrp or 0) if copy.title_ref else 0.0
    admin_override = bool(data.get('admin_approved_low_deposit', False))
    current_user = get_current_user()
    if deposit_balance <= low_deposit_threshold:
        if not admin_override:
            return jsonify({'error': f'Deposit is ₹{deposit_balance:.2f}, which is at or below the ₹{low_deposit_threshold:.2f} borrowing limit. Ask an administrator for approval or top up the deposit.'}), 400
        if not current_user or current_user.role != 'ADMIN':
            return jsonify({'error': 'Only an administrator can approve borrowing with a low deposit.'}), 403
    if book_mrp > 0 and deposit_balance < book_mrp:
        return jsonify({'error': f'Book MRP is ₹{book_mrp:.2f}. The student deposit must be at least the MRP; current balance is ₹{deposit_balance:.2f}.'}), 400
    
    # Get issue period from settings
    issue_days = SettingsService.get_int('issue_period_days', 14)
    
    issue_date_str = data.get('issue_date')
    if issue_date_str:
        try:
            issue_date = datetime.strptime(issue_date_str, '%Y-%m-%d').date()
        except ValueError:
            issue_date = datetime.now().date()
    else:
        issue_date = datetime.now().date()

    # Create issue record
    issue = BookIssue(
        book_copy_id=book_copy_id,
        student_id=student_id,
        issue_date=issue_date,
        issue_time=datetime.now().time(),
        due_date=adjust_due_date_for_holidays(issue_date + timedelta(days=issue_days)),
        issued_by=current_user.user_id,
        status='ACTIVE'
    )
    
    db.session.add(issue)
    copy.status = 'ISSUED'
    db.session.commit()
    
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='ISSUE_BOOK',
        module='Library',
        record_id=str(issue.issue_id),
        details=f'Issued book copy {book_copy_id} to student {student_id}' + (' with administrator approval for low deposit' if admin_override else '')
    )
    
    return jsonify(issue.to_dict()), 201

@library_bp.route('/returns', methods=['POST'])
@jwt_required()
@permission_required('book.return')
def return_book():
    """Return a book"""
    data = request.get_json() or {}
    
    issue_id = data.get('issue_id')
    condition_returned = str(data.get('condition', 'GOOD')).upper()
    is_damaged = data.get('is_damaged', False) or condition_returned in ['SMALL_DAMAGED', 'LARGE_DAMAGED', 'DAMAGED', 'POOR']
    is_lost = data.get('is_lost', False) or condition_returned == 'LOST'
    notes = data.get('notes')
    
    if not issue_id:
        return jsonify({'error': 'Issue ID required'}), 400
    
    issue = BookIssue.query.get(issue_id)
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    if issue.status == 'RETURNED':
        return jsonify({'error': 'Book already returned'}), 400
    
    return_date_str = data.get('return_date')
    if return_date_str:
        try:
            return_date = datetime.strptime(return_date_str, '%Y-%m-%d').date()
        except ValueError:
            return_date = datetime.now().date()
    else:
        return_date = datetime.now().date()

    # Calculate fine & holidays
    holiday_days = int(data.get('holiday_days', 0))
    if holiday_days <= 0:
        holiday_days = count_holidays_during_overdue_period(issue.due_date, return_date)
        
    calendar_days_overdue = max((return_date - issue.due_date).days, 0)
    effective_late_days = max(calendar_days_overdue - holiday_days, 0)
    late_fine_per_day = SettingsService.get_float('late_fine_per_day', 5)
    calculated_fine = effective_late_days * late_fine_per_day
    fine_amount = float(data.get('fine_amount', calculated_fine))
    
    # Calculate damage charge
    damage_charge = float(data.get('damage_charge', 0))
    if damage_charge == 0:
        if is_lost:
            lost_charge_mode = str(data.get('lost_charge_mode', 'MRP')).upper()
            book_mrp = float(issue.copy_ref.title_ref.mrp or 0) if issue.copy_ref and issue.copy_ref.title_ref else 0.0
            if lost_charge_mode == 'CUSTOM':
                try:
                    damage_charge = float(data.get('lost_amount'))
                except (TypeError, ValueError):
                    return jsonify({'error': 'Enter a valid custom lost-book amount.'}), 400
                if damage_charge < 0:
                    return jsonify({'error': 'Lost-book amount cannot be negative.'}), 400
            else:
                damage_charge = book_mrp if book_mrp > 0 else SettingsService.get_float('damage_lost', 300)
        elif condition_returned in ['SMALL', 'SMALL_DAMAGED']:
            damage_charge = SettingsService.get_float('damage_small', 100)
        elif condition_returned in ['LARGE', 'LARGE_DAMAGED']:
            damage_charge = SettingsService.get_float('damage_large', 200)
        elif is_damaged:
            damage_charge = SettingsService.get_float('damage_default', 100)

    fine_amount = round(max(fine_amount, 0), 2)
    damage_charge = round(max(damage_charge, 0), 2)
    total_charge = round(fine_amount + damage_charge, 2)
    amount_deducted = 0.0
    outstanding_payable = 0.0

    if total_charge > 0:
        deposit_account = DepositAccount.query.filter_by(student_id=issue.student_id).first()
        if deposit_account:
            cur_bal = round(float(deposit_account.current_balance or 0.0), 2)
            if cur_bal >= total_charge:
                amount_deducted = total_charge
                outstanding_payable = 0.0
                deposit_account.current_balance = round(cur_bal - total_charge, 2)
            else:
                amount_deducted = cur_bal
                outstanding_payable = round(total_charge - cur_bal, 2)
                deposit_account.current_balance = 0.0
                deposit_account.outstanding_balance = float(getattr(deposit_account, 'outstanding_balance', 0) or 0) + outstanding_payable

            if amount_deducted > 0:
                transaction = DepositTransaction(
                    deposit_account_id=deposit_account.deposit_account_id,
                    transaction_type='LOST_BOOK' if is_lost else ('DAMAGE_CHARGE' if damage_charge > 0 else 'FINE'),
                    amount=-amount_deducted,
                    balance_after=deposit_account.current_balance,
                    reference_id=str(issue_id),
                    description=f"Return #{issue_id}: Fine ₹{fine_amount:.2f}, Damage ₹{damage_charge:.2f}. Deducted ₹{amount_deducted:.2f}" + (f" (Unpaid Outstanding: ₹{outstanding_payable:.2f})" if outstanding_payable > 0 else ""),
                    created_by=get_current_user().user_id
                )
                db.session.add(transaction)
    
    # Create return record
    book_return = BookReturn(
        issue_id=issue_id,
        return_date=return_date,
        return_time=datetime.now().time(),
        received_by=get_current_user().user_id,
        condition_returned=condition_returned if condition_returned in ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] else 'GOOD',
        is_damaged=is_damaged,
        is_lost=is_lost,
        fine_amount=fine_amount,
        damage_charge=damage_charge,
        notes=notes
    )
    
    db.session.add(book_return)
    
    # Update issue status
    issue.status = 'LOST' if is_lost else 'RETURNED'
    
    # Update book copy
    copy = BookCopy.query.get(issue.book_copy_id)
    if copy:
        if is_lost:
            copy.status = 'LOST'
        elif is_damaged:
            copy.condition = condition_returned if condition_returned in ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] else 'DAMAGED'
            copy.status = 'DAMAGED'
        else:
            copy.status = 'AVAILABLE'
            copy.condition = condition_returned if condition_returned in ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] else 'GOOD'
    
    db.session.commit()
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='RETURN_BOOK',
        module='Library',
        record_id=str(issue_id),
        details=f'Returned book, fine: {fine_amount}, damage: {damage_charge}, deducted: {amount_deducted}, outstanding: {outstanding_payable}'
    )
    
    res = book_return.to_dict()
    res['amount_deducted'] = amount_deducted
    res['outstanding_payable'] = outstanding_payable
    return jsonify(res), 201

@library_bp.route('/damage-loss', methods=['POST'])
@jwt_required()
@permission_required('damage.create')
def record_damage_loss():
    """Record damage or loss of a book"""
    data = request.get_json()
    
    # Get damage charge from settings if not provided
    charge_amount = data.get('charge_amount')
    if not charge_amount:
        severity = data.get('severity', 'DEFAULT')
        if severity == 'SMALL':
            charge_amount = SettingsService.get_float('damage_small', 100)
        elif severity == 'LARGE':
            charge_amount = SettingsService.get_float('damage_large', 200)
        else:
            charge_amount = SettingsService.get_float('damage_default', 300)
    
    record = DamageLossRecord(
        book_copy_id=data.get('book_copy_id'),
        student_id=data.get('student_id'),
        issue_id=data.get('issue_id'),
        record_type=data.get('record_type'),
        severity=data.get('severity', 'DEFAULT'),
        charge_amount=charge_amount,
        description=data.get('description'),
        recorded_by=get_current_user().user_id,
        status='PENDING'
    )
    
    db.session.add(record)
    db.session.commit()
    
    # Update book copy status
    copy = BookCopy.query.get(data.get('book_copy_id'))
    if copy:
        if data.get('record_type') == 'LOSS':
            copy.status = 'LOST'
        else:
            copy.condition = 'DAMAGED'
            copy.status = 'DAMAGED'
    
    # Create deposit transaction if charge should be applied
    if data.get('apply_charge', True):
        deposit_account = DepositAccount.query.filter_by(student_id=data.get('student_id')).first()
        if deposit_account:
            transaction = DepositTransaction(
                deposit_account_id=deposit_account.deposit_account_id,
                transaction_type='DAMAGE_CHARGE' if data.get('record_type') == 'DAMAGE' else 'LOST_BOOK',
                amount=-charge_amount,
                balance_after=deposit_account.current_balance - charge_amount,
                reference_id=str(record.record_id),
                description=f'{data.get("record_type")} charge for book copy {data.get("book_copy_id")}',
                created_by=get_current_user().user_id
            )
            db.session.add(transaction)
            deposit_account.current_balance -= charge_amount
            record.status = 'CHARGED'
    
    db.session.commit()
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='RECORD_DAMAGE_LOSS',
        module='Library',
        record_id=str(record.record_id),
        details=f'Recorded {data.get("record_type")} for book copy {data.get("book_copy_id")}'
    )
    
    return jsonify(record.to_dict()), 201

@library_bp.route('/overdue', methods=['GET'])
@jwt_required()
@permission_required('book.return')
def get_overdue_books():
    """Get all overdue books"""
    today = datetime.now().date()
    overdue = BookIssue.query.filter(
        BookIssue.due_date < today,
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).all()
    
    return jsonify([i.to_dict() for i in overdue]), 200

@library_bp.route('/damage-loss', methods=['GET'])
@jwt_required()
@permission_required('damage.create')
def get_damage_loss_records():
    """Get all damage/loss records"""
    records = DamageLossRecord.query.order_by(DamageLossRecord.created_at.desc()).limit(100).all()
    return jsonify([r.to_dict() for r in records]), 200
