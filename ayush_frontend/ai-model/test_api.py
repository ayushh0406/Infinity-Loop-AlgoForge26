#!/usr/bin/env python3
"""
API Endpoint Testing Script
Tests all endpoints and provides comprehensive verification
"""

import requests
import json
from typing import Dict, Any
import time

# API Base URL
API_URL = "http://localhost:8000"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.END}")

def print_json(data):
    print(json.dumps(data, indent=2))

def test_health_check():
    """Test health check endpoint"""
    print_header("HEALTH CHECK")
    
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_success("Health check passed")
            print_info(f"Status: {data['status']}")
            print_info(f"Model Status: {data['model_status']}")
            print_info(f"Version: {data['version']}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to API. Make sure the server is running!")
        print_info("Start the server with: python -m uvicorn main:app --reload")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_score_calculation(test_case_name: str, user_data: Dict[str, Any]):
    """Test score calculation endpoint"""
    print_header(f"SCORE CALCULATION: {test_case_name}")
    
    try:
        response = requests.post(f"{API_URL}/api/score", json=user_data)
        
        if response.status_code == 200:
            data = response.json()
            print_success("Score calculated successfully")
            print_info(f"Trust Score: {data['trust_score']}")
            print_info(f"Loan Amount: ₹{data['loan_amount']:,}")
            print_info(f"Interest Rate: {data['interest_rate']}%")
            print_info(f"Monthly EMI: ₹{data['monthly_emi']:,}")
            print_info(f"Eligibility: {data['eligibility_status']}")
            print_info("Top 5 Impact Factors:")
            for i, feature in enumerate(data['breakdown'], 1):
                print(f"  {i}. {feature['feature']}: {feature['impact']} (value: {feature['value']})")
            return True, data
        else:
            print_error(f"Score calculation failed with status {response.status_code}")
            if response.text:
                print_error(f"Response: {response.text}")
            return False, None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False, None

