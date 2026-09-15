"""
Backup Service for PlaySchool Library Management System
Generates:
1. JSON Backup (Structured, date/decimal serialized, passwords/secrets omitted)
2. SQL Backup (mysqldump, safe subprocess without shell injection)
3. Email delivery to configured admin emails via SMTP
4. Audit log recording & system setting update
"""

import os
import sys
import json
import logging
import subprocess
import smtplib
from datetime import datetime, date
from decimal import Decimal
from email.message import EmailMessage
from flask import current_app
from app import db
from app.models.user import User
from app.models.audit import AuditLog
from app.models.settings import SystemSetting

logger = logging.getLogger(__name__)

def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, bytes):
        return obj.decode('utf-8', errors='ignore')
    raise TypeError(f"Type {type(obj)} not serializable")

def get_admin_recipients():
    """Get email addresses of all active admin users plus configured admin email."""
    recipients = set()
    try:
        admins = User.query.filter_by(role='ADMIN', is_active=True).all()
        for a in admins:
            if a.email and '@' in a.email:
                recipients.add(a.email.strip())
    except Exception as e:
        logger.warning(f"Could not load admin users from database: {e}")

    # Also check environment variables / config
    configured_admin = os.getenv('ADMIN_EMAIL') or current_app.config.get('ADMIN_EMAIL')
    if configured_admin and '@' in configured_admin:
        for em in configured_admin.split(','):
            if '@' in em:
                recipients.add(em.strip())

    # Fallback to MAIL_USERNAME if no admin emails found
    if not recipients:
        mail_user = current_app.config.get('MAIL_USERNAME')
        if mail_user and '@' in mail_user:
            recipients.add(mail_user.strip())

    return sorted(list(recipients))

def generate_json_backup(output_path, initiated_by="system"):
    """
    Export all application data into structured JSON.
    Omits sensitive credentials, passwords, and secrets.
    """
    from app.models.student import Student
    from app.models.academic import AcademicYear, Programme, StudentEnrollment, GradeLevel
    from app.models.subscription import SubscriptionPlan, StudentSubscription
    from app.models.deposit import DepositAccount, DepositTransaction
    from app.models.book import BookTitle, BookCopy, BookCategory, BookLevel, LibraryCupboard, LibraryShelf
    from app.models.library import BookIssue, BookReturn, DamageLossRecord
    from app.models.settings import Holiday

    data = {
        'backup_metadata': {
            'system': 'PlaySchool / Library Management System',
            'backup_type': 'full_application_json',
            'generated_at': datetime.now().isoformat(),
            'generated_by': initiated_by,
            'version': '2.0.0'
        },
        'students': [s.to_dict() for s in Student.query.all()],
        'academic_years': [ay.to_dict() for ay in AcademicYear.query.all()],
        'programmes': [p.to_dict() for p in Programme.query.all()],
        'grade_levels': [g.to_dict() for g in GradeLevel.query.all()],
        'student_enrollments': [e.to_dict() for e in StudentEnrollment.query.all()],
        'subscription_plans': [sp.to_dict() for sp in SubscriptionPlan.query.all()],
        'student_subscriptions': [sub.to_dict() for sub in StudentSubscription.query.all()],
        'deposit_accounts': [da.to_dict() for da in DepositAccount.query.all()],
        'deposit_transactions': [dt.to_dict() for dt in DepositTransaction.query.all()],
        'book_categories': [c.to_dict() for c in BookCategory.query.all()],
        'book_levels': [l.to_dict() for l in BookLevel.query.all()],
        'library_cupboards': [cb.to_dict() for cb in LibraryCupboard.query.all()],
        'library_shelves': [sh.to_dict() for sh in LibraryShelf.query.all()],
        'book_titles': [bt.to_dict() for bt in BookTitle.query.all()],
        'book_copies': [bc.to_dict() for bc in BookCopy.query.all()],
        'book_issues': [bi.to_dict() for bi in BookIssue.query.all()],
        'book_returns': [br.to_dict() for br in BookReturn.query.all()],
        'damage_loss_records': [dlr.to_dict() for dlr in DamageLossRecord.query.all()],
        'holidays': [h.to_dict() for h in Holiday.query.all()],
        # Users exported safely without passwords, hashes, or tokens
        'users': [
            {
                'user_id': u.user_id,
                'username': u.username,
                'email': u.email,
                'role': u.role,
                'is_active': u.is_active,
                'created_at': u.created_at.isoformat() if u.created_at else None,
                'last_login': u.last_login.isoformat() if u.last_login else None
            }
            for u in User.query.all()
        ],
        # Settings exported safely without passwords or secret keys
        'system_settings': [
            s.to_dict() for s in SystemSetting.query.all()
            if not any(k in s.setting_key.lower() for k in ('password', 'secret', 'key', 'token', 'jwt', 'smtp'))
        ],
        'audit_logs': [
            {
                'audit_id': log.audit_id,
                'user_id': log.user_id,
                'username': log.username,
                'action': log.action,
                'module': log.module,
                'record_id': log.record_id,
                'details': log.details,
                'created_at': log.created_at.isoformat() if log.created_at else None
            }
            for log in AuditLog.query.order_by(AuditLog.audit_id.desc()).limit(1000).all()
        ]
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, default=_json_serial, indent=2, ensure_ascii=False)

    return output_path

