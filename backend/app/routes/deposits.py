from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.student import Student
from app.models.academic import AcademicYear, StudentEnrollment
from app.models.subscription import StudentSubscription
from app.models.library import BookIssue
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, get_current_user
from app.services.settings_service import SettingsService
import json

deposits_bp = Blueprint('deposits', __name__, url_prefix='/api/deposits')

def _refund_due_accounts(academic_year):
    """Balances from earlier-year members who were not re-enrolled in this year."""
    if not academic_year:
        return []
    continuing_library_members = db.session.query(StudentEnrollment.student_id).filter(
        StudentEnrollment.academic_year_id == academic_year.academic_year_id,
        StudentEnrollment.library_access == True
    )
    earlier_library_members = db.session.query(StudentEnrollment.student_id).join(AcademicYear).filter(
        AcademicYear.start_date < academic_year.start_date,
        StudentEnrollment.library_access == True
    )
    return DepositAccount.query.join(Student).filter(
        Student.is_active == True,
        DepositAccount.current_balance > 0,
        DepositAccount.student_id.in_(earlier_library_members),
        ~DepositAccount.student_id.in_(continuing_library_members)
    ).order_by(Student.student_name).all()

@deposits_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_deposits():
    """Get this year's deposit accounts, including balances carried by re-enrolment."""
    year_id = request.args.get('academic_year_id', type=int)
    academic_year = AcademicYear.query.get(year_id) if year_id else AcademicYear.get_current()
    if not academic_year:
        return jsonify([]), 200
    # Auto-create deposit accounts for any active students with library access who don't have one yet
    library_students = Student.query.join(StudentEnrollment).join(StudentSubscription, StudentSubscription.student_id == Student.student_id).filter(
        Student.is_active == True,
        StudentEnrollment.academic_year_id == academic_year.academic_year_id,
        StudentEnrollment.library_access == True,
        StudentSubscription.academic_year_id == academic_year.academic_year_id,
        StudentSubscription.status.in_(['ACTIVE', 'PENDING'])
    ).distinct().all()
    for s in library_students:
        if not DepositAccount.query.filter_by(student_id=s.student_id).first():
            db.session.add(DepositAccount(student_id=s.student_id))
    db.session.commit()

    subscribed_student_ids = db.session.query(StudentSubscription.student_id).filter(
        StudentSubscription.academic_year_id == academic_year.academic_year_id,
        StudentSubscription.status.in_(['ACTIVE', 'PENDING'])
    )
    accounts = DepositAccount.query.join(Student).join(StudentEnrollment).filter(
        StudentEnrollment.academic_year_id == academic_year.academic_year_id,
        StudentEnrollment.library_access == True,
        db.or_(DepositAccount.current_balance > 0, DepositAccount.student_id.in_(subscribed_student_ids)),
        Student.is_active == True
    ).distinct().order_by(Student.student_name).all()

    result = []
    threshold = SettingsService.get_float('low_deposit_threshold', 300)
    for account in accounts:
        item = account.to_dict()
        year_subscription = StudentSubscription.query.filter_by(
            student_id=account.student_id,
            academic_year_id=academic_year.academic_year_id
        ).order_by(StudentSubscription.subscription_id.desc()).first()
        prior_enrollment = StudentEnrollment.query.join(AcademicYear).filter(
            StudentEnrollment.student_id == account.student_id,
            AcademicYear.start_date < academic_year.start_date
        ).first()
        item['subscription_status'] = year_subscription.status if year_subscription else 'NOT_SUBSCRIBED'
        item['active_subscription'] = year_subscription.to_dict() if year_subscription else None
        item['deposit_forwarded'] = bool(prior_enrollment and float(account.current_balance or 0) > 0)
        item['is_low_balance'] = bool(
            year_subscription and year_subscription.status == 'ACTIVE'
            and float(account.current_balance or 0) <= threshold
        )
        result.append(item)
    return jsonify(result), 200

