from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.subscription import SubscriptionPlan, StudentSubscription
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.student import Student
from app.models.academic import AcademicYear, StudentEnrollment
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, permission_required_any, get_current_user
from datetime import datetime, timedelta, date

subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')

def get_academic_year_for_date(d):
    """
    Academic year runs June 1 to March 31.
    - If month >= 4 (April to December): Academic year is Y to (Y+1), ending March 31 (Y+1).
    - If month <= 3 (January to March): Academic year is (Y-1) to Y, ending March 31 Y.
    """
    if d.month >= 4:
        start_year = d.year
        end_year = d.year + 1
    else:
        start_year = d.year - 1
        end_year = d.year
    year_code = f"{start_year}-{str(end_year)[-2:]}"
    ay = AcademicYear.query.filter_by(year_code=year_code).first()
    if not ay:
        ay = AcademicYear(
            year_code=year_code,
            year_name=f"Academic Year {year_code}",
            start_date=date(start_year, 6, 1),
            end_date=date(end_year, 3, 31),
            is_current=True if (date(start_year, 6, 1) <= date.today() <= date(end_year, 3, 31)) else False,
            is_active=True
        )
        db.session.add(ay)
        db.session.flush()
    return ay

def _academic_year_from_request(data=None, date_hint=None):
    value = (data or {}).get('academic_year_id') or request.args.get('academic_year_id')
    if value:
        try:
            ay = AcademicYear.query.get(int(value))
            if ay:
                return ay
        except (TypeError, ValueError):
            pass
    if date_hint:
        return get_academic_year_for_date(date_hint)
    current = AcademicYear.get_current()
    if current:
        return current
    return get_academic_year_for_date(datetime.now().date())

@subscriptions_bp.route('/plans', methods=['GET'])
@jwt_required()
@permission_required('subscription.view')
def get_plans():
    """Get all subscription plans"""
    plans = SubscriptionPlan.get_active_plans()
    """Get subscription plans. Optional include_inactive=true query param."""
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    if include_inactive:
        plans = SubscriptionPlan.query.order_by(SubscriptionPlan.subscription_plan_id).all()
    else:
        plans = SubscriptionPlan.get_active_plans()
    return jsonify([p.to_dict() for p in plans]), 200

@subscriptions_bp.route('/plans', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def create_plan():
    """Create a new subscription plan"""
    """Create a new subscription plan with separate subscription_fee, fixed_deposit, and total_amount."""
    data = request.get_json() or {}
    
    plan_name = (data.get('plan_name') or '').strip()
    if not plan_name:
        return jsonify({'error': 'Plan Name is required'}), 400

    def _to_i(val, default=1):
        try: return int(val)
        except (ValueError, TypeError): return default

    def _to_f(val, default=0.0):
        try: return round(float(val), 2)
        except (ValueError, TypeError): return default

    sub_fee = _to_f(data.get('subscription_fee'), 0.0)
    fixed_dep = _to_f(data.get('fixed_deposit'), 0.0)
    total_amt = _to_f(data.get('total_amount'), round(sub_fee + fixed_dep, 2))

    if sub_fee < 0 or fixed_dep < 0:
        return jsonify({'error': 'Subscription Fee and Fixed Deposit cannot be negative'}), 400

    if total_amt <= 0:
        total_amt = round(sub_fee + fixed_dep, 2)

    # Validation: total_amount must equal subscription_fee + fixed_deposit
    if round(total_amt, 2) != round(sub_fee + fixed_dep, 2):
        return jsonify({
            'error': f'Total Amount (₹{total_amt:.2f}) must equal Subscription Fee (₹{sub_fee:.2f}) + Fixed Deposit (₹{fixed_dep:.2f}) = ₹{(sub_fee + fixed_dep):.2f}'
        }), 400

    plan = SubscriptionPlan(
        plan_name=plan_name,
        plan_code=(data.get('plan_code') or '').strip() or None,
        max_books=_to_i(data.get('max_books'), 1),
        duration_months=_to_i(data.get('duration_months'), 3),
        subscription_fee=sub_fee,
        fixed_deposit=fixed_dep,
        total_amount=total_amt,
        price=total_amt,
        is_active=bool(data.get('is_active', True)),
        description=data.get('description')
    )
    
    db.session.add(plan)
    db.session.commit()
    
    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='CREATE_SUBSCRIPTION_PLAN',
        module='Subscription',
        record_id=data.get('plan_code') or str(plan.subscription_plan_id),
        details=f'Created plan {plan.plan_name}: Fee ₹{sub_fee:.2f}, Deposit ₹{fixed_dep:.2f}, Total ₹{total_amt:.2f}'
    )
    
    return jsonify(plan.to_dict()), 201

