"""
TrustPool AI — Seed Users
Run: python seed_users.py
Populates MongoDB with demo users for hackathon presentation.
OTP for all users: 9876
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

USERS = [
    # LENDERS — start with ₹10,000 wallet
    {
        "name": "Ramesh Verma",
        "email": "ramesh@trustpool.ai",
        "password": "Trustpool@123",
        "role": "lender",
        "pan": "ABCPV7890K",
        "aadhaar": "987612345678",
        "otp": "9876"
    },
    {
        "name": "Sunita Sharma",
        "email": "sunita@trustpool.ai",
        "password": "Trustpool@123",
        "role": "lender",
        "pan": "FGHSS4321M",
        "aadhaar": "543298761234",
        "otp": "9876"
    },
    {
        "name": "Vikram Mehra",
        "email": "vikram@trustpool.ai",
        "password": "Trustpool@123",
        "role": "lender",
        "pan": "LMNVM9876T",
        "aadhaar": "112233445566",
        "otp": "9876"
    },
    # BORROWERS — start with ₹0 wallet
    {
        "name": "Priya Kumari",
        "email": "priya@trustpool.ai",
        "password": "Trustpool@123",
        "role": "borrower",
        "pan": "QRSPK1234A",
        "aadhaar": "667788990011",
        "otp": "9876"
    },
    {
        "name": "Arjun Singh",
        "email": "arjun@trustpool.ai",
        "password": "Trustpool@123",
        "role": "borrower",
        "pan": "UVWAS5678Z",
        "aadhaar": "223344556677",
        "otp": "9876"
    },
]

def register_user(user):
    print(f"\n--- Registering {user['name']} ({user['role']}) ---")
    
    # Step 1: Register basic account
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": user["name"],
        "email": user["email"],
        "password": user["password"],
        "role": user["role"]
    })
    if resp.status_code not in (200, 201):
        print(f"  ❌ Registration failed: {resp.text}")
        return
    
    fabric_id = resp.json().get("fabricId")
    print(f"  ✅ Registered — fabricId: {fabric_id}")

    # Step 2: Initiate PAN verification
    resp = requests.post(f"{BASE_URL}/kyc/initiate-pan", json={"pan": user["pan"]})
    ref_id = resp.json().get("referenceId")
    print(f"  ✅ PAN OTP sent — refId: {ref_id}")

    # Step 3: Verify PAN OTP
    resp = requests.post(f"{BASE_URL}/kyc/verify-pan", json={"otp": user["otp"], "referenceId": ref_id})
    print(f"  ✅ PAN Verified — {resp.json().get('msg')}")

    # Step 4: Initiate Aadhaar verification
    resp = requests.post(f"{BASE_URL}/kyc/initiate-aadhaar", json={"aadhaar": user["aadhaar"]})
    ref_id = resp.json().get("referenceId")
    print(f"  ✅ Aadhaar OTP sent — refId: {ref_id}")

    # Step 5: Verify Aadhaar OTP
    resp = requests.post(f"{BASE_URL}/kyc/verify-aadhaar", json={"otp": user["otp"], "referenceId": ref_id})
    print(f"  ✅ Aadhaar Verified — {resp.json().get('msg')}")

    print(f"  🎉 {user['name']} fully seeded into TrustPool!\n")


if __name__ == "__main__":
    print("\n========================================")
    print("  TrustPool AI — Demo User Seeder")
    print("========================================\n")
    for user in USERS:
        register_user(user)
    print("\n✅ All 5 users seeded successfully!")
    print("  3 Lenders (wallet: ₹10,000), 2 Borrowers (wallet: ₹0)")
    print("  OTP for all: 9876\n")