@deposits_bp.route('/refund-due', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_refund_due_accounts():
    """List earlier-year balances that should be returned unless the member re-enrols."""
    year_id = request.args.get('academic_year_id', type=int)
    academic_year = AcademicYear.query.get(year_id) if year_id else AcademicYear.get_current()
    if not academic_year:
        return jsonify([]), 200

    result = []
    for account in _refund_due_accounts(academic_year):
        item = account.to_dict()
        previous = StudentEnrollment.query.join(AcademicYear).filter(
            StudentEnrollment.student_id == account.student_id,
            AcademicYear.start_date < academic_year.start_date
        ).order_by(AcademicYear.start_date.desc()).first()
        item['previous_academic_year'] = previous.academic_year.year_code if previous and previous.academic_year else None
        item['refund_for_academic_year'] = academic_year.year_code
        result.append(item)
    return jsonify(result), 200

@deposits_bp.route('/refund/<int:student_id>', methods=['POST'])
@jwt_required()
@permission_required('deposit.refund')
def refund_deposit(student_id):
    """Return the complete balance when next-year library subscription is declined."""
    data = request.get_json() or {}
    year_id = data.get('academic_year_id')
    academic_year = AcademicYear.query.get(year_id) if year_id else AcademicYear.get_current()
    if not academic_year:
        return jsonify({'error': 'Select a valid academic year.'}), 400

    continuing = StudentEnrollment.query.filter_by(
        student_id=student_id,
        academic_year_id=academic_year.academic_year_id,
        library_access=True
    ).first()
    if continuing:
        return jsonify({'error': 'Deposit cannot be refunded because Library Subscription is Yes for this academic year.'}), 400
    if BookIssue.query.filter(
        BookIssue.student_id == student_id,
        BookIssue.status.in_(['ACTIVE', 'OVERDUE'])
    ).count() > 0:
        return jsonify({'error': 'Return all issued books before refunding the deposit.'}), 400

    account = DepositAccount.query.filter_by(student_id=student_id).first()
    if not account or float(account.current_balance or 0) <= 0:
        return jsonify({'error': 'No deposit balance is available to refund.'}), 400

    amount = float(account.current_balance)
    current_user = get_current_user()
    transaction = DepositTransaction(
        deposit_account_id=account.deposit_account_id,
        transaction_type='REFUND',
        amount=-amount,
        balance_after=0,
        description=f'Deposit returned because Library Subscription is No for {academic_year.year_code}',
        created_by=current_user.user_id if current_user else None
    )
    account.current_balance = 0
    account.last_transaction_date = db.func.now()
    db.session.add(transaction)
    db.session.commit()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'SYSTEM',
        action='DEPOSIT_REFUND', module='Deposit', record_id=str(student_id),
        details=f'Refunded ₹{amount:.2f} for {academic_year.year_code}'
    )
    return jsonify({'message': f'Deposit of ₹{amount:.2f} refunded successfully.', 'transaction': transaction.to_dict()}), 200

@deposits_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_student_deposit(student_id):
    """Get deposit account for a specific student"""
    account = DepositAccount.query.filter_by(student_id=student_id).first()
    if not account:
        return jsonify({'error': 'Deposit account not found'}), 404
    return jsonify(account.to_dict()), 200

@deposits_bp.route('/topup', methods=['POST'])
@jwt_required()
@permission_required('deposit.topup')
def topup_deposit():
    """Add funds to a student's deposit account, clearing outstanding unpaid charges first."""
    data = request.get_json() or {}
    
    student_id = data.get('student_id')
    amount = float(data.get('amount', 0))
    description = data.get('description', 'Top-up deposit')
    
    if not student_id or amount <= 0:
        return jsonify({'error': 'Valid student ID and amount required'}), 400

    student = Student.query.get(student_id)
    if not student or not student.is_active:
        return jsonify({'error': 'Student record not found or student is inactive.'}), 400

    # Deposits are available only to students whose Library Access is enabled.
    academic_year_id = data.get('academic_year_id')
    academic_year = AcademicYear.query.get(academic_year_id) if academic_year_id else AcademicYear.get_current()
    has_year_access = academic_year and StudentEnrollment.query.filter_by(student_id=student.student_id, academic_year_id=academic_year.academic_year_id, library_access=True).first()
    if not has_year_access:
        return jsonify({'error': 'Student does not have Library Access enabled. Enable Library Access before recording a deposit.'}), 400
    active_subscription = StudentSubscription.query.filter_by(
        student_id=student.student_id,
        academic_year_id=academic_year.academic_year_id,
        status='ACTIVE'
    ).first()
    if not active_subscription:
        return jsonify({'error': 'An active subscription is required before recording a deposit.'}), 400

    deposit_account = DepositAccount.query.filter_by(student_id=student_id).first()
    if not deposit_account:
        deposit_account = DepositAccount(student_id=student_id)
        db.session.add(deposit_account)
        db.session.flush()
    
    outstanding = float(deposit_account.outstanding_balance or 0.0)
    paid_towards_outstanding = 0.0
    added_to_balance = amount
    
    if outstanding > 0:
        if amount >= outstanding:
            paid_towards_outstanding = outstanding
            added_to_balance = amount - outstanding
            deposit_account.outstanding_balance = 0.0
        else:
            paid_towards_outstanding = amount
            added_to_balance = 0.0
            deposit_account.outstanding_balance = outstanding - amount

    deposit_account.current_balance = float(deposit_account.current_balance or 0.0) + added_to_balance
    deposit_account.last_transaction_date = db.func.now()

    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'SYSTEM'

    transaction = DepositTransaction(
        deposit_account_id=deposit_account.deposit_account_id,
        transaction_type='TOP_UP',
        amount=amount,
        balance_after=deposit_account.current_balance,
        description=description + (f" (Cleared ₹{paid_towards_outstanding:.2f} outstanding fine)" if paid_towards_outstanding > 0 else ""),
        created_by=user_id
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='DEPOSIT_TOPUP',
        module='Deposit',
        record_id=str(student_id),
        details=f'Topped up ₹{amount} for student {student_id}. Cleared outstanding: ₹{paid_towards_outstanding}, Net balance addition: ₹{added_to_balance}'
    )
    
    res = transaction.to_dict()
    res['account'] = deposit_account.to_dict()
    return jsonify(res), 201

