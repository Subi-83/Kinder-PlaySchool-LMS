from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.student import Student
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, get_current_user
from app.services.settings_service import SettingsService

deposits_bp = Blueprint('deposits', __name__, url_prefix='/api/deposits')

@deposits_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_deposits():
    """Get deposit accounts only for active students with Library Access enabled."""
    # Auto-create deposit accounts for any active students with library access who don't have one yet
    library_students = Student.query.filter_by(library_access=True, is_active=True).all()
    for s in library_students:
        if not DepositAccount.query.filter_by(student_id=s.student_id).first():
            db.session.add(DepositAccount(student_id=s.student_id))
    db.session.commit()

    accounts = DepositAccount.query.join(Student).filter(
        Student.library_access == True,
        Student.is_active == True
    ).order_by(Student.student_name).all()
    return jsonify([a.to_dict() for a in accounts]), 200

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
    if not student.library_access:
        return jsonify({'error': 'Student does not have Library Access enabled. Enable Library Access before recording a deposit.'}), 400

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

@deposits_bp.route('/low-balance', methods=['GET'])
@jwt_required()
@permission_required('deposit.view')
def get_low_balance_accounts():
    """Get low-balance accounts only for active students with Library Access enabled."""
    threshold = request.args.get('threshold', SettingsService.get_float('low_deposit_threshold', 300), type=float)
    
    accounts = DepositAccount.query.join(Student).filter(
        DepositAccount.current_balance <= threshold,
        Student.library_access == True,
        Student.is_active == True
    ).all()
    
    return jsonify([a.to_dict() for a in accounts]), 200