def test_batch_scoring():
    """Test batch scoring endpoint"""
    print_header("BATCH SCORING")
    
    batch_data = [
        {
            "user_type": "salaried",
            "avg_monthly_income": 95000,
            "income_volatility": 0.08,
            "upi_success_rate": 0.99,
            "bill_payment_delay_days": 0,
            "monthly_repayment_cap": 25000,
            "essential_spend_ratio": 0.42,
            "account_age_months": 72,
            "loan_default_history": 0,
            "savings_consistency": 0.88
        },
        {
            "user_type": "gig_worker",
            "avg_monthly_income": 35000,
            "income_volatility": 0.38,
            "upi_success_rate": 0.92,
            "bill_payment_delay_days": 5,
            "monthly_repayment_cap": 9000,
            "essential_spend_ratio": 0.62,
            "account_age_months": 24,
            "loan_default_history": 0,
            "savings_consistency": 0.48
        },
        {
            "user_type": "student",
            "avg_monthly_income": 10000,
            "income_volatility": 0.72,
            "upi_success_rate": 0.75,
            "bill_payment_delay_days": 15,
            "monthly_repayment_cap": 2500,
            "essential_spend_ratio": 0.85,
            "account_age_months": 6,
            "loan_default_history": 0,
            "savings_consistency": 0.15
        }
    ]
    
    try:
        response = requests.post(f"{API_URL}/api/batch-score", json=batch_data)
        
        if response.status_code == 200:
            data = response.json()
            print_success("Batch scoring completed successfully")
            print_info(f"Total Processed: {data['total_processed']}")
            print_info(f"Successful: {data['successful']}")
            print_info(f"Failed: {data['failed']}")
            
            for result in data['results']:
                idx = result['index']
                score = result['trust_score']
                eligibility = result['eligibility']
                print(f"  [{idx}] Score: {score}, Eligibility: {eligibility}")
            
            return True
        else:
            print_error(f"Batch scoring failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_model_info():
    """Test model info endpoint"""
    print_header("MODEL INFORMATION")
    
    try:
        response = requests.get(f"{API_URL}/api/model-info")
        
        if response.status_code == 200:
            data = response.json()
            print_success("Model info retrieved successfully")
            print_info(f"Model Type: {data['model_type']}")
            print_info(f"Estimators: {data['n_estimators']}")
            print_info(f"Max Depth: {data['max_depth']}")
            print_info(f"Learning Rate: {data['learning_rate']}")
            print_info(f"Features: {data['feature_count']}")
            print_info("Top 10 Important Features:")
            for item in data['top_10_important_features'][:10]:
                print(f"  - {item['Feature']}: {item['Importance']}")
            return True
        else:
            print_error(f"Model info retrieval failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_eligibility_rules():
    """Test eligibility rules endpoint"""
    print_header("ELIGIBILITY RULES")
    
    try:
        response = requests.get(f"{API_URL}/api/eligibility-rules")
        
        if response.status_code == 200:
            data = response.json()
            print_success("Eligibility rules retrieved successfully")
            
            for rule in data['rules']:
                print(f"\n{Colors.YELLOW}Score Range: {rule['score_range']}{Colors.END}")
                print(f"  Status: {rule['eligibility']}")
                print(f"  Loan Amount: ₹{rule['loan_amount']:,}")
                print(f"  Interest Rate: {rule['interest_rate']}%")
                print(f"  Description: {rule['description']}")
            
            return True
        else:
            print_error(f"Eligibility rules retrieval failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_edge_cases():
    """Test edge cases and input validation"""
    print_header("EDGE CASES & VALIDATION")
    
    # Test case 1: Missing required field
    print_info("Test 1: Missing required field")
    invalid_data = {
        "user_type": "salaried",
        "avg_monthly_income": 65000
        # Missing other fields
    }
    try:
        response = requests.post(f"{API_URL}/api/score", json=invalid_data)
        if response.status_code != 200:
            print_success("Correctly rejected incomplete data")
        else:
            print_error("Should have rejected incomplete data")
    except Exception as e:
        print_error(f"Error: {str(e)}")
    
    # Test case 2: Invalid user type
    print_info("Test 2: Invalid user type")
    invalid_data = {
        "user_type": "invalid_type",
        "avg_monthly_income": 65000,
        "income_volatility": 0.15,
        "upi_success_rate": 0.95,
        "bill_payment_delay_days": 2,
        "monthly_repayment_cap": 15000,
        "essential_spend_ratio": 0.55,
        "account_age_months": 36,
        "loan_default_history": 0,
        "savings_consistency": 0.8
    }
    try:
        response = requests.post(f"{API_URL}/api/score", json=invalid_data)
        if response.status_code != 200:
            print_success("Correctly rejected invalid user type")
        else:
            print_error("Should have rejected invalid user type")
    except Exception as e:
        print_error(f"Error: {str(e)}")
    
    # Test case 3: Out of range values
    print_info("Test 3: Out of range values")
    invalid_data = {
        "user_type": "salaried",
        "avg_monthly_income": 65000,
        "income_volatility": 1.5,  # Should be 0-1
        "upi_success_rate": 0.95,
        "bill_payment_delay_days": 2,
        "monthly_repayment_cap": 15000,
        "essential_spend_ratio": 0.55,
        "account_age_months": 36,
        "loan_default_history": 0,
        "savings_consistency": 0.8
    }
    try:
        response = requests.post(f"{API_URL}/api/score", json=invalid_data)
        if response.status_code != 200:
            print_success("Correctly rejected out-of-range values")
        else:
            print_error("Should have rejected out-of-range values")
    except Exception as e:
        print_error(f"Error: {str(e)}")

def run_all_tests():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}╔{'='*58}╗{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}║ FINTECH TRUST SCORE API - COMPREHENSIVE TEST SUITE ║{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}╚{'='*58}╝{Colors.END}\n")
    
    results = {}
    
    # Test 1: Health Check
    results['health_check'] = test_health_check()
    
    if not results['health_check']:
        print_error("Cannot proceed with tests. API server is not running.")
        return results
    
    time.sleep(1)
    
    # Test 2-4: Score Calculation with different scenarios
    salaried_user = {
        "user_type": "salaried",
        "avg_monthly_income": 95000,
        "income_volatility": 0.08,
        "upi_success_rate": 0.99,
        "bill_payment_delay_days": 0,
        "monthly_repayment_cap": 25000,
        "essential_spend_ratio": 0.42,
        "account_age_months": 72,
        "loan_default_history": 0,
        "savings_consistency": 0.88
    }
    
    gig_worker = {
        "user_type": "gig_worker",
        "avg_monthly_income": 35000,
        "income_volatility": 0.38,
        "upi_success_rate": 0.92,
        "bill_payment_delay_days": 5,
        "monthly_repayment_cap": 9000,
        "essential_spend_ratio": 0.62,
        "account_age_months": 24,
        "loan_default_history": 0,
        "savings_consistency": 0.48
    }
    
    student = {
        "user_type": "student",
        "avg_monthly_income": 10000,
        "income_volatility": 0.72,
        "upi_success_rate": 0.75,
        "bill_payment_delay_days": 15,
        "monthly_repayment_cap": 2500,
        "essential_spend_ratio": 0.85,
        "account_age_months": 6,
        "loan_default_history": 0,
        "savings_consistency": 0.15
    }
    
    success, _ = test_score_calculation("Salaried Employee (High Trust)", salaried_user)
    results['score_salaried'] = success
    time.sleep(0.5)
    
    success, _ = test_score_calculation("Gig Worker (Medium Trust)", gig_worker)
    results['score_gig'] = success
    time.sleep(0.5)
    
    success, _ = test_score_calculation("Student (Low Trust)", student)
    results['score_student'] = success
    time.sleep(0.5)
    
    # Test 5: Batch Scoring
    results['batch_scoring'] = test_batch_scoring()
    time.sleep(0.5)
    
    # Test 6: Model Info
    results['model_info'] = test_model_info()
    time.sleep(0.5)
    
    # Test 7: Eligibility Rules
    results['eligibility_rules'] = test_eligibility_rules()
    time.sleep(0.5)
    
    # Test 8: Edge Cases
    test_edge_cases()
    
    # Summary
    print_header("TEST SUMMARY")
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    print(f"Total Tests: {total_tests}")
    print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.END}")
    print(f"{Colors.RED}Failed: {total_tests - passed_tests}{Colors.END}")
    
    if passed_tests == total_tests:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED!{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠ SOME TESTS FAILED{Colors.END}")
    
    return results

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
    except Exception as e:
        print(f"{Colors.RED}Unexpected error: {str(e)}{Colors.END}")