def generate_sql_backup(output_path):
    """
    Generate native SQL backup using mysqldump without shell injection.
    """
    host = current_app.config.get('DB_HOST', '127.0.0.1')
    port = str(current_app.config.get('DB_PORT', '3306'))
    user = current_app.config.get('DB_USER', 'root')
    password = current_app.config.get('DB_PASSWORD', '')
    db_name = current_app.config.get('DB_NAME', 'kinder_park_library')

    # Build safe command list
    cmd = [
        "mysqldump",
        "-h", host,
        "-P", port,
        "-u", user,
        "--single-transaction",
        "--quick",
        "--add-drop-table",
        "--default-character-set=utf8mb4"
    ]

    env = os.environ.copy()
    if password:
        env["MYSQL_PWD"] = password

    cmd.append(db_name)

    with open(output_path, 'w', encoding='utf-8') as out_file:
        proc = subprocess.run(
            cmd,
            stdout=out_file,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            check=True
        )

    return output_path

def send_backup_email(json_path, sql_path, backup_dt, recipients=None):
    """
    Send the generated backups to admin email(s) via SMTP.
    Follows exact requested body and subject format.
    """
    if not recipients:
        recipients = get_admin_recipients()

    if not recipients:
        raise ValueError("No recipient admin email address found.")

    mail_server = current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
    mail_port = int(current_app.config.get('MAIL_PORT', 587))
    mail_use_tls = current_app.config.get('MAIL_USE_TLS', True)
    mail_user = current_app.config.get('MAIL_USERNAME', '')
    mail_pass = current_app.config.get('MAIL_PASSWORD', '')
    mail_sender = current_app.config.get('MAIL_DEFAULT_SENDER', mail_user or 'noreply@playschool.com')

    date_str = backup_dt.strftime('%d %b %Y')
    time_str = backup_dt.strftime('%I:%M %p')

    msg = EmailMessage()
    msg['Subject'] = f"PlaySchool LMS - Database Backup - {date_str}"
    msg['From'] = mail_sender
    msg['To'] = ", ".join(recipients)

    body_text = f"""The requested PlaySchool LMS backup has been generated successfully.

Backup Date:
{date_str}

Backup Time:
{time_str}

Attached:
* JSON Backup
* SQL Backup

Please store these files securely.

Regards,
PlaySchool LMS"""

    msg.set_content(body_text)

    # Attach JSON backup
    with open(json_path, 'rb') as f:
        msg.add_attachment(
            f.read(),
            maintype='application',
            subtype='json',
            filename=os.path.basename(json_path)
        )

    # Attach SQL backup
    with open(sql_path, 'rb') as f:
        msg.add_attachment(
            f.read(),
            maintype='application',
            subtype='sql',
            filename=os.path.basename(sql_path)
        )

    # Connect to SMTP server and send
    if mail_use_tls:
        with smtplib.SMTP(mail_server, mail_port, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if mail_user and mail_pass:
                server.login(mail_user, mail_pass)
            server.send_message(msg)
    else:
        with smtplib.SMTP(mail_server, mail_port, timeout=20) as server:
            server.ehlo()
            if mail_user and mail_pass:
                server.login(mail_user, mail_pass)
            server.send_message(msg)

    return True

def run_backup_job(user_id=None, username='system'):
    """
    Executes full backup workflow:
    1. Generates JSON backup
    2. Generates SQL backup
    3. Attempts email delivery to admin(s)
    4. Records status in AuditLog and updates SystemSetting
    5. Returns outcome dictionary with graceful error handling
    """
    now = datetime.now()
    timestamp_str = now.strftime('%Y-%m-%d_%H%M')

    # Resolve backup directory
    backup_dir = current_app.config.get('BACKUP_DIR') or 'backups'
    if not os.path.isabs(backup_dir):
        backup_dir = os.path.join(current_app.root_path, '..', backup_dir)
    os.makedirs(backup_dir, exist_ok=True)

    json_filename = f"playschool_backup_{timestamp_str}.json"
    sql_filename = f"playschool_backup_{timestamp_str}.sql"
    json_path = os.path.join(backup_dir, json_filename)
    sql_path = os.path.join(backup_dir, sql_filename)

    # 1. Generate JSON
    try:
        generate_json_backup(json_path, initiated_by=username)
        logger.info(f"JSON backup created at {json_path}")
    except Exception as e:
        logger.error(f"Failed to generate JSON backup: {e}", exc_info=True)
        return {
            'success': False,
            'message': f"Failed to generate JSON backup: {str(e)}",
            'email_sent': False
        }

    # 2. Generate SQL
    try:
        generate_sql_backup(sql_path)
        logger.info(f"SQL backup created at {sql_path}")
    except Exception as e:
        logger.error(f"Failed to generate SQL backup: {e}", exc_info=True)
        return {
            'success': False,
            'message': f"Failed to generate SQL backup: {str(e)}",
            'email_sent': False,
            'json_file': json_filename
        }

    # Update last export date setting
    try:
        last_export = SystemSetting.query.filter_by(setting_key='backup_last_export_date').first()
        if not last_export:
            last_export = SystemSetting(
                setting_key='backup_last_export_date',
                setting_value=now.date().isoformat(),
                data_type='STRING',
                category='Backup',
                description='Date of the last generated backup'
            )
            db.session.add(last_export)
        else:
            last_export.setting_value = now.date().isoformat()
        db.session.commit()
    except Exception as e:
        logger.warning(f"Failed to update backup_last_export_date setting: {e}")

    # 3. Attempt email delivery
    recipients = get_admin_recipients()
    email_sent = False
    email_error = None

    try:
        send_backup_email(json_path, sql_path, now, recipients=recipients)
        email_sent = True
        logger.info(f"Backup successfully emailed to {recipients}")
    except Exception as e:
        email_error = str(e)
        logger.error(f"Failed to email backup to {recipients}: {e}", exc_info=True)

    # 4. Record Audit Log
    try:
        if email_sent:
            details = f"Backup created ({json_filename}, {sql_filename}) and emailed to: {', '.join(recipients)}"
            action = 'BACKUP_SUCCESS'
        else:
            details = f"Backup created ({json_filename}, {sql_filename}), but email failed: {email_error}"
            action = 'BACKUP_EMAIL_FAILED'

        AuditLog.log_action(
            user_id=user_id,
            username=username,
            action=action,
            module='Backup',
            record_id=timestamp_str,
            details=details
        )
    except Exception as e:
        logger.warning(f"Could not record audit log for backup: {e}")

    # 5. Return result
    if email_sent:
        return {
            'success': True,
            'email_sent': True,
            'message': 'Backup completed successfully and sent to admin email.',
            'recipients': recipients,
            'json_file': json_filename,
            'sql_file': sql_filename,
            'backup_date': now.strftime('%d %b %Y'),
            'backup_time': now.strftime('%I:%M %p')
        }
    else:
        return {
            'success': True,
            'email_sent': False,
            'message': 'Backup generated successfully, but email delivery failed.',
            'email_error': 'Email delivery could not be completed. The backup files are saved on the server.',
            'recipients': recipients,
            'json_file': json_filename,
            'sql_file': sql_filename,
            'backup_date': now.strftime('%d %b %Y'),
            'backup_time': now.strftime('%I:%M %p')
        }
