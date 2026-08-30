from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.subscription import SubscriptionPlan, StudentSubscription
from app.models.student import Student
from app.models.academic import AcademicYear, StudentEnrollment
from app.models.audit import AuditLog
from app.middleware.auth_middleware import permission_required, get_current_user
from datetime import datetime, timedelta

subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')

def _academic_year_from_request(data=None):
    value = (data or {}).get('academic_year_id') or request.args.get('academic_year_id')
    if value:
        try:
            return AcademicYear.query.get(int(value))
        except (TypeError, ValueError):
            return None
    return AcademicYear.get_current()

@subscriptions_bp.route('/plans', methods=['GET'])
@jwt_required()
@permission_required('subscription.view')
def get_plans():
    """Get all subscription plans"""
    plans = SubscriptionPlan.get_active_plans()
    return jsonify([p.to_dict() for p in plans]), 200

@subscriptions_bp.route('/plans', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def create_plan():
    """Create a new subscription plan"""
    data = request.get_json() or {}
    
    def _to_i(val, default=1):
        try: return int(val)
        except (ValueError, TypeError): return default

    def _to_f(val, default=0.0):
        try: return float(val)
        except (ValueError, TypeError): return default

    plan = SubscriptionPlan(
        plan_name=data.get('plan_name'),
        plan_code=data.get('plan_code'),
        max_books=_to_i(data.get('max_books'), 1),
        duration_months=_to_i(data.get('duration_months'), 12),
        price=_to_f(data.get('price'), 0.0),
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
        record_id=data.get('plan_code'),
        details=f'Created plan: {data.get("plan_name")}'
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
        try: return float(val)
        except (ValueError, TypeError): return default

    if 'plan_name' in data:
        plan.plan_name = data['plan_name']
    if 'plan_code' in data:
        plan.plan_code = data['plan_code']
    if 'max_books' in data:
        plan.max_books = _to_i(data['max_books'], 1)
    if 'duration_months' in data:
        plan.duration_months = _to_i(data['duration_months'], 12)
    if 'price' in data:
        plan.price = _to_f(data['price'], 0.0)
    if 'is_active' in data:
        plan.is_active = data['is_active']
    if 'description' in data:
        plan.description = data['description']
    
    db.session.commit()
    
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

    eligible_query = Student.query.join(StudentEnrollment).filter(
        StudentEnrollment.academic_year_id == academic_year.academic_year_id,
        StudentEnrollment.library_access == True,
        Student.is_active == True
    )
    if active_student_ids:
        eligible_query = eligible_query.filter(~Student.student_id.in_(active_student_ids))

    eligible_students = eligible_query.order_by(Student.student_name).all()
    return jsonify([s.to_dict() for s in eligible_students]), 200

@subscriptions_bp.route('/student-subscriptions', methods=['GET'])
@jwt_required()
@permission_required('subscription.view')
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
@permission_required('subscription.edit')
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

@subscriptions_bp.route('/assign', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def assign_subscription():
    """Assign a subscription plan to a student"""
    data = request.get_json() or {}
    
    student_id = data.get('student_id')
    plan_id = data.get('plan_id')
    academic_year = _academic_year_from_request(data)
    
    if not student_id or not plan_id or not academic_year:
        return jsonify({'error': 'Student, plan, and academic year are required'}), 400
    
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    # Validation 1: Student MUST have Library Access
    enrollment = StudentEnrollment.query.filter_by(student_id=student.student_id, academic_year_id=academic_year.academic_year_id, library_access=True).first()
    if not enrollment:
        return jsonify({'error': 'Student does not have Library Access enabled. Subscriptions are not allowed.'}), 400
    
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Subscription plan not found'}), 404
    
    today = datetime.now().date()
    
    # Auto-expire any past active subscriptions
    past_active = StudentSubscription.query.filter_by(student_id=student_id, status='ACTIVE').all()
    for sub in past_active:
        if sub.end_date < today:
            sub.status = 'EXPIRED'
    db.session.commit()

    # Validation 2: Check if student has an active unexpired subscription
    existing_active = StudentSubscription.query.filter_by(
        student_id=student_id,
        academic_year_id=academic_year.academic_year_id,
        status='ACTIVE'
    ).first()

    if existing_active and existing_active.end_date >= today:
        return jsonify({'error': f'Student {student.student_name} already has an active subscription ending on {existing_active.end_date.strftime("%Y-%m-%d")}. Duplicate active subscriptions are not allowed.'}), 400
    
    # Calculate start and end date
    start_date = max(today, academic_year.start_date)
    end_date = min(academic_year.end_date, start_date + timedelta(days=plan.duration_months * 30))
    
    subscription = StudentSubscription(
        student_id=student_id,
        subscription_plan_id=plan_id,
        academic_year_id=academic_year.academic_year_id,
        start_date=start_date,
        end_date=end_date,
        status='ACTIVE',
        amount_paid=plan.price,
        payment_date=today
    )
    
    db.session.add(subscription)
    db.session.commit()
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='ASSIGN_SUBSCRIPTION',
        module='Subscription',
        record_id=str(student_id),
        details=f'Assigned plan {plan.plan_name} to student {student.student_name} ({student.student_uid})'
    )
    
    return jsonify(subscription.to_dict()), 201

@subscriptions_bp.route('/renew/<int:subscription_id>', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def renew_subscription(subscription_id):
    """Renew a subscription"""
    subscription = StudentSubscription.query.get(subscription_id)
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    data = request.get_json()
    plan_id = data.get('plan_id')
    
    if plan_id:
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        subscription.subscription_plan_id = plan_id
        duration_months = plan.duration_months
    else:
        duration_months = subscription.plan_ref.duration_months if subscription.plan_ref else 6
    
    subscription.start_date = datetime.now().date()
    subscription.end_date = datetime.now().date() + timedelta(days=duration_months * 30)
    subscription.status = 'ACTIVE'
    subscription.amount_paid = data.get('amount', subscription.plan_ref.price if subscription.plan_ref else 0)
    subscription.payment_date = datetime.now().date()
    
    db.session.commit()
    
    return jsonify(subscription.to_dict()), 200


@subscriptions_bp.route('/upgrade/<int:subscription_id>', methods=['POST'])
@jwt_required()
@permission_required('subscription.create')
def upgrade_subscription(subscription_id):
    """Move an active subscription to another active plan, starting the new plan today."""
    subscription = StudentSubscription.query.get(subscription_id)
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404

    if subscription.status != 'ACTIVE' or subscription.end_date < datetime.now().date():
        return jsonify({'error': 'Only active subscriptions can be upgraded.'}), 400

    data = request.get_json() or {}
    plan_id = data.get('plan_id')
    if not plan_id:
        return jsonify({'error': 'New subscription plan ID is required'}), 400

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan or not plan.is_active:
        return jsonify({'error': 'Selected subscription plan is not available'}), 404
    if subscription.subscription_plan_id == plan.subscription_plan_id:
        return jsonify({'error': 'Select a different plan to upgrade'}), 400

    today = datetime.now().date()
    previous_plan = subscription.plan_ref.plan_name if subscription.plan_ref else 'previous plan'
    subscription.subscription_plan_id = plan.subscription_plan_id
    subscription.start_date = today
    subscription.end_date = today + timedelta(days=plan.duration_months * 30)
    subscription.amount_paid = plan.price
    subscription.payment_date = today
    subscription.notes = f'Upgraded from {previous_plan} to {plan.plan_name}'
    db.session.commit()

    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id if current_user else None,
        username=current_user.username if current_user else 'system',
        action='UPGRADE_SUBSCRIPTION',
        module='Subscription',
        record_id=str(subscription.student_id),
        details=f'Upgraded {subscription.student_ref.student_name} from {previous_plan} to {plan.plan_name}'
    )

    return jsonify(subscription.to_dict()), 200