@subscriptions_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
@permission_required('subscription.edit')
def update_plan(plan_id):
    """Update a subscription plan"""
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404
    
    data = request.get_json() or {}
    
    def _to_i(val, default=1):
        try: return int(val)
        except (ValueError, TypeError): return default

    def _to_f(val, default=0.0):
        try: return round(float(val), 2)
        except (ValueError, TypeError): return default

    if 'plan_name' in data:
        plan.plan_name = data['plan_name']
    sub_fee = _to_f(data.get('subscription_fee'), float(plan.subscription_fee or 0))
    fixed_dep = _to_f(data.get('fixed_deposit'), float(plan.fixed_deposit or 0))
    total_amt = _to_f(data.get('total_amount'), round(sub_fee + fixed_dep, 2))

    if sub_fee < 0 or fixed_dep < 0:
        return jsonify({'error': 'Subscription Fee and Fixed Deposit cannot be negative'}), 400

    # Validation: total_amount must equal subscription_fee + fixed_deposit
    if round(total_amt, 2) != round(sub_fee + fixed_dep, 2):
        return jsonify({
            'error': f'Total Amount (₹{total_amt:.2f}) must equal Subscription Fee (₹{sub_fee:.2f}) + Fixed Deposit (₹{fixed_dep:.2f}) = ₹{(sub_fee + fixed_dep):.2f}'
        }), 400

    if 'plan_name' in data and data['plan_name']:
        plan.plan_name = data['plan_name'].strip()
    if 'plan_code' in data:
        plan.plan_code = data['plan_code']
        plan.plan_code = (data['plan_code'] or '').strip() or None
    if 'max_books' in data:
        plan.max_books = _to_i(data['max_books'], 1)
    if 'duration_months' in data:
        plan.duration_months = _to_i(data['duration_months'], 12)
    if 'price' in data:
        plan.price = _to_f(data['price'], 0.0)
        plan.duration_months = _to_i(data['duration_months'], 3)
    
    plan.subscription_fee = sub_fee
    plan.fixed_deposit = fixed_dep
    plan.total_amount = total_amt
    plan.price = total_amt

    if 'is_active' in data:
        plan.is_active = bool(data['is_active'])
    if 'description' in data:
        plan.description = data['description']
    
    db.session.commit()
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='UPDATE_SUBSCRIPTION_PLAN',
        module='Subscription',
        record_id=str(plan.subscription_plan_id),
        details=f'Updated plan {plan.plan_name}: Fee ₹{sub_fee:.2f}, Deposit ₹{fixed_dep:.2f}, Total ₹{total_amt:.2f}'
    )
    
    return jsonify(plan.to_dict()), 200

@subscriptions_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
@permission_required('subscription.delete')
def delete_plan(plan_id):
    """Delete a subscription plan"""
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404
    
    # Check if plan is in use
    in_use = StudentSubscription.query.filter_by(subscription_plan_id=plan_id).first()
    if in_use:
        return jsonify({'error': 'Cannot delete plan that is in use'}), 400
    
    plan_name = plan.plan_name
    db.session.delete(plan)
    db.session.commit()
    
    return jsonify({'message': f'Plan {plan_name} deleted successfully'}), 200

