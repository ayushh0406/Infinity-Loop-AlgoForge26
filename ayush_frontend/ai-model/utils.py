"""
Utility functions for fintech trust scoring system.
"""

import numpy as np
from typing import Dict, List, Any


def determine_loan_eligibility(trust_score: float) -> Dict[str, Any]:
    """
    Determine loan eligibility based on trust score.
    
    Args:
        trust_score: Score from 0-100
        
    Returns:
        Dictionary with loan_amount and interest_rate
    """
    if trust_score >= 80:
        return {
            'loan_amount': 50000,
            'interest_rate': 9.0,
            'eligibility': 'APPROVED_HIGH'
        }
    elif trust_score >= 65:
        return {
            'loan_amount': 20000,
            'interest_rate': 11.5,
            'eligibility': 'APPROVED_MEDIUM'
        }
    elif trust_score >= 50:
        return {
            'loan_amount': 5000,
            'interest_rate': 14.0,
            'eligibility': 'APPROVED_LOW'
        }
    else:
        return {
            'loan_amount': 0,
            'interest_rate': 0,
            'eligibility': 'REJECTED'
        }


def format_impact_value(impact: float) -> str:
    """
    Format impact value with +/- sign.
    
    Args:
        impact: Impact value
        
    Returns:
        Formatted string with sign
    """
    if impact > 0:
        return f"+{impact:.2f}"
    else:
        return f"{impact:.2f}"


def validate_user_data(data: Dict[str, Any]) -> tuple[bool, str]:
    """
    Validate user input data.
    
    Args:
        data: User data dictionary
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    required_fields = [
        'user_type', 'avg_monthly_income', 'income_volatility',
        'upi_success_rate', 'bill_payment_delay_days',
        'monthly_repayment_cap', 'essential_spend_ratio',
        'account_age_months', 'loan_default_history',
        'savings_consistency'
    ]
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate user_type
    if data['user_type'] not in ['gig_worker', 'student', 'salaried']:
        return False, f"Invalid user_type: {data['user_type']}"
    
    # Validate numeric ranges
    constraints = {
        'avg_monthly_income': (1000, 500000),
        'income_volatility': (0, 1),
        'upi_success_rate': (0, 1),
        'bill_payment_delay_days': (0, 365),
        'monthly_repayment_cap': (100, 200000),
        'essential_spend_ratio': (0, 1),
        'account_age_months': (0, 600),
        'savings_consistency': (0, 1)
    }
    
    for field, (min_val, max_val) in constraints.items():
        try:
            value = float(data[field])
            if value < min_val or value > max_val:
                return False, f"{field} must be between {min_val} and {max_val}, got {value}"
        except (ValueError, TypeError):
            return False, f"{field} must be a number"
    
    # Validate loan_default_history
    if data['loan_default_history'] not in [0, 1]:
        return False, "loan_default_history must be 0 or 1"
    
    return True, "Valid"


def encode_user_type(user_type: str) -> int:
    """
    Encode user_type to numeric value.
    
    Args:
        user_type: User type string
        
    Returns:
        Encoded value
    """
    mapping = {'gig_worker': 0, 'student': 1, 'salaried': 2}
    return mapping.get(user_type, -1)


def prepare_features_for_model(data: Dict[str, Any]) -> np.ndarray:
    """
    Prepare features for model prediction.
    
    Args:
        data: User data dictionary
        
    Returns:
        Feature array for model
    """
    feature_order = [
        'avg_monthly_income', 'income_volatility', 'upi_success_rate',
        'bill_payment_delay_days', 'monthly_repayment_cap',
        'essential_spend_ratio', 'account_age_months',
        'loan_default_history', 'savings_consistency', 'user_type_encoded'
    ]
    
    # Create a copy and add encoded user type
    data_copy = data.copy()
    data_copy['user_type_encoded'] = encode_user_type(data['user_type'])
    
    # Create feature array
    features = np.array([data_copy[field] for field in feature_order], dtype=np.float32).reshape(1, -1)
    
    return features


def get_feature_names() -> List[str]:
    """
    Get list of feature names in correct order.
    
    Returns:
        List of feature names
    """
    return [
        'avg_monthly_income', 'income_volatility', 'upi_success_rate',
        'bill_payment_delay_days', 'monthly_repayment_cap',
        'essential_spend_ratio', 'account_age_months',
        'loan_default_history', 'savings_consistency', 'user_type_encoded'
    ]


def round_to_nearest_thousand(amount: float) -> int:
    """
    Round amount to nearest thousand.
    
    Args:
        amount: Amount to round
        
    Returns:
        Rounded amount
    """
    return int(round(amount / 1000) * 1000)


def calculate_monthly_emi(principal: float, annual_rate: float, months: int = 12) -> float:
    """
    Calculate monthly EMI (Equated Monthly Installment).
    
    Args:
        principal: Loan amount
        annual_rate: Annual interest rate (percentage)
        months: Loan duration in months
        
    Returns:
        Monthly EMI amount
    """
    if annual_rate == 0:
        return principal / months
    
    monthly_rate = annual_rate / 100 / 12
    emi = principal * (monthly_rate * (1 + monthly_rate) ** months) / \
          ((1 + monthly_rate) ** months - 1)
    
    return emi


if __name__ == "__main__":
    # Test utilities
    print("Testing utilities...")
    
    # Test loan eligibility
    print("\nLoan Eligibility:")
    for score in [90, 75, 55, 40]:
        result = determine_loan_eligibility(score)
        print(f"Score {score}: {result}")
    
    # Test validation
    test_data = {
        'user_type': 'salaried',
        'avg_monthly_income': 60000,
        'income_volatility': 0.15,
        'upi_success_rate': 0.95,
        'bill_payment_delay_days': 2,
        'monthly_repayment_cap': 15000,
        'essential_spend_ratio': 0.55,
        'account_age_months': 36,
        'loan_default_history': 0,
        'savings_consistency': 0.8
    }
    
    is_valid, message = validate_user_data(test_data)
    print(f"\nValidation: {is_valid} - {message}")
    
    # Test feature preparation
    features = prepare_features_for_model(test_data)
    print(f"\nFeatures shape: {features.shape}")
    print(f"Features: {features}")
