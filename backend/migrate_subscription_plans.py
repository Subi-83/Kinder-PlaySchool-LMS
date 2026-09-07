from app import create_app, db
from sqlalchemy import text, inspect

def run_migration():
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        
        # 1. Update subscription_plans table
        existing_sub_cols = [c['name'] for c in inspector.get_columns('subscription_plans')]
        print("Existing columns in subscription_plans:", existing_sub_cols)
        
        if 'subscription_fee' not in existing_sub_cols:
            print("Adding subscription_fee to subscription_plans...")
            db.session.execute(text("ALTER TABLE subscription_plans ADD COLUMN subscription_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00"))
        
        if 'fixed_deposit' not in existing_sub_cols:
            print("Adding fixed_deposit to subscription_plans...")
            db.session.execute(text("ALTER TABLE subscription_plans ADD COLUMN fixed_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0.00"))
            
        if 'total_amount' not in existing_sub_cols:
            print("Adding total_amount to subscription_plans...")
            db.session.execute(text("ALTER TABLE subscription_plans ADD COLUMN total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00"))
            
        # 2. Update student_subscriptions table
        existing_stu_sub_cols = [c['name'] for c in inspector.get_columns('student_subscriptions')]
        print("Existing columns in student_subscriptions:", existing_stu_sub_cols)
        
        if 'subscription_fee_paid' not in existing_stu_sub_cols:
            print("Adding subscription_fee_paid to student_subscriptions...")
            db.session.execute(text("ALTER TABLE student_subscriptions ADD COLUMN subscription_fee_paid DECIMAL(10, 2) NULL"))
            
        if 'deposit_paid' not in existing_stu_sub_cols:
            print("Adding deposit_paid to student_subscriptions...")
            db.session.execute(text("ALTER TABLE student_subscriptions ADD COLUMN deposit_paid DECIMAL(10, 2) NULL"))
            
        if 'total_paid' not in existing_stu_sub_cols:
            print("Adding total_paid to student_subscriptions...")
            db.session.execute(text("ALTER TABLE student_subscriptions ADD COLUMN total_paid DECIMAL(10, 2) NULL"))

        # 3. Update deposit_transactions table transaction_type to VARCHAR(50)
        print("Altering deposit_transactions.transaction_type to VARCHAR(50)...")
        db.session.execute(text("ALTER TABLE deposit_transactions MODIFY COLUMN transaction_type VARCHAR(50) NOT NULL"))

        db.session.commit()
        print("Schema changes committed successfully.")

        # 4. Seed / update standard initial plans: Caterpillar, Butterfly, Annual
        # PLAN 1: Caterpillar, Fee ₹500, Deposit ₹1500, Total ₹2000, 3 months
        # PLAN 2: Butterfly, Fee ₹1000, Deposit ₹1500, Total ₹2500, 6 months
        # PLAN 3: Annual, Fee ₹1500, Deposit ₹1500, Total ₹3000, 12 months
        plans_config = [
            {
                'name': 'Caterpillar',
                'aliases': ['caterpiller', 'caterpillar'],
                'code': 'CAT',
                'fee': 500.00,
                'deposit': 1500.00,
                'total': 2000.00,
                'duration': 3,
                'max_books': 1,
                'description': 'Caterpillar plan: 1 book, 3 months duration'
            },
            {
                'name': 'Butterfly',
                'aliases': ['butterfly'],
                'code': 'BUT',
                'fee': 1000.00,
                'deposit': 1500.00,
                'total': 2500.00,
                'duration': 6,
                'max_books': 2,
                'description': 'Butterfly plan: 2 books, 6 months duration'
            },
            {
                'name': 'Annual',
                'aliases': ['annual'],
                'code': 'ANN',
                'fee': 1500.00,
                'deposit': 1500.00,
                'total': 3000.00,
                'duration': 12,
                'max_books': 3,
                'description': 'Annual plan: 3 books, 12 months duration'
            }
        ]

        from app.models.subscription import SubscriptionPlan

        for cfg in plans_config:
            # Look up by alias or code
            existing = SubscriptionPlan.query.filter(
                db.or_(
                    SubscriptionPlan.plan_name.in_(cfg['aliases']),
                    SubscriptionPlan.plan_name == cfg['name'],
                    SubscriptionPlan.plan_code == cfg['code']
                )
            ).first()

            if existing:
                print(f"Updating plan {existing.plan_name} -> {cfg['name']}...")
                existing.plan_name = cfg['name']
                existing.plan_code = cfg['code']
                existing.subscription_fee = cfg['fee']
                existing.fixed_deposit = cfg['deposit']
                existing.total_amount = cfg['total']
                existing.price = cfg['total']
                existing.duration_months = cfg['duration']
                existing.max_books = cfg['max_books']
                existing.is_active = True
                if not existing.description:
                    existing.description = cfg['description']
            else:
                print(f"Creating plan {cfg['name']}...")
                new_plan = SubscriptionPlan(
                    plan_name=cfg['name'],
                    plan_code=cfg['code'],
                    subscription_fee=cfg['fee'],
                    fixed_deposit=cfg['deposit'],
                    total_amount=cfg['total'],
                    price=cfg['total'],
                    duration_months=cfg['duration'],
                    max_books=cfg['max_books'],
                    description=cfg['description'],
                    is_active=True
                )
                db.session.add(new_plan)

        db.session.commit()
        print("Initial plans seeded/updated successfully.")

        # Backfill any other plans if present
        all_plans = SubscriptionPlan.query.all()
        for p in all_plans:
            if float(p.total_amount or 0) == 0 and float(p.price or 0) > 0:
                p.total_amount = p.price
                p.subscription_fee = p.price
                p.fixed_deposit = 0.00
        db.session.commit()

        # Print all plans to verify
        print("\nAll Subscription Plans:")
        for p in SubscriptionPlan.query.all():
            print(f"- ID {p.subscription_plan_id}: {p.plan_name} ({p.plan_code}) | Fee: ₹{p.subscription_fee} | Deposit: ₹{p.fixed_deposit} | Total: ₹{p.total_amount} | Duration: {p.duration_months}m")

if __name__ == '__main__':
    run_migration()