@subscriptions_bp.route('/eligible-students', methods=['GET'])
@jwt_required()
@permission_required('subscription.view')
def get_eligible_students():
    """Get students eligible for creating a new subscription (Must have Library Access AND no active subscription)."""
    today = datetime.now().date()
    academic_year = _academic_year_from_request()
    if not academic_year:
        return jsonify({'error': 'Select an academic year.'}), 400
    
    # Auto-expire overdue active subscriptions first
    overdue_subs = StudentSubscription.query.filter(
        StudentSubscription.status == 'ACTIVE',
        StudentSubscription.end_date < today
    ).all()
    for sub in overdue_subs:
        sub.status = 'EXPIRED'
    if overdue_subs:
        db.session.commit()

    active_student_ids = [sub.student_id for sub in StudentSubscription.query.filter_by(status='ACTIVE', academic_year_id=academic_year.academic_year_id).all()]

    eligible_query = Student.query.outerjoin(
        StudentEnrollment,
        db.and_(
            StudentEnrollment.student_id == Student.student_id,
            StudentEnrollment.academic_year_id == academic_year.academic_year_id
        )
    ).filter(
        Student.is_active == True,
        db.or_(
            Student.library_access == True,
            StudentEnrollment.library_access == True
        )
    )
    if active_student_ids:
        eligible_query = eligible_query.filter(~Student.student_id.in_(active_student_ids))

    eligible_students = eligible_query.distinct().order_by(Student.student_name).all()
    return jsonify([s.to_dict() for s in eligible_students]), 200

@subscriptions_bp.route('/student-subscriptions', methods=['GET'])
@jwt_required()
@permission_required_any(['subscription.view', 'subscription.payment.view'])
def get_all_student_subscriptions():
    """Get all student subscriptions history"""
    today = datetime.now().date()
    overdue_subs = StudentSubscription.query.filter(
        StudentSubscription.status == 'ACTIVE',
        StudentSubscription.end_date < today
    ).all()
    for sub in overdue_subs:
        sub.status = 'EXPIRED'
    if overdue_subs:
        db.session.commit()

    query = StudentSubscription.query
    academic_year = _academic_year_from_request()
    if academic_year:
        query = query.filter_by(academic_year_id=academic_year.academic_year_id)
    subscriptions = query.order_by(StudentSubscription.created_at.desc()).all()
    return jsonify([s.to_dict() for s in subscriptions]), 200

@subscriptions_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
@permission_required('subscription.view')
def get_student_subscriptions(student_id):
    """Get subscriptions for a specific student"""
    subscriptions = StudentSubscription.query.filter_by(
        student_id=student_id
    ).order_by(StudentSubscription.created_at.desc()).all()
    
    return jsonify([s.to_dict() for s in subscriptions]), 200

