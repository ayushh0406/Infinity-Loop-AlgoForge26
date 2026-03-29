"""
Data generation and cleaning module for fintech trust scoring system.
Handles loading, cleaning, and synthetic data expansion.
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)


def load_and_clean_data(csv_path: str) -> pd.DataFrame:
    """
    Load CSV and perform data cleaning.
    
    Args:
        csv_path: Path to the input CSV file
        
    Returns:
        Cleaned DataFrame
    """
    df = pd.read_csv(csv_path)
    
    # Remove rows with invalid values
    initial_rows = len(df)
    
    # Remove negative values
    df = df[(df['bill_payment_delay_days'] >= 0)]
    df = df[(df['avg_monthly_income'] > 0)]
    df = df[(df['account_age_months'] > 0)]
    
    # Remove out-of-range rate values
    df = df[(df['upi_success_rate'] >= 0) & (df['upi_success_rate'] <= 1)]
    df = df[(df['income_volatility'] >= 0) & (df['income_volatility'] <= 1)]
    df = df[(df['essential_spend_ratio'] >= 0) & (df['essential_spend_ratio'] <= 1)]
    df = df[(df['savings_consistency'] >= 0) & (df['savings_consistency'] <= 1)]
    
    # Ensure numeric fields are properly typed
    numeric_cols = [
        'avg_monthly_income', 'income_volatility', 'upi_success_rate',
        'bill_payment_delay_days', 'monthly_repayment_cap', 'essential_spend_ratio',
        'account_age_months', 'savings_consistency', 'trust_score_target'
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    df['loan_default_history'] = df['loan_default_history'].astype(int)
    
    # Drop any rows with NaN after conversion
    df = df.dropna()
    
    # Encode user_type
    user_type_mapping = {'gig_worker': 0, 'student': 1, 'salaried': 2}
    df['user_type_encoded'] = df['user_type'].map(user_type_mapping)
    
    print(f"Original rows: {initial_rows}")
    print(f"After cleaning: {len(df)} rows")
    
    return df


def generate_synthetic_data(base_df: pd.DataFrame, target_rows: int = 300) -> pd.DataFrame:
    """
    Generate synthetic data while maintaining realistic patterns.
    
    Args:
        base_df: Base cleaned DataFrame
        target_rows: Target number of rows
        
    Returns:
        Expanded DataFrame with synthetic data
    """
    synthetic_rows = []
    
    # Get statistics by user type
    user_types = [0, 1, 2]  # gig_worker, student, salaried
    
    for _ in range(target_rows - len(base_df)):
        user_type = np.random.choice(user_types, p=[0.4, 0.3, 0.3])
        
        # Generate income based on user type
        if user_type == 0:  # gig_worker
            avg_monthly_income = np.random.normal(30000, 8000)
            income_volatility = np.random.uniform(0.35, 0.70)
        elif user_type == 1:  # student
            avg_monthly_income = np.random.normal(12000, 3000)
            income_volatility = np.random.uniform(0.55, 0.85)
        else:  # salaried
            avg_monthly_income = np.random.normal(70000, 15000)
            income_volatility = np.random.uniform(0.10, 0.25)
        
        avg_monthly_income = max(5000, avg_monthly_income)
        
        # UPI success rate (inversely related to volatility)
        upi_success_rate = np.clip(0.95 - income_volatility * 0.3, 0.65, 0.99)
        
        # Bill payment delay (higher for students, lower for salaried)
        if user_type == 1:
            bill_payment_delay_days = np.random.uniform(5, 25)
        elif user_type == 2:
            bill_payment_delay_days = np.random.uniform(0, 5)
        else:
            bill_payment_delay_days = np.random.uniform(2, 15)
        
        # Monthly repayment cap based on income
        monthly_repayment_cap = avg_monthly_income * np.random.uniform(0.1, 0.35)
        
        # Essential spend ratio (higher for students)
        if user_type == 1:
            essential_spend_ratio = np.random.uniform(0.70, 0.95)
        elif user_type == 2:
            essential_spend_ratio = np.random.uniform(0.40, 0.65)
        else:
            essential_spend_ratio = np.random.uniform(0.55, 0.80)
        
        # Account age (older for salaried, newer for students)
        if user_type == 1:
            account_age_months = np.random.uniform(3, 24)
        elif user_type == 2:
            account_age_months = np.random.uniform(24, 72)
        else:
            account_age_months = np.random.uniform(6, 48)
        
        # Loan default history (rare, but more likely for students)
        if user_type == 1:
            loan_default_history = 1 if np.random.uniform() > 0.85 else 0
        else:
            loan_default_history = 1 if np.random.uniform() > 0.95 else 0
        
        # Savings consistency
        savings_consistency = max(0.1, min(1.0, 
            0.5 + (0.5 - income_volatility) * 0.6 + 
            np.random.uniform(-0.15, 0.15)))
        
        # Calculate trust score based on features
        trust_score = calculate_trust_score(
            user_type, avg_monthly_income, income_volatility, upi_success_rate,
            bill_payment_delay_days, monthly_repayment_cap, essential_spend_ratio,
            account_age_months, loan_default_history, savings_consistency
        )
        
        synthetic_rows.append({
            'user_type': ['gig_worker', 'student', 'salaried'][user_type],
            'user_type_encoded': user_type,
            'avg_monthly_income': max(5000, avg_monthly_income),
            'income_volatility': np.clip(income_volatility, 0, 1),
            'upi_success_rate': np.clip(upi_success_rate, 0, 1),
            'bill_payment_delay_days': max(0, bill_payment_delay_days),
            'monthly_repayment_cap': max(1000, monthly_repayment_cap),
            'essential_spend_ratio': np.clip(essential_spend_ratio, 0, 1),
            'account_age_months': max(1, account_age_months),
            'loan_default_history': int(loan_default_history),
            'savings_consistency': np.clip(savings_consistency, 0, 1),
            'trust_score_target': max(0, min(100, trust_score))
        })
    
    synthetic_df = pd.DataFrame(synthetic_rows)
    
    # Prepare base_df for concatenation
    base_df_copy = base_df.copy()
    if 'user_type_encoded' not in base_df_copy.columns:
        user_type_mapping = {'gig_worker': 0, 'student': 1, 'salaried': 2}
        base_df_copy['user_type_encoded'] = base_df_copy['user_type'].map(user_type_mapping)
    
    expanded_df = pd.concat([base_df_copy, synthetic_df], ignore_index=True)
    
    return expanded_df


def calculate_trust_score(user_type, income, income_vol, upi_rate, 
                         bill_delay, repay_cap, essential_ratio, 
                         account_age, default_history, savings_cons) -> float:
    """
    Calculate trust score based on financial behavior patterns.
    
    Returns:
        Trust score (0-100)
    """
    score = 50  # base score
    
    # Income impact (higher income = higher score)
    if income > 60000:
        score += 15
    elif income > 40000:
        score += 10
    elif income > 20000:
        score += 5
    
    # Income stability (lower volatility = higher score)
    score += (1 - income_vol) * 15
    
    # UPI success rate (higher = higher score)
    score += upi_rate * 12
    
    # Bill payment behavior (lower delay = higher score)
    if bill_delay < 3:
        score += 12
    elif bill_delay < 10:
        score += 6
    elif bill_delay < 20:
        score += 2
    else:
        score -= 5
    
    # Savings consistency (higher = higher score)
    score += savings_cons * 10
    
    # Essential spend ratio (lower ratio = higher score)
    score += (1 - essential_ratio) * 8
    
    # Account age (older = higher score)
    if account_age > 36:
        score += 8
    elif account_age > 24:
        score += 5
    elif account_age > 12:
        score += 2
    
    # Default history (strong negative impact)
    if default_history == 1:
        score -= 25
    
    # Repayment capacity
    if repay_cap > 15000:
        score += 5
    
    return max(0, min(100, score))


def save_expanded_dataset(df: pd.DataFrame, output_path: str) -> None:
    """
    Save expanded dataset to CSV.
    
    Args:
        df: DataFrame to save
        output_path: Path to save CSV
    """
    df.to_csv(output_path, index=False)
    print(f"Dataset saved to {output_path} with {len(df)} rows")


def prepare_dataset(input_csv: str, output_csv: str = None) -> pd.DataFrame:
    """
    Main function to load, clean, and expand dataset.
    
    Args:
        input_csv: Path to input CSV
        output_csv: Path to save expanded CSV (optional)
        
    Returns:
        Expanded and cleaned DataFrame
    """
    # Load and clean
    df = load_and_clean_data(input_csv)
    
    # Expand synthetic data
    expanded_df = generate_synthetic_data(df, target_rows=300)
    
    # Save if output path provided
    if output_csv:
        save_expanded_dataset(expanded_df, output_csv)
    
    print(f"Final dataset size: {len(expanded_df)} rows")
    print(f"User type distribution:\n{expanded_df['user_type'].value_counts()}")
    
    return expanded_df


if __name__ == "__main__":
    # Prepare dataset
    input_path = "trust_dataset_original.csv"
    output_path = "trust_dataset_expanded.csv"
    
    df = prepare_dataset(input_path, output_path)
    print("\nDataset preparation complete!")
