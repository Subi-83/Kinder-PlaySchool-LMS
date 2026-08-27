"""
Audit Routes - Audit log endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.audit import AuditLog
from app import db
from app.models.book import BookTitle, BookCopy
from app.models.student import Student
from app.models.library import BookIssue
from app.models.deposit import DepositAccount, DepositTransaction
from app.models.settings import Holiday
from datetime import datetime, timedelta
import json
from app.middleware.auth_middleware import permission_required, admin_required, get_current_user
from app.services.audit_service import AuditService

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

@audit_bp.route('/notifications', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_notifications():
    actions = ['DEPOSIT_TOPUP', 'DEPOSIT_ADJUSTMENT', 'UPDATE_BOOK', 'UPDATE_BOOK_COPY',
               'UPDATE_STUDENT', 'DELETE_STUDENT', 'RETURN_BOOK', 'RECORD_DAMAGE_LOSS',
               'CREATE_HOLIDAY', 'UPDATE_HOLIDAY', 'DELETE_HOLIDAY', 'UPDATE_SETTINGS', 'UPDATE_SETTING',
               'DELETE_BOOK_REQUEST', 'DELETE_COPY_REQUEST', 'DELETE_STUDENT_REQUEST', 'DELETE_BOOK_APPROVED', 'DELETE_COPY_APPROVED', 'DELETE_STUDENT_APPROVED',
               'DELETE_BOOK_REJECTED', 'DELETE_COPY_REJECTED', 'BOOK_CONDITION_REVIEW_COMPLETED',
               'DEPOSIT_CORRECTION_REQUEST', 'DEPOSIT_CORRECTION_APPROVED', 'DEPOSIT_CORRECTION_REJECTED']
    logs = AuditLog.query.filter(AuditLog.action.in_(actions)).order_by(AuditLog.created_at.desc()).limit(50).all()
    pending = {'DELETE_BOOK_REQUEST', 'DELETE_COPY_REQUEST', 'DELETE_STUDENT_REQUEST', 'DEPOSIT_CORRECTION_REQUEST'}
    review_cutoff = datetime.utcnow() - timedelta(days=365)
    condition_reviews = BookCopy.query.filter(
        BookCopy.updated_at <= review_cutoff,
        BookCopy.status.notin_(['LOST'])
    ).order_by(BookCopy.updated_at.asc()).all()
    review_notifications = [{
        'audit_id': f'review-{copy.book_copy_id}',
        'record_id': str(copy.book_copy_id),
        'action': 'BOOK_CONDITION_REVIEW',
        'module': 'BookCopy',
        'username': 'System',
        'created_at': copy.updated_at.strftime('%Y-%m-%d') if copy.updated_at else None,
        'details': f'Annual condition check due for {copy.title_ref.title if copy.title_ref else "book"}, Book ID {copy.barcode or copy.book_copy_id}. Current condition: {copy.condition}; status: {copy.status}.',
        'book_title': copy.title_ref.title if copy.title_ref else 'Book',
        'barcode': copy.barcode,
        'current_condition': copy.condition,
        'current_status': copy.status,
        'requires_approval': False,
    } for copy in condition_reviews]
    low_accounts = DepositAccount.query.join(Student).filter(
        Student.is_active == True,
        Student.library_access == True,
        DepositAccount.current_balance <= DepositAccount.warning_threshold
    ).order_by(DepositAccount.current_balance.asc()).all()
    low_deposit_notifications = [{
        'audit_id': f'low-deposit-{account.deposit_account_id}',
        'record_id': str(account.student_id),
        'action': 'LOW_DEPOSIT_WARNING',
        'module': 'Deposit',
        'username': 'System',
        'created_at': account.updated_at.strftime('%Y-%m-%d %H:%M:%S') if account.updated_at else None,
        'details': (
            f'{account.student.student_name if account.student else "Student"} '
            f'({account.student.student_uid if account.student else account.student_id}) has a deposit balance of '
            f'₹{float(account.current_balance or 0):.2f}; warning threshold is ₹{float(account.warning_threshold or 0):.2f}.'
        ),
        'requires_approval': False,
    } for account in low_accounts]
    today = datetime.now().date()
    today_key = today.strftime('%Y-%m-%d')
    daily_answer = AuditLog.query.filter(
        AuditLog.action.in_(['TODAY_HOLIDAY_CONFIRMED', 'TODAY_NOT_HOLIDAY']),
        AuditLog.record_id == today_key
    ).first()
    daily_holiday_notification = [] if daily_answer else [{
        'audit_id': f'holiday-check-{today_key}',
        'record_id': today_key,
        'action': 'TODAY_HOLIDAY_CHECK',
        'module': 'Holiday',
        'username': 'System',
        'created_at': today_key,
        'details': f'Please confirm whether today ({today.strftime("%d %b %Y")}) is an official holiday.',
        'requires_approval': False,
        'requires_holiday_confirmation': True,
        'configured_holiday': Holiday.is_holiday(today),
    }]
    log_notifications = []
    for log in logs:
        item = {**log.to_dict(), 'requires_approval': log.action in pending}
        if log.action.startswith('DEPOSIT_CORRECTION_'):
            try:
                correction = json.loads(log.details or '{}')
                item['correction'] = correction
                item['details'] = (f'{correction.get("student_name", "JK Member")} ({correction.get("student_uid", "")}) '
                                   f'deposit payment correction: ₹{correction.get("original_amount", 0):.2f} to '
                                   f'₹{correction.get("corrected_amount", 0):.2f}. Reason: {correction.get("reason", "-")}')
            except (ValueError, TypeError):
                pass
        log_notifications.append(item)
    return jsonify({
        'notifications': daily_holiday_notification + low_deposit_notifications + review_notifications + log_notifications,
        'pending_count': len(low_deposit_notifications) + sum(1 for log in logs if log.action in pending)
    }), 200

@audit_bp.route('/deposit-corrections/<int:audit_id>/<string:decision>', methods=['POST'])
@jwt_required()
@admin_required
def decide_deposit_correction(audit_id, decision):
    request_log = AuditLog.query.get(audit_id)
    if not request_log or request_log.action != 'DEPOSIT_CORRECTION_REQUEST':
        return jsonify({'error': 'Pending deposit correction not found.'}), 404
    if decision not in ('approve', 'reject'):
        return jsonify({'error': 'Invalid decision.'}), 400
    payload = json.loads(request_log.details or '{}')
    current_user = get_current_user()
    if decision == 'reject':
        request_log.action = 'DEPOSIT_CORRECTION_REJECTED'
        payload['decision_by'] = current_user.username
        request_log.details = json.dumps(payload)
        db.session.commit()
        return jsonify({'message': 'Deposit correction rejected.'}), 200

    transaction = DepositTransaction.query.get(payload.get('transaction_id'))
    if not transaction or not transaction.account_ref:
        return jsonify({'error': 'Original deposit transaction no longer exists.'}), 404
    account = transaction.account_ref
    difference = float(payload['corrected_amount']) - float(payload['original_amount'])
    new_balance = float(account.current_balance or 0) + difference
    if new_balance < 0:
        return jsonify({'error': 'Correction cannot be approved because it would make the deposit negative.'}), 400
    adjustment = DepositTransaction(
        deposit_account_id=account.deposit_account_id, transaction_type='ADJUSTMENT',
        amount=difference, balance_after=new_balance,
        reference_id=str(transaction.transaction_id),
        description=f'Approved correction for transaction {transaction.transaction_id}: {payload.get("reason")}',
        created_by=current_user.user_id
    )
    account.current_balance = new_balance
    account.last_transaction_date = db.func.now()
    db.session.add(adjustment)
    request_log.action = 'DEPOSIT_CORRECTION_APPROVED'
    payload.update({'difference': difference, 'balance_after': new_balance, 'decision_by': current_user.username})
    request_log.details = json.dumps(payload)
    db.session.commit()
    return jsonify({'message': 'Deposit correction approved and balance updated.'}), 200

@audit_bp.route('/book-condition-reviews/<int:copy_id>', methods=['POST'])
@jwt_required()
@admin_required
def complete_book_condition_review(copy_id):
    copy = BookCopy.query.get(copy_id)
    if not copy:
        return jsonify({'error': 'Book copy not found.'}), 404

    data = request.get_json() or {}
    condition = (data.get('condition') or '').upper()
    status = (data.get('status') or copy.status or '').upper()
    review_notes = (data.get('notes') or '').strip()
    valid_conditions = {'NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'}
    valid_statuses = {'AVAILABLE', 'ISSUED', 'DAMAGED', 'LOST', 'RESERVED'}
    if condition not in valid_conditions:
        return jsonify({'error': 'Select a valid book condition.'}), 400
    if status not in valid_statuses:
        return jsonify({'error': 'Select a valid book status.'}), 400
    if copy.status == 'ISSUED' and status != 'ISSUED':
        return jsonify({'error': 'An issued book must be returned before its availability status can change.'}), 400

    previous_condition, previous_status = copy.condition, copy.status
    copy.condition = condition
    copy.status = status
    if review_notes:
        entry = f'Annual review {datetime.now().date().isoformat()}: {review_notes}'
        copy.notes = f'{copy.notes}\n{entry}' if copy.notes else entry
    db.session.commit()

    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='BOOK_CONDITION_REVIEW_COMPLETED',
        module='Library',
        record_id=copy.book_copy_id,
        details=(f'Annual review completed for {copy.title_ref.title if copy.title_ref else "book"} '
                 f'({copy.barcode or copy.book_copy_id}). Condition: {previous_condition} to {condition}; '
                 f'status: {previous_status} to {status}.' + (f' Notes: {review_notes}' if review_notes else ''))
    )
    return jsonify({'message': 'Book condition review saved.', 'book_copy': copy.to_dict()}), 200

@audit_bp.route('/daily-holiday', methods=['POST'])
@jwt_required()
@admin_required
def answer_daily_holiday():
    data = request.get_json() or {}
    today = datetime.now().date()
    today_key = today.strftime('%Y-%m-%d')
    existing_answer = AuditLog.query.filter(
        AuditLog.action.in_(['TODAY_HOLIDAY_CONFIRMED', 'TODAY_NOT_HOLIDAY']),
        AuditLog.record_id == today_key
    ).first()
    if existing_answer:
        return jsonify({'message': 'Today’s holiday status was already confirmed.'}), 200
    is_holiday = bool(data.get('is_holiday'))
    holiday_name = (data.get('holiday_name') or 'Official Holiday').strip()
    if is_holiday and not Holiday.is_holiday(today):
        db.session.add(Holiday(holiday_name=holiday_name, holiday_date=today, description='Confirmed from daily admin notification'))
        db.session.flush()
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='TODAY_HOLIDAY_CONFIRMED' if is_holiday else 'TODAY_NOT_HOLIDAY',
        module='Holiday', record_id=today_key,
        details=f'{today_key} confirmed as {holiday_name}' if is_holiday else f'{today_key} confirmed as a working day'
    )
    return jsonify({'message': 'Today’s holiday status saved.'}), 200

@audit_bp.route('/delete-requests/<int:audit_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_delete_request(audit_id):
    approval = AuditLog.query.get(audit_id)
    if not approval or approval.action not in ('DELETE_BOOK_REQUEST', 'DELETE_COPY_REQUEST', 'DELETE_STUDENT_REQUEST'):
        return jsonify({'error': 'Pending deletion request not found.'}), 404
    try:
        if approval.action == 'DELETE_BOOK_REQUEST':
            book = BookTitle.query.get(int(approval.record_id))
            if not book:
                return jsonify({'error': 'Book no longer exists.'}), 404
            if book.copies.filter_by(status='ISSUED').count() > 0:
                return jsonify({'error': 'Cannot delete a book with issued copies.'}), 400
            BookCopy.query.filter_by(book_title_id=book.book_title_id).delete()
            db.session.delete(book)
        elif approval.action == 'DELETE_COPY_REQUEST':
            copy = BookCopy.query.get(int(approval.record_id))
            if not copy:
                return jsonify({'error': 'Book copy no longer exists.'}), 404
            if copy.status == 'ISSUED':
                return jsonify({'error': 'Cannot delete an issued copy.'}), 400
            db.session.delete(copy)
        else:
            student = Student.query.get(int(approval.record_id))
            if not student:
                return jsonify({'error': 'Student no longer exists.'}), 404
            if BookIssue.query.filter(BookIssue.student_id == student.student_id, BookIssue.status.in_(['ACTIVE', 'OVERDUE'])).count() > 0:
                return jsonify({'error': 'Cannot delete a student with active book issues.'}), 400
            student.is_active = False
        approval.action = approval.action.replace('_REQUEST', '_APPROVED')
        approval.details = f'{approval.details} | Approved by {get_current_user().username}'
        db.session.commit()
        return jsonify({'message': 'Deletion approved and completed.'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Deletion could not be completed because the record has historical references.'}), 400

@audit_bp.route('/delete-requests/<int:audit_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_delete_request(audit_id):
    approval = AuditLog.query.get(audit_id)
    if not approval or approval.action not in ('DELETE_BOOK_REQUEST', 'DELETE_COPY_REQUEST', 'DELETE_STUDENT_REQUEST'):
        return jsonify({'error': 'Pending deletion request not found.'}), 404
    approval.action = approval.action.replace('_REQUEST', '_REJECTED')
    approval.details = f'{approval.details} | Rejected by {get_current_user().username}'
    db.session.commit()
    return jsonify({'message': 'Deletion request rejected.'}), 200

@audit_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_audit_logs():
    """Get recent audit logs"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_recent_logs(limit, offset)
    total = AuditLog.query.count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_user_audit_logs(user_id):
    """Get audit logs for a specific user"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_logs_by_user(user_id, limit, offset)
    total = AuditLog.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/module/<string:module>', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_module_audit_logs(module):
    """Get audit logs for a specific module"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_logs_by_module(module, limit, offset)
    total = AuditLog.query.filter_by(module=module).count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/action/<string:action>', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_action_audit_logs(action):
    """Get audit logs for a specific action"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = AuditService.get_logs_by_action(action, limit, offset)
    total = AuditLog.query.filter_by(action=action).count()
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@audit_bp.route('/search', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def search_audit_logs():
    """Search audit logs"""
    query = request.args.get('q', '')
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    if not query:
        return jsonify({'error': 'Search query required'}), 400
    
    logs = AuditService.search_logs(query, limit, offset)
    
    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'limit': limit,
        'offset': offset,
        'query': query
    }), 200

@audit_bp.route('/summary', methods=['GET'])
@jwt_required()
@permission_required('audit.view')
def get_audit_summary():
    """Get audit logs summary"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    from datetime import datetime
    start = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
    end = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None
    
    summary = AuditService.get_logs_summary(start, end)
    
    return jsonify(summary), 200

@audit_bp.route('/cleanup', methods=['POST'])
@jwt_required()
@admin_required
def cleanup_audit_logs():
    """Clean up old audit logs (Admin only)"""
    days_to_keep = request.args.get('days', 365, type=int)
    
    if days_to_keep < 30:
        return jsonify({'error': 'Cannot delete logs newer than 30 days'}), 400
    
    deleted = AuditService.cleanup_old_logs(days_to_keep)
    
    current_user = get_current_user()
    AuditLog.log_action(
        user_id=current_user.user_id,
        username=current_user.username,
        action='CLEANUP_AUDIT_LOGS',
        module='Audit',
        details=f'Deleted {deleted} logs older than {days_to_keep} days'
    )
    
    return jsonify({
        'message': f'Deleted {deleted} logs older than {days_to_keep} days',
        'deleted_count': deleted
    }), 200
