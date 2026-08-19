"""
Generate correct bcrypt hashes for admin and staff
"""
import bcrypt

print("=" * 60)
print("🔑 Generating Correct Password Hashes")
print("=" * 60)

# Generate admin hash
admin_password = 'admin123'
admin_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"\nAdmin Password: {admin_password}")
print(f"Admin Hash: {admin_hash}")

# Generate staff hash
staff_password = 'staff123'
staff_hash = bcrypt.hashpw(staff_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"\nStaff Password: {staff_password}")
print(f"Staff Hash: {staff_hash}")

# Verify the hashes work
print("\n📌 Verifying hashes...")
admin_verify = bcrypt.checkpw(admin_password.encode('utf-8'), admin_hash.encode('utf-8'))
staff_verify = bcrypt.checkpw(staff_password.encode('utf-8'), staff_hash.encode('utf-8'))
print(f"Admin hash verification: {'✅ PASSED' if admin_verify else '❌ FAILED'}")
print(f"Staff hash verification: {'✅ PASSED' if staff_verify else '❌ FAILED'}")

print("\n" + "=" * 60)
print("📌 Copy these hashes to update your database:")
print(f"Admin: {admin_hash}")
print(f"Staff: {staff_hash}")
print("=" * 60)