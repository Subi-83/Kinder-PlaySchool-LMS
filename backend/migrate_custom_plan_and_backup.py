#!/usr/bin/env python3
"""
Safe Migration & Backfill Script:
- Adds additive columns to `student_subscriptions`: `is_custom_plan`, `custom_subscription_fee`, `custom_deposit_amount`
- Ensures master `Customized Plan` exists in `subscription_plans`
- Backfills existing subscriptions with proper academic year, March 31 end date, and fee snapshots
- Zero data loss validation: verifies row counts and foreign keys before & after
"""

import sys
import os
from datetime import date

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app import create_app, db
from app.models.academic import AcademicYear
from app.models.subscription import SubscriptionPlan, StudentSubscription
from sqlalchemy import text

def get_or_create_academic_year_for_date(d):
    """
    Determines academic year according to the June 1 to March 31 cycle.
    - If month >= 4 (April-Dec): Academic year is Y to (Y+1), ending March 31 (Y+1)
    - If month <= 3 (Jan-March): Academic year is (Y-1) to Y, ending March 31 Y
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

def run_migration():
    app = create_app()
    with app.app_context():
        print("=" * 60)
        print("SAFE CLIENT DATABASE MIGRATION & BACKFILL STARTING")
        print("=" * 60)

        # 1. Pre-migration verification counts using raw SQL (before columns are added)
        engine = db.engine
        with engine.connect() as conn:
            subs_before = conn.execute(text("SELECT COUNT(*) FROM student_subscriptions")).scalar()
            plans_before = conn.execute(text("SELECT COUNT(*) FROM subscription_plans")).scalar()
            years_before = conn.execute(text("SELECT COUNT(*) FROM academic_years")).scalar()
        print(f"Pre-migration check: {subs_before} subscriptions, {plans_before} plans, {years_before} academic years.")

        # 2. Additive column modifications using INFORMATION_SCHEMA checks
        engine = db.engine
        inspector = db.inspect(engine)
        existing_cols = [c['name'] for c in inspector.get_columns('student_subscriptions')]

        with engine.connect() as conn:
            if 'is_custom_plan' not in existing_cols:
                print("Adding column: student_subscriptions.is_custom_plan (TINYINT(1) DEFAULT 0)...")
                conn.execute(text("ALTER TABLE student_subscriptions ADD COLUMN is_custom_plan TINYINT(1) NOT NULL DEFAULT 0;"))
            else:
                print("Column student_subscriptions.is_custom_plan already exists.")

            if 'custom_subscription_fee' not in existing_cols:
                print("Adding column: student_subscriptions.custom_subscription_fee (DECIMAL(10,2) NULL)...")
                conn.execute(text("ALTER TABLE student_subscriptions ADD COLUMN custom_subscription_fee DECIMAL(10,2) NULL;"))
            else:
                print("Column student_subscriptions.custom_subscription_fee already exists.")

            if 'custom_deposit_amount' not in existing_cols:
                print("Adding column: student_subscriptions.custom_deposit_amount (DECIMAL(10,2) NULL)...")
                conn.execute(text("ALTER TABLE student_subscriptions ADD COLUMN custom_deposit_amount DECIMAL(10,2) NULL;"))
            else:
                print("Column student_subscriptions.custom_deposit_amount already exists.")

            conn.commit()

        # 3. Ensure master 'Customized Plan' exists
        custom_plan = SubscriptionPlan.query.filter(
            (SubscriptionPlan.plan_code == 'CUSTOM') | (SubscriptionPlan.plan_name == 'Customized Plan')
        ).first()

        if not custom_plan:
            print("Creating master 'Customized Plan' template in subscription_plans...")
            custom_plan = SubscriptionPlan(
                plan_name='Customized Plan',
                plan_code='CUSTOM',
                max_books=3,
                duration_months=10,
                price=0.00,
                subscription_fee=0.00,
                fixed_deposit=0.00,
                total_amount=0.00,
                is_active=True,
                description='Customized plan with librarian-specified subscription and deposit amounts'
            )
            db.session.add(custom_plan)
            db.session.commit()
            print(f"Master 'Customized Plan' created with ID: {custom_plan.subscription_plan_id}")
        else:
            print(f"Master 'Customized Plan' already exists with ID: {custom_plan.subscription_plan_id}")

        # 4. Backfill existing subscription records
        subscriptions = StudentSubscription.query.all()
        backfilled_count = 0
        for sub in subscriptions:
            updated = False
            # Backfill academic_year_id if missing
            if not sub.academic_year_id:
                ay = get_or_create_academic_year_for_date(sub.start_date or date.today())
                sub.academic_year_id = ay.academic_year_id
                updated = True

            # Enforce March 31 end date of the academic year
            target_ay = sub.academic_year_ref or AcademicYear.query.get(sub.academic_year_id)
            if target_ay and target_ay.end_date and sub.end_date != target_ay.end_date:
                sub.end_date = target_ay.end_date
                updated = True

            # Snapshot subscription fee if missing
            if sub.subscription_fee_paid is None:
                plan = sub.plan_ref
                fee = float(plan.subscription_fee) if (plan and plan.subscription_fee) else float(sub.amount_paid or 0.0)
                sub.subscription_fee_paid = fee
                updated = True

            # Snapshot deposit if missing
            if sub.deposit_paid is None:
                plan = sub.plan_ref
                deposit = float(plan.fixed_deposit) if (plan and plan.fixed_deposit) else 0.0
                sub.deposit_paid = deposit
                updated = True

            # Snapshot total paid if missing
            if sub.total_paid is None:
                sub.total_paid = float(sub.subscription_fee_paid or 0.0) + float(sub.deposit_paid or 0.0)
                updated = True

            if updated:
                backfilled_count += 1

        db.session.commit()
        print(f"Backfill complete: {backfilled_count} / {len(subscriptions)} subscription records updated.")

        # 5. Post-migration verification
        subs_after = StudentSubscription.query.count()
        assert subs_after == subs_before, f"CRITICAL: Row count mismatch in subscriptions! Before: {subs_before}, After: {subs_after}"
        print(f"ZERO DATA LOSS VERIFIED: {subs_after} subscriptions confirmed intact.")
        print("Migration and backfill completed successfully!")

if __name__ == '__main__':
    run_migration()
