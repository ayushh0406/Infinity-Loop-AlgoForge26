"""
Machine learning model for fintech trust scoring.
Uses XGBoost with SHAP for explainability.
"""

import xgboost as xgb
import shap
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, List, Tuple, Any
import pickle
from pathlib import Path


class TrustScoreModel:
    """XGBoost-based trust score prediction model with SHAP explainability."""
    
    def __init__(self):
        """Initialize the model."""
        self.model = None
        self.explainer = None
        self.feature_names = [
            'avg_monthly_income', 'income_volatility', 'upi_success_rate',
            'bill_payment_delay_days', 'monthly_repayment_cap',
            'essential_spend_ratio', 'account_age_months',
            'loan_default_history', 'savings_consistency', 'user_type_encoded'
        ]
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare features and target from DataFrame.
        
        Args:
            df: Input DataFrame
            
        Returns:
            Tuple of (X, y) arrays
        """
        # Ensure user_type_encoded exists
        if 'user_type_encoded' not in df.columns:
            user_type_mapping = {'gig_worker': 0, 'student': 1, 'salaried': 2}
            df['user_type_encoded'] = df['user_type'].map(user_type_mapping)
        
        # Select features
        X = df[self.feature_names].values.astype(np.float32)
        
        # Target variable
        y = df['trust_score_target'].values.astype(np.float32)
        
        return X, y
    
    def train(self, df: pd.DataFrame, test_size: float = 0.2) -> Dict[str, float]:
        """
        Train XGBoost model.
        
        Args:
            df: Training DataFrame
            test_size: Test set proportion
            
        Returns:
            Dictionary with performance metrics
        """
        # Prepare features
        X, y = self.prepare_features(df)
        
        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Create and train model
        self.model = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            verbosity=0,
            n_jobs=-1
        )
        
        self.model.fit(self.X_train, self.y_train)
        
        # Initialize SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)
        
        # Evaluate model
        y_pred_train = self.model.predict(self.X_train)
        y_pred_test = self.model.predict(self.X_test)
        
        mae_train = mean_absolute_error(self.y_train, y_pred_train)
        mae_test = mean_absolute_error(self.y_test, y_pred_test)
        rmse_test = np.sqrt(mean_squared_error(self.y_test, y_pred_test))
        r2 = r2_score(self.y_test, y_pred_test)
        
        metrics = {
            'mae_train': mae_train,
            'mae_test': mae_test,
            'rmse_test': rmse_test,
            'r2_score': r2,
            'train_samples': len(self.X_train),
            'test_samples': len(self.X_test)
        }
        
        print("="*60)
        print("MODEL TRAINING COMPLETE")
        print("="*60)
        print(f"Training Samples: {metrics['train_samples']}")
        print(f"Test Samples: {metrics['test_samples']}")
        print(f"MAE (Train): {metrics['mae_train']:.4f}")
        print(f"MAE (Test): {metrics['mae_test']:.4f}")
        print(f"RMSE (Test): {metrics['rmse_test']:.4f}")
        print(f"R² Score: {metrics['r2_score']:.4f}")
        print("="*60)
        
        return metrics
    
    def predict(self, features: np.ndarray) -> float:
        """
        Predict trust score for given features.
        
        Args:
            features: Feature array (1, 10)
            
        Returns:
            Predicted trust score (0-100)
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        prediction = self.model.predict(features)[0]
        # Clip to 0-100 range
        return max(0, min(100, prediction))
    
    def explain_user(self, features: np.ndarray) -> List[Dict[str, Any]]:
        """
        Explain prediction using SHAP for a single user.
        Returns top 5 most impactful features.
        
        Args:
            features: Feature array (1, 10)
            
        Returns:
            List of dicts with feature explanations
        """
        if self.explainer is None:
            raise ValueError("Model not trained yet")
        
        # Get SHAP values
        shap_values = self.explainer.shap_values(features)
        
        # Handle single prediction
        if isinstance(shap_values, list):
            # For multiclass (shouldn't happen with regressor, but safety check)
            shap_values = shap_values[0]
        
        # Get single instance SHAP values
        shap_vals = shap_values[0] if shap_values.ndim > 1 else shap_values
        
        # Get feature values
        feature_values = features[0]
        
        # Create explanation list
        explanations = []
        for i, feature_name in enumerate(self.feature_names):
            explanations.append({
                'feature': feature_name,
                'impact': float(shap_vals[i]),
                'value': float(feature_values[i])
            })
        
        # Sort by absolute impact and get top 5
        explanations.sort(key=lambda x: abs(x['impact']), reverse=True)
        
        return explanations[:5]
    
    def save_model(self, path: str) -> None:
        """
        Save trained model to disk.
        
        Args:
            path: File path to save model
        """
        if self.model is None:
            raise ValueError("No model to save")
        
        model_data = {
            'model': self.model,
            'explainer': self.explainer,
            'feature_names': self.feature_names
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Model saved to {path}")
    
    def load_model(self, path: str) -> None:
        """
        Load trained model from disk.
        
        Args:
            path: File path to load model from
        """
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.explainer = model_data['explainer']
        self.feature_names = model_data['feature_names']
        
        print(f"Model loaded from {path}")
    
    def get_feature_importance(self, top_n: int = 10) -> pd.DataFrame:
        """
        Get feature importance from the model.
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            DataFrame with feature importance
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        importance = self.model.get_booster().get_score(importance_type='weight')
        
        # Convert to DataFrame
        importance_df = pd.DataFrame(list(importance.items()), columns=['Feature', 'Importance'])
        importance_df = importance_df.sort_values('Importance', ascending=False).reset_index(drop=True)
        
        # Map feature indices to names
        feature_maps = {f'f{i}': name for i, name in enumerate(self.feature_names)}
        importance_df['Feature'] = importance_df['Feature'].map(feature_maps).fillna(importance_df['Feature'])
        
        return importance_df.head(top_n)


def create_and_train_model(df: pd.DataFrame) -> TrustScoreModel:
    """
    Create and train a new model.
    
    Args:
        df: Training DataFrame
        
    Returns:
        Trained TrustScoreModel instance
    """
    model = TrustScoreModel()
    model.train(df)
    return model


if __name__ == "__main__":
    # Example usage
    import pandas as pd
    
    print("Loading expanded dataset...")
    if Path("trust_dataset_expanded.csv").exists():
        df = pd.read_csv("trust_dataset_expanded.csv")
    else:
        from generate_dataset import prepare_dataset
        df = prepare_dataset("trust_dataset_original.csv")
    
    print("\nTraining model...")
    model = create_and_train_model(df)
    
    # Get feature importance
    print("\nTop 10 Feature Importance:")
    print(model.get_feature_importance(top_n=10))
    
    # Example prediction and explanation
    test_user = np.array([[
        60000,  # avg_monthly_income
        0.15,   # income_volatility
        0.95,   # upi_success_rate
        2,      # bill_payment_delay_days
        15000,  # monthly_repayment_cap
        0.55,   # essential_spend_ratio
        36,     # account_age_months
        0,      # loan_default_history
        0.8,    # savings_consistency
        2       # user_type_encoded (salaried)
    ]], dtype=np.float32)
    
    prediction = model.predict(test_user)
    print(f"\nPredicted Trust Score: {prediction:.2f}")
    
    explanations = model.explain_user(test_user)
    print("\nTop 5 Impactful Features:")
    for i, exp in enumerate(explanations, 1):
        print(f"{i}. {exp['feature']}: {exp['impact']:+.4f} (value: {exp['value']:.2f})")