@deposits_bp.route('/adjust', methods=['POST'])
@jwt_required()
@permission_required('deposit.adjust')
def adjust_deposit():
    """Manually adjust a student's deposit balance (Admin only)"""
    data = request.get_json()
    
    student_id = data.get('student_id')
    amount = data.get('amount', 0)
    description = data.get('description', 'Manual adjustment')
    
    if not student_id:
        return jsonify({'error': 'Student ID required'}), 400
    
    if amount == 0:
        return jsonify({'error': 'Amount must be non-zero'}), 400
    
    deposit_account = DepositAccount.query.filter_by(student_id=student_id).first()
    if not deposit_account:
        return jsonify({'error': 'Deposit account not found'}), 404
    
    if amount < 0 and deposit_account.current_balance < abs(amount):
        return jsonify({'error': 'Insufficient balance'}), 400
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'SYSTEM'

    transaction = DepositTransaction(
        deposit_account_id=deposit_account.deposit_account_id,
        transaction_type='ADJUSTMENT',
        amount=amount,
        balance_after=deposit_account.current_balance + amount,
        description=description,
        created_by=user_id
    )
    
    db.session.add(transaction)
    deposit_account.current_balance += amount
    deposit_account.last_transaction_date = db.func.now()
    db.session.commit()
    
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='DEPOSIT_ADJUSTMENT',
        module='Deposit',
        record_id=str(student_id),
        details=f'Adjusted deposit by {amount} for student {student_id}: {description}'
    )
    
    return jsonify(transaction.to_dict()), 201

@deposits_bp.route('/transactions/<int:student_id>', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_transactions(student_id):
    """Get transaction history for a student"""
    deposit_account = DepositAccount.query.filter_by(student_id=student_id).first()
    if not deposit_account:
        return jsonify({'error': 'Deposit account not found'}), 404
    
    transactions = DepositTransaction.query.filter_by(
        deposit_account_id=deposit_account.deposit_account_id
    ).order_by(DepositTransaction.created_at.desc()).limit(50).all()
    
    return jsonify([t.to_dict() for t in transactions]), 200

@deposits_bp.route('/correction-request', methods=['POST'])
@jwt_required()
@permission_required('deposit.topup')
def request_deposit_correction():
    """Request an auditable correction to a mistaken deposit transaction."""
    data = request.get_json() or {}
    transaction_id = data.get('transaction_id')
    reason = (data.get('reason') or '').strip()
    try:
        corrected_amount = float(data.get('corrected_amount'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Enter a valid corrected amount.'}), 400
    if corrected_amount < 0 or not reason:
        return jsonify({'error': 'Corrected amount and reason are required.'}), 400

    transaction = DepositTransaction.query.get(transaction_id)
    if not transaction or transaction.transaction_type not in ('INITIAL_DEPOSIT', 'TOP_UP'):
        return jsonify({'error': 'Deposit payment transaction not found.'}), 404
    existing = AuditLog.query.filter_by(action='DEPOSIT_CORRECTION_REQUEST', record_id=str(transaction_id)).first()
    if existing:
        return jsonify({'error': 'A correction for this transaction is already awaiting approval.'}), 409

    account = transaction.account_ref
    student = account.student if account else None
    current_user = get_current_user()
    payload = {
        'transaction_id': transaction.transaction_id,
        'student_id': account.student_id,
        'student_uid': student.student_uid if student else str(account.student_id),
        'student_name': student.student_name if student else 'JK Member',
        'original_amount': float(transaction.amount),
        'corrected_amount': corrected_amount,
        'reason': reason,
    }
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='DEPOSIT_CORRECTION_REQUEST', module='Deposit',
        record_id=transaction.transaction_id, details=json.dumps(payload)
    )
    return jsonify({'message': 'Deposit correction sent for administrator approval.'}), 201

@deposits_bp.route('/low-balance', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_low_balance_accounts():
    """Get low-balance accounts only for actively subscribed library members."""
    threshold = request.args.get('threshold', SettingsService.get_float('low_deposit_threshold', 300), type=float)
    
    year_id = request.args.get('academic_year_id', type=int)
    academic_year = AcademicYear.query.get(year_id) if year_id else AcademicYear.get_current()
    if not academic_year:
        return jsonify([]), 200
    accounts = DepositAccount.query.join(Student).join(StudentEnrollment).join(StudentSubscription, StudentSubscription.student_id == Student.student_id).filter(
        DepositAccount.current_balance <= threshold,
        StudentEnrollment.academic_year_id == academic_year.academic_year_id,
        StudentEnrollment.library_access == True,
        StudentSubscription.academic_year_id == academic_year.academic_year_id,
        StudentSubscription.status == 'ACTIVE',
        Student.is_active == True
    ).distinct().all()
    
    return jsonify([a.to_dict() for a in accounts]), 200