@subscriptions_bp.route('/payments/<int:subscription_id>', methods=['PUT'])
@jwt_required()
@permission_required('subscription.payment.edit')
def update_subscription_payment(subscription_id):
    """Update subscription payment only; never changes the library deposit."""
    subscription = StudentSubscription.query.get(subscription_id)
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    data = request.get_json() or {}
    try:
        amount = float(data.get('amount_paid', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Enter a valid subscription amount.'}), 400
    if amount < 0:
        return jsonify({'error': 'Subscription amount cannot be negative.'}), 400
    before = float(subscription.amount_paid or 0)
    subscription.amount_paid = amount
    subscription.payment_method = (data.get('payment_method') or '').strip() or None
    subscription.payment_proof_url = (data.get('payment_proof_url') or '').strip() or None
    payment_date = data.get('payment_date')
    if payment_date:
        try:
            subscription.payment_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Payment date must be YYYY-MM-DD.'}), 400
    db.session.commit()
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='UPDATE_SUBSCRIPTION_PAYMENT', module='Subscription', record_id=subscription.subscription_id,
        details=f'Updated subscription payment for {subscription.student_ref.student_name}: ₹{before:.2f} to ₹{amount:.2f}'
    )
    return jsonify(subscription.to_dict()), 200

@subscriptions_bp.route('/calculate-breakdown', methods=['GET'])
@jwt_required()
@permission_required('subscription.view')
def calculate_breakdown():
    """Calculate subscription breakdown and deposit carry-forward for a student and plan."""
    student_id = request.args.get('student_id', type=int)
    plan_id = request.args.get('plan_id', type=int)
    is_custom_param = request.args.get('is_custom', '').lower() in ('true', '1')

    if not student_id:
        return jsonify({'error': 'student_id is required'}), 400

    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    plan = SubscriptionPlan.query.get(plan_id) if plan_id else None
    is_custom = is_custom_param or (plan and (plan.plan_code == 'CUSTOM' or plan.plan_name == 'Customized Plan'))

    if is_custom:
        try:
            custom_fee_val = request.args.get('custom_subscription_fee')
            if custom_fee_val is None:
                custom_fee_val = request.args.get('subscription_fee', 0.0)
            custom_dep_val = request.args.get('custom_deposit_amount')
            if custom_dep_val is None:
                custom_dep_val = request.args.get('deposit_amount', 0.0)

            sub_fee = round(float(custom_fee_val or 0.0), 2)
            req_dep = round(float(custom_dep_val or 0.0), 2)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid numeric amount for customized plan.'}), 400

        if sub_fee < 0 or req_dep < 0:
            return jsonify({'error': 'Subscription amount and deposit amount cannot be negative.'}), 400

        plan_name = 'Customized Plan'
        duration_months = 10
        plan_id = plan.subscription_plan_id if plan else None
    else:
        if not plan:
            return jsonify({'error': 'Valid subscription plan is required'}), 400
        sub_fee = round(float(plan.subscription_fee or 0.0), 2)
        req_dep = round(float(plan.fixed_deposit or 0.0), 2)
        plan_name = plan.plan_name
        duration_months = plan.duration_months
        plan_id = plan.subscription_plan_id

    deposit_account = DepositAccount.query.filter_by(student_id=student_id).first()
    cur_bal = round(float(deposit_account.current_balance or 0.0), 2) if deposit_account else 0.0
    outstanding = round(float(deposit_account.outstanding_balance or 0.0), 2) if deposit_account else 0.0

    # Core carry-forward formula:
    # Additional Deposit Required = max(New Plan Fixed Deposit - Current Deposit Balance, 0)
    add_dep = round(max(req_dep - cur_bal, 0.0), 2)
    carried_forward = round(min(cur_bal, req_dep), 2)
    excess_dep = round(max(cur_bal - req_dep, 0.0), 2)
    total_payable = round(sub_fee + add_dep, 2)
    deposit_balance_after = round(cur_bal + add_dep, 2)

    ay = _academic_year_from_request(date_hint=date.today())
    ay_name = ay.year_name if ay else f"{date.today().year}-{date.today().year+1}"
    exp_date = ay.end_date if ay and ay.end_date else date(date.today().year + (1 if date.today().month >= 4 else 0), 3, 31)

    return jsonify({
        'student_id': student.student_id,
        'student_name': student.student_name,
        'student_uid': student.student_uid,
        'plan_id': plan_id,
        'plan_name': plan_name,
        'is_custom': is_custom,
        'duration_months': duration_months,
        'academic_year_name': ay_name,
        'start_date': date.today().isoformat(),
        'end_date': exp_date.isoformat(),
        'subscription_fee': sub_fee,
        'fixed_deposit': req_dep,
        'total_plan_amount': round(sub_fee + req_dep, 2),
        'current_deposit_balance': cur_bal,
        'outstanding_balance': outstanding,
        'carried_forward_deposit': carried_forward,
        'additional_deposit_required': add_dep,
        'excess_deposit': excess_dep,
        'total_payable': total_payable,
        'deposit_balance_after': deposit_balance_after
    }), 200

@subscriptions_bp.route('/assign', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def assign_subscription():
    """Assign a subscription plan to a student with deposit carry-forward tracking and March 31 end date."""
    data = request.get_json() or {}
    
    student_id = data.get('student_id')
    plan_id = data.get('plan_id')
    payment_method = (data.get('payment_method') or 'CASH').strip().upper()
    
    if not student_id or not plan_id:
        return jsonify({'error': 'Student and plan are required'}), 400
    
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan or not plan.is_active:
        return jsonify({'error': 'Valid active subscription plan not found'}), 404

    # Determine start date
    start_date_str = data.get('start_date')
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Start date must be in YYYY-MM-DD format.'}), 400
    else:
        start_date = datetime.now().date()

    # Determine academic year based on start date (June 1 - March 31 rule)
    academic_year = _academic_year_from_request(data, date_hint=start_date)
    if not academic_year:
        return jsonify({'error': 'Could not determine academic year.'}), 400

    # Ensure student has Library Access
    has_library_access = bool(student.library_access)
    if not has_library_access:
        enr_with_access = StudentEnrollment.query.filter_by(
            student_id=student.student_id,
            library_access=True
        ).first()
        if enr_with_access:
            has_library_access = True

    if not has_library_access:
        return jsonify({'error': 'Student does not have Library Access enabled. Subscriptions are not allowed.'}), 400

    # Ensure student and enrollment both have library_access = True
    student.library_access = True
    active_enr = StudentEnrollment.query.filter_by(
        student_id=student.student_id,
        academic_year_id=academic_year.academic_year_id
    ).first()
    if active_enr:
        active_enr.library_access = True

    # Check for Customized Plan
    is_custom = bool(
        data.get('is_custom_plan') or
        plan.plan_code == 'CUSTOM' or
        plan.plan_name == 'Customized Plan'
    )

    if is_custom:
        try:
            custom_fee_val = data.get('custom_subscription_fee')
            if custom_fee_val is None:
                custom_fee_val = data.get('subscription_fee')
            custom_dep_val = data.get('custom_deposit_amount')
            if custom_dep_val is None:
                custom_dep_val = data.get('deposit_amount')

            if custom_fee_val is None or custom_dep_val is None:
                return jsonify({'error': 'Subscription Amount and Deposit Amount are required for Customized Plan.'}), 400

            custom_sub_fee = float(custom_fee_val)
            custom_dep = float(custom_dep_val)
        except (ValueError, TypeError):
            return jsonify({'error': 'Valid numeric amounts required for Customized Plan.'}), 400

        if custom_sub_fee < 0 or custom_dep < 0:
            return jsonify({'error': 'Subscription Amount and Deposit Amount cannot be negative.'}), 400

        sub_fee = round(custom_sub_fee, 2)
        req_dep = round(custom_dep, 2)
    else:
        sub_fee = round(float(plan.subscription_fee or 0.0), 2)
        req_dep = round(float(plan.fixed_deposit or 0.0), 2)
        custom_sub_fee = None
        custom_dep = None

    today = datetime.now().date()
    
    # Auto-expire overdue active subscriptions
    past_active = StudentSubscription.query.filter_by(student_id=student_id, status='ACTIVE').all()
    for sub in past_active:
        if sub.end_date < today:
            sub.status = 'EXPIRED'
    db.session.commit()

    # Validation: Check if student has an active unexpired subscription
    existing_active = StudentSubscription.query.filter_by(
        student_id=student_id,
        academic_year_id=academic_year.academic_year_id,
        status='ACTIVE'
    ).first()

    if existing_active and existing_active.end_date >= today:
        return jsonify({'error': f'Student {student.student_name} already has an active subscription ending on {existing_active.end_date.strftime("%Y-%m-%d")}. Duplicate active subscriptions are not allowed.'}), 400
    
    # Deposit Account & Carry Forward Calculations
    deposit_account = DepositAccount.query.filter_by(student_id=student_id).first()
    if not deposit_account:
        deposit_account = DepositAccount(student_id=student_id)
        db.session.add(deposit_account)
        db.session.flush()

    cur_bal = round(float(deposit_account.current_balance or 0.0), 2)
    add_dep = round(max(req_dep - cur_bal, 0.0), 2)
    total_payable = round(sub_fee + add_dep, 2)

    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'

    plan_label = 'Customized Plan' if is_custom else plan.plan_name

    # Record carry forward in ledger if existing deposit exists
    if cur_bal > 0:
        cf_tx = DepositTransaction(
            deposit_account_id=deposit_account.deposit_account_id,
            transaction_type='CARRY_FORWARD',
            amount=0.00,
            balance_after=deposit_account.current_balance,
            description=f'Existing deposit of ₹{cur_bal:.2f} carried forward to {plan_label} subscription',
            created_by=user_id
        )
        db.session.add(cf_tx)

    # If additional deposit is required, add to balance and record transaction
    if add_dep > 0:
        deposit_account.current_balance = round(cur_bal + add_dep, 2)
        deposit_account.last_transaction_date = datetime.utcnow()
        init_tx = DepositTransaction(
            deposit_account_id=deposit_account.deposit_account_id,
            transaction_type='INITIAL_DEPOSIT' if cur_bal == 0 else 'TOP_UP',
            amount=add_dep,
            balance_after=deposit_account.current_balance,
            description=f'Deposit payment for {plan_label} subscription (Required deposit: ₹{req_dep:.2f})',
            created_by=user_id
        )
        db.session.add(init_tx)

    # STRICT ACADEMIC YEAR RULE:
    # All subscriptions expire on March 31 of the applicable academic year!
    end_date = academic_year.end_date
    
    subscription = StudentSubscription(
        student_id=student_id,
        subscription_plan_id=plan.subscription_plan_id,
        academic_year_id=academic_year.academic_year_id,
        start_date=start_date,
        end_date=end_date,
        status='ACTIVE',
        is_custom_plan=is_custom,
        custom_subscription_fee=custom_sub_fee,
        custom_deposit_amount=custom_dep,
        amount_paid=sub_fee,
        subscription_fee_paid=sub_fee,
        deposit_paid=add_dep,
        total_paid=total_payable,
        payment_date=today,
        payment_method=payment_method,
        notes=data.get('notes')
    )
    
    db.session.add(subscription)
    db.session.commit()
    
    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='ASSIGN_SUBSCRIPTION',
        module='Subscription',
        record_id=str(student_id),
        details=f'Assigned plan {plan_label} to student {student.student_name} ({student.student_uid}). AY: {academic_year.year_code}, End: {end_date}. Fee: ₹{sub_fee:.2f}, Add Deposit: ₹{add_dep:.2f}, Total Paid: ₹{total_payable:.2f}'
    )
    
    return jsonify(subscription.to_dict()), 201

@subscriptions_bp.route('/renew/<int:subscription_id>', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def renew_subscription(subscription_id):
    """Renew a subscription with deposit carry forward and March 31 academic year end date."""
    subscription = StudentSubscription.query.get(subscription_id)
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    data = request.get_json() or {}
    plan_id = data.get('plan_id') or subscription.subscription_plan_id
    payment_method = (data.get('payment_method') or '').strip().upper()
    allowed_payment_methods = {'UPI', 'BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE', 'OTHER'}
    if payment_method not in allowed_payment_methods:
        return jsonify({'error': 'Please select a valid payment method'}), 400
    
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan or not plan.is_active:
        return jsonify({'error': 'Valid active plan not found'}), 404

    # Determine start date
    today = datetime.now().date()
    start_date_str = data.get('start_date')
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            start_date = today
    else:
        start_date = today

    # Determine academic year and end date (strict March 31 rule)
    academic_year = _academic_year_from_request(data, date_hint=start_date)

    # Check for Customized Plan
    is_custom = bool(
        data.get('is_custom_plan') or
        plan.plan_code == 'CUSTOM' or
        plan.plan_name == 'Customized Plan'
    )

    if is_custom:
        try:
            custom_fee_val = data.get('custom_subscription_fee')
            if custom_fee_val is None:
                custom_fee_val = data.get('subscription_fee')
            custom_dep_val = data.get('custom_deposit_amount')
            if custom_dep_val is None:
                custom_dep_val = data.get('deposit_amount')

            custom_sub_fee = float(custom_fee_val or 0.0)
            custom_dep = float(custom_dep_val or 0.0)
        except (ValueError, TypeError):
            return jsonify({'error': 'Valid numeric amounts required for Customized Plan.'}), 400

        if custom_sub_fee < 0 or custom_dep < 0:
            return jsonify({'error': 'Subscription Amount and Deposit Amount cannot be negative.'}), 400

        sub_fee = round(custom_sub_fee, 2)
        req_dep = round(custom_dep, 2)
    else:
        sub_fee = round(float(plan.subscription_fee or 0.0), 2)
        req_dep = round(float(plan.fixed_deposit or 0.0), 2)
        custom_sub_fee = None
        custom_dep = None

    deposit_account = DepositAccount.query.filter_by(student_id=subscription.student_id).first()
    if not deposit_account:
        deposit_account = DepositAccount(student_id=subscription.student_id)
        db.session.add(deposit_account)
        db.session.flush()

    cur_bal = round(float(deposit_account.current_balance or 0.0), 2)
    add_dep = round(max(req_dep - cur_bal, 0.0), 2)
    total_payable = round(sub_fee + add_dep, 2)

    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'

    plan_label = 'Customized Plan' if is_custom else plan.plan_name

    # Always record carry forward transaction in ledger
    cf_tx = DepositTransaction(
        deposit_account_id=deposit_account.deposit_account_id,
        transaction_type='CARRY_FORWARD',
        amount=0.00,
        balance_after=deposit_account.current_balance,
        reference_id=str(subscription.subscription_id),
        description=f'Deposit of ₹{cur_bal:.2f} carried forward for renewal to {plan_label}',
        created_by=user_id
    )
    db.session.add(cf_tx)

    # If deposit was depleted below required plan deposit, replenish it
    if add_dep > 0:
        deposit_account.current_balance = round(cur_bal + add_dep, 2)
        deposit_account.last_transaction_date = datetime.utcnow()
        topup_tx = DepositTransaction(
            deposit_account_id=deposit_account.deposit_account_id,
            transaction_type='TOP_UP',
            amount=add_dep,
            balance_after=deposit_account.current_balance,
            reference_id=str(subscription.subscription_id),
            description=f'Deposit replenishment for renewal to {plan_label} (Carried forward ₹{cur_bal:.2f}, added ₹{add_dep:.2f} to meet ₹{req_dep:.2f})',
            created_by=user_id
        )
        db.session.add(topup_tx)

    subscription.subscription_plan_id = plan.subscription_plan_id
    if academic_year:
        subscription.academic_year_id = academic_year.academic_year_id
    subscription.start_date = start_date
    # STRICT MARCH 31 RULE:
    subscription.end_date = academic_year.end_date if academic_year else date(start_date.year + (1 if start_date.month >= 4 else 0), 3, 31)
    subscription.status = 'ACTIVE'
    subscription.is_custom_plan = is_custom
    subscription.custom_subscription_fee = custom_sub_fee
    subscription.custom_deposit_amount = custom_dep
    subscription.amount_paid = sub_fee
    subscription.subscription_fee_paid = sub_fee
    subscription.deposit_paid = add_dep
    subscription.total_paid = total_payable
    subscription.payment_date = today
    subscription.payment_method = payment_method
    
    db.session.commit()

    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='RENEW_SUBSCRIPTION',
        module='Subscription',
        record_id=str(subscription.student_id),
        details=f'Renewed subscription for {subscription.student_ref.student_name if subscription.student_ref else subscription.student_id} to {plan_label}. Fee: ₹{sub_fee:.2f}, Add Deposit: ₹{add_dep:.2f}, Total Paid: ₹{total_payable:.2f}; method: {payment_method}'
    )
    
    return jsonify(subscription.to_dict()), 200


@subscriptions_bp.route('/upgrade/<int:subscription_id>', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def upgrade_subscription(subscription_id):
    """Move an active subscription to another active plan, carrying forward deposit and replenishing if needed."""
    subscription = StudentSubscription.query.get(subscription_id)
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404

    if subscription.status != 'ACTIVE' or subscription.end_date < datetime.now().date():
        return jsonify({'error': 'Only active subscriptions can be upgraded.'}), 400

    data = request.get_json() or {}
    plan_id = data.get('plan_id')
    payment_method = (data.get('payment_method') or 'CASH').strip().upper()
    if not plan_id:
        return jsonify({'error': 'New subscription plan ID is required'}), 400

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan or not plan.is_active:
        return jsonify({'error': 'Selected subscription plan is not available'}), 404
    if subscription.subscription_plan_id == plan.subscription_plan_id:
        return jsonify({'error': 'Select a different plan to upgrade'}), 400

    today = datetime.now().date()
    academic_year = _academic_year_from_request(data, date_hint=today)

    deposit_account = DepositAccount.query.filter_by(student_id=subscription.student_id).first()
    if not deposit_account:
        deposit_account = DepositAccount(student_id=subscription.student_id)
        db.session.add(deposit_account)
        db.session.flush()

    cur_bal = round(float(deposit_account.current_balance or 0.0), 2)
    sub_fee = round(float(plan.subscription_fee or 0.0), 2)
    req_dep = round(float(plan.fixed_deposit or 0.0), 2)
    add_dep = round(max(req_dep - cur_bal, 0.0), 2)
    total_payable = round(sub_fee + add_dep, 2)

    current_user = get_current_user()
    user_id = current_user.user_id if current_user else None
    username = current_user.username if current_user else 'system'

    # Record carry forward in ledger
    cf_tx = DepositTransaction(
        deposit_account_id=deposit_account.deposit_account_id,
        transaction_type='CARRY_FORWARD',
        amount=0.00,
        balance_after=deposit_account.current_balance,
        reference_id=str(subscription.subscription_id),
        description=f'Deposit of ₹{cur_bal:.2f} carried forward to upgrade ({plan.plan_name})',
        created_by=user_id
    )
    db.session.add(cf_tx)

    if add_dep > 0:
        deposit_account.current_balance = round(cur_bal + add_dep, 2)
        deposit_account.last_transaction_date = datetime.utcnow()
        topup_tx = DepositTransaction(
            deposit_account_id=deposit_account.deposit_account_id,
            transaction_type='TOP_UP',
            amount=add_dep,
            balance_after=deposit_account.current_balance,
            reference_id=str(subscription.subscription_id),
            description=f'Deposit replenishment for upgrade to {plan.plan_name} (Carried forward ₹{cur_bal:.2f}, added ₹{add_dep:.2f} to meet ₹{req_dep:.2f})',
            created_by=user_id
        )
        db.session.add(topup_tx)

    previous_plan = subscription.plan_ref.plan_name if subscription.plan_ref else 'previous plan'
    subscription.subscription_plan_id = plan.subscription_plan_id
    if academic_year:
        subscription.academic_year_id = academic_year.academic_year_id
    subscription.start_date = today
    # STRICT MARCH 31 RULE:
    subscription.end_date = academic_year.end_date if academic_year else date(today.year + (1 if today.month >= 4 else 0), 3, 31)
    subscription.amount_paid = sub_fee
    subscription.subscription_fee_paid = sub_fee
    subscription.deposit_paid = add_dep
    subscription.total_paid = total_payable
    subscription.payment_date = today
    subscription.payment_method = payment_method
    subscription.notes = f'Upgraded from {previous_plan} to {plan.plan_name}'
    db.session.commit()

    AuditLog.log_action(
        user_id=user_id,
        username=username,
        action='UPGRADE_SUBSCRIPTION',
        module='Subscription',
        record_id=str(subscription.student_id),
        details=f'Upgraded {subscription.student_ref.student_name if subscription.student_ref else subscription.student_id} from {previous_plan} to {plan.plan_name}. Fee: ₹{sub_fee:.2f}, Add Deposit: ₹{add_dep:.2f}, Total Paid: ₹{total_payable:.2f}'
    )

    return jsonify(subscription.to_dict()), 200
