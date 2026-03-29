"""
FastAPI application for fintech trust scoring system.
Provides REST API for trust score prediction and loan eligibility.
"""

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
from pathlib import Path
import json
import asyncio
from datetime import datetime
import random

from generate_dataset import prepare_dataset
from model import create_and_train_model, TrustScoreModel
from services.bankStatementParser import parse_bank_statement, BankStatementParser
from utils import (
    validate_user_data,
    prepare_features_for_model,
    determine_loan_eligibility,
    calculate_monthly_emi,
    format_impact_value
)

# Initialize FastAPI app
app = FastAPI(
    title="Fintech Trust Score API",
    description="AI-powered trust scoring and loan eligibility system",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model_instance: Optional[TrustScoreModel] = None

# Borrower profiles storage (JSON file-based)
BORROWER_DB_FILE = Path("borrower_profiles.json")

def load_borrower_db():
    """Load borrower profiles from JSON file."""
    if BORROWER_DB_FILE.exists():
        with open(BORROWER_DB_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_borrower_db(data: Dict):
    """Save borrower profiles to JSON file."""
    with open(BORROWER_DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize borrower database
borrower_profiles = load_borrower_db()


# ==================== WebSocket Manager ====================

class ConnectionManager:
    """Manage WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to specific connection."""
        try:
            await websocket.send_json(message)
        except:
            pass


manager = ConnectionManager()


# ==================== Real-time Data Generator ====================

def get_user_baseline_data(user_type: str, user_name: str) -> Dict[str, Any]:
    """Generate baseline data for a user type."""
    
    user_type_lower = user_type.lower().replace(" ", "_")
    
    if "student" in user_type_lower:
        return {
            "user_type": "Student",
            "icon": "🎓",
            "avg_income": 15000,
            "income_volatility": 0.3,
            "upi_success_rate": 0.95,
            "base_score": 62,
            "eligible_loan": 50000,
            "interest_rate": 14.5,
        }
    elif "gig" in user_type_lower:
        return {
            "user_type": "Gig Worker",
            "icon": "🛺",
            "avg_income": 45000,
            "income_volatility": 0.65,
            "upi_success_rate": 0.92,
            "base_score": 58,
            "eligible_loan": 120000,
            "interest_rate": 16.0,
        }
    else:  # salaried
        return {
            "user_type": "Salaried",
            "icon": "💼",
            "avg_income": 95000,
            "income_volatility": 0.08,
            "upi_success_rate": 0.99,
            "base_score": 78,
            "eligible_loan": 500000,
            "interest_rate": 12.0,
        }


def generate_real_time_data(user_type: str, user_name: str) -> Dict[str, Any]:
    """Generate real-time dashboard data with small variations."""
    
    baseline = get_user_baseline_data(user_type, user_name)
    
    # Add small random variations to simulate real-time updates
    score_variation = random.uniform(-2, 2)
    income_variation = baseline["avg_income"] * random.uniform(-0.05, 0.05)
    
    return {
        "timestamp": datetime.now().isoformat(),
        "user_name": user_name,
        "user_type": baseline["user_type"],
        "icon": baseline["icon"],
        "trust_score": max(0, min(100, baseline["base_score"] + score_variation)),
        "avg_monthly_income": baseline["avg_income"] + income_variation,
        "income_volatility": baseline["income_volatility"],
        "upi_success_rate": baseline["upi_success_rate"],
        "eligible_loan_amount": baseline["eligible_loan"],
        "interest_rate": baseline["interest_rate"],
        "monthly_emi": (baseline["eligible_loan"] * (baseline["interest_rate"]/100/12)) / (1 - (1 + baseline["interest_rate"]/100/12) ** -12),
        "loan_status": "Approved" if baseline["base_score"] > 60 else "Under Review",
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ==================== Request/Response Models ====================

class LoginRequest(BaseModel):
    """Login credentials."""
    email: str = Field(..., description="User email", example="user@example.com")
    password: str = Field(..., description="Password", example="password123")


class LoginResponse(BaseModel):
    """Login response with token."""
    success: bool
    message: str
    token: str
    user: Dict[str, Any]


class UserScoreRequest(BaseModel):
    """User financial data for trust score calculation."""
    user_type: str = Field(..., description="User type: salaried, gig_worker, or student", example="salaried")
    avg_monthly_income: float = Field(..., description="Average monthly income (INR)", example=95000)
    income_volatility: float = Field(..., description="Income volatility 0-1 (0=stable, 1=highly variable)", example=0.08)
    upi_success_rate: float = Field(..., description="UPI payment success rate 0-1", example=0.99)
    bill_payment_delay_days: float = Field(..., description="Average bill payment delay (days)", example=0)
    monthly_repayment_cap: float = Field(..., description="Max monthly EMI capacity (INR)", example=25000)
    essential_spend_ratio: float = Field(..., description="Essential spending ratio 0-1", example=0.42)
    account_age_months: float = Field(..., description="Account age (months)", example=72)
    loan_default_history: int = Field(..., description="Previous loan default (0=no, 1=yes)", example=0)
    savings_consistency: float = Field(..., description="Savings consistency 0-1", example=0.88)


class FeatureImpact(BaseModel):
    """Feature impact in the explanation."""
    feature: str
    impact: str
    value: float


class InputParameters(BaseModel):
    """Echo back all input parameters."""
    user_type: str
    avg_monthly_income: float
    income_volatility: float
    upi_success_rate: float
    bill_payment_delay_days: float
    monthly_repayment_cap: float
    essential_spend_ratio: float
    account_age_months: float
    loan_default_history: int
    savings_consistency: float


class ScoreResponse(BaseModel):
    """Response model for score prediction."""
    # Input Parameters (echoed back for verification)
    input_data: InputParameters = Field(..., description="Echo of all input parameters")
    
    # Score and Eligibility
    trust_score: float = Field(..., description="Predicted trust score (0-100)")
    loan_amount: float = Field(..., description="Eligible loan amount in INR")
    interest_rate: float = Field(..., description="Interest rate in percentage")
    eligibility_status: str = Field(..., description="Loan eligibility status")
    monthly_emi: float = Field(..., description="Monthly EMI for 12-month loan")
    
    # Feature Breakdown (SHAP explanations)
    breakdown: List[FeatureImpact] = Field(..., description="Top 5 features affecting the prediction")
    
    # Additional Info
    status_code: int = Field(..., description="Response status (200 for success)")
    message: str = Field(..., description="Response message")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_status: str
    version: str


# ==================== Borrower Profile Models ====================

class BorrowerProfileRequest(BaseModel):
    """Borrower profile data for registration/update."""
    user_id: str = Field(..., description="User ID", example="student")
    full_name: str = Field(..., description="Full name", example="Aditya Sharma")
    age: int = Field(..., description="Age", example=22)
    gender: str = Field(..., description="Gender", example="Male")
    email: str = Field(..., description="Email", example="aditya@example.com")
    phone: str = Field(..., description="Phone number", example="9876543210")
    city: str = Field(..., description="City", example="Mumbai")
    occupation: str = Field(..., description="Occupation", example="Student")
    monthly_income: float = Field(..., description="Monthly income (INR)", example=15000)
    employment_type: str = Field(..., description="Employment type", example="Student")
    account_age_months: int = Field(..., description="Account age in months", example=24)
    has_credit_history: bool = Field(..., description="Has credit history", example=False)
    education: str = Field(..., description="Education level", example="Bachelor's")
    marital_status: str = Field(..., description="Marital status", example="Single")


class BorrowerProfileResponse(BaseModel):
    """Borrower profile response."""
    success: bool
    message: str
    profile: Dict[str, Any]
    profile_complete: bool


class BorrowerDataResponse(BaseModel):
    """Borrower data for dashboard."""
    user_id: str
    full_name: str
    email: str
    phone: str
    monthly_income: float
    occupation: str
    city: str
    age: int
    gender: str
    employment_type: str
    account_age_months: int
    has_credit_history: bool
    education: str
    marital_status: str
    trust_score: float
    eligible_loan: float
    interest_rate: float
    loan_status: str
    profile_updated_at: str


class BankStatementRequest(BaseModel):
    """ReBIT standard bank statement data (JSON)."""
    header: Dict[str, Any] = Field(..., description="Account holder info")
    transactions: List[Dict[str, Any]] = Field(..., description="Transaction array")


class BankStatementAnalysisResponse(BaseModel):
    """Bank statement analysis results."""
    success: bool
    message: str
    analysis: Dict[str, Any] = Field(..., description="Complete financial analysis")
    risk_assessment: Dict[str, Any] = Field(..., description="Risk scoring based on statement")
    account_id: Optional[str] = None


# ==================== Helper Functions ====================

def initialize_model() -> bool:
    """
    Initialize the model by loading or training.
    
    Returns:
        True if successful, False otherwise
    """
    global model_instance
    
    try:
        # Check if expanded dataset exists
        if Path("trust_dataset_expanded.csv").exists():
            print("Loading expanded dataset...")
            import pandas as pd
            df = pd.read_csv("trust_dataset_expanded.csv")
        else:
            print("Preparing dataset...")
            df = prepare_dataset("trust_dataset_original.csv", "trust_dataset_expanded.csv")
        
        print("Training model...")
        model_instance = create_and_train_model(df)
        return True
    
    except Exception as e:
        print(f"Error initializing model: {e}")
        return False


# ==================== Endpoints ====================

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup."""
    global model_instance
    print("Starting Fintech Trust Score API...")
    try:
        print("Initializing model...")
        if not initialize_model():
            print("⚠️  Warning: Model initialization failed - API will be in limited mode")
            print("Try accessing /health to check status")
        else:
            print("✅ Model initialization successful!")
    except Exception as e:
        print(f"❌ Error during startup: {e}")
        import traceback
        traceback.print_exc()
        model_instance = None


@app.post("/login", response_model=LoginResponse, tags=["Auth"])
async def login(request: LoginRequest) -> LoginResponse:
    """
    Simple authentication endpoint.
    
    Args:
        request: Login credentials
        
    Returns:
        Auth token and user data
    """
    # Simple demo authentication (replace with real auth in production)
    demo_users = {
        "student@example.com": {
            "id": "student",
            "name": "Aditya Sharma",
            "type": "Student",
            "icon": "🎓",
            "email": "student@example.com"
        },
        "gig@example.com": {
            "id": "gig_worker",
            "name": "Rahul Kumar",
            "type": "Gig Worker",
            "icon": "🛺",
            "email": "gig@example.com"
        },
        "salaried@example.com": {
            "id": "salaried",
            "name": "Priya Singh",
            "type": "Salaried",
            "icon": "💼",
            "email": "salaried@example.com"
        }
    }
    
    # Check credentials (demo: any password "password" works)
    if request.email in demo_users and request.password == "password":
        token = f"token_{request.email}_{np.random.randint(100000, 999999)}"
        return LoginResponse(
            success=True,
            message="Login successful",
            token=token,
            user=demo_users[request.email]
        )
    
    raise HTTPException(
        status_code=401,
        detail="Invalid email or password. Use demo accounts: student@example.com, gig@example.com, salaried@example.com (password: 'password')"
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Check API health and model status.
    
    Returns:
        Health status and model information
    """
    model_status = "ready" if model_instance is not None else "not_initialized"
    
    return HealthResponse(
        status="operational",
        model_status=model_status,
        version="1.0.0"
    )


@app.post("/predict", response_model=ScoreResponse, tags=["Scoring"])
async def predict(request: UserScoreRequest) -> ScoreResponse:
    """
    Predict trust score and loan eligibility (Frontend API).
    
    Args:
        request: User financial data
        
    Returns:
        Trust score prediction with all details
    """
    return await get_trust_score(request)


@app.post("/api/score", response_model=ScoreResponse, tags=["Scoring"])
async def get_trust_score(request: UserScoreRequest) -> ScoreResponse:
    """
    Calculate trust score and determine loan eligibility for a user.
    
    Args:
        request: User financial data
        
    Returns:
        Trust score, loan eligibility, and feature breakdown
        
    Raises:
        HTTPException: If validation fails or model is not ready
    """
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    # Convert request to dict
    user_data = request.dict()
    
    # Validate input
    is_valid, error_message = validate_user_data(user_data)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Validation error: {error_message}")
    
    try:
        # Prepare features
        features = prepare_features_for_model(user_data)
        
        # Get prediction
        trust_score = model_instance.predict(features)
        
        # Get loan eligibility
        loan_info = determine_loan_eligibility(trust_score)
        
        # Calculate monthly EMI
        if loan_info['loan_amount'] > 0:
            monthly_emi = calculate_monthly_emi(
                loan_info['loan_amount'],
                loan_info['interest_rate'],
                months=12
            )
        else:
            monthly_emi = 0
        
        # Get feature explanations
        explanations = model_instance.explain_user(features)
        
        # Format breakdown
        breakdown = [
            FeatureImpact(
                feature=exp['feature'],
                impact=format_impact_value(exp['impact']),
                value=round(exp['value'], 2)
            )
            for exp in explanations
        ]
        
        # Create input echo
        input_echo = InputParameters(
            user_type=user_data['user_type'],
            avg_monthly_income=round(user_data['avg_monthly_income'], 2),
            income_volatility=round(user_data['income_volatility'], 4),
            upi_success_rate=round(user_data['upi_success_rate'], 4),
            bill_payment_delay_days=round(user_data['bill_payment_delay_days'], 2),
            monthly_repayment_cap=round(user_data['monthly_repayment_cap'], 2),
            essential_spend_ratio=round(user_data['essential_spend_ratio'], 4),
            account_age_months=round(user_data['account_age_months'], 2),
            loan_default_history=user_data['loan_default_history'],
            savings_consistency=round(user_data['savings_consistency'], 4)
        )
        
        return ScoreResponse(
            input_data=input_echo,
            trust_score=round(trust_score, 2),
            loan_amount=loan_info['loan_amount'],
            interest_rate=loan_info['interest_rate'],
            eligibility_status=loan_info['eligibility'],
            monthly_emi=round(monthly_emi, 2),
            breakdown=breakdown,
            status_code=200,
            message="Success: Trust score calculated"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.get("/api/model-info", tags=["System"])
async def get_model_info() -> Dict[str, Any]:
    """
    Get information about the trained model.
    
    Returns:
        Model metadata and feature importance
    """
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    try:
        feature_importance = model_instance.get_feature_importance(top_n=10)
        
        return {
            "model_type": "XGBoost Regressor",
            "n_estimators": 150,
            "max_depth": 5,
            "learning_rate": 0.1,
            "feature_count": len(model_instance.feature_names),
            "features": model_instance.feature_names,
            "top_10_important_features": feature_importance.to_dict('records')
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving model info: {str(e)}")


@app.post("/api/batch-score", tags=["Scoring"])
async def batch_score(requests: List[UserScoreRequest]) -> Dict[str, Any]:
    """
    Score multiple users in batch.
    
    Args:
        requests: List of user financial data
        
    Returns:
        Batch scoring results
    """
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    results = []
    errors = []
    
    for idx, req in enumerate(requests):
        try:
            user_data = req.dict()
            is_valid, error_message = validate_user_data(user_data)
            
            if not is_valid:
                errors.append({"index": idx, "error": error_message})
                continue
            
            features = prepare_features_for_model(user_data)
            trust_score = model_instance.predict(features)
            loan_info = determine_loan_eligibility(trust_score)
            
            results.append({
                "index": idx,
                "trust_score": round(trust_score, 2),
                "loan_amount": loan_info['loan_amount'],
                "interest_rate": loan_info['interest_rate'],
                "eligibility": loan_info['eligibility']
            })
        
        except Exception as e:
            errors.append({"index": idx, "error": str(e)})
    
    return {
        "total_processed": len(requests),
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }


@app.get("/api/eligibility-rules", tags=["System"])
async def get_eligibility_rules() -> Dict[str, Any]:
    """
    Get loan eligibility rules.
    
    Returns:
        Eligibility criteria and loan parameters
    """
    return {
        "rules": [
            {
                "score_range": "80-100",
                "eligibility": "APPROVED_HIGH",
                "loan_amount": 50000,
                "interest_rate": 9.0,
                "description": "Premium tier - highest trust"
            },
            {
                "score_range": "65-79.99",
                "eligibility": "APPROVED_MEDIUM",
                "loan_amount": 20000,
                "interest_rate": 11.5,
                "description": "Standard tier - good trust"
            },
            {
                "score_range": "50-64.99",
                "eligibility": "APPROVED_LOW",
                "loan_amount": 5000,
                "interest_rate": 14.0,
                "description": "Basic tier - moderate trust"
            },
            {
                "score_range": "0-49.99",
                "eligibility": "REJECTED",
                "loan_amount": 0,
                "interest_rate": 0,
                "description": "Rejected - insufficient trust"
            }
        ]
    }


@app.get("/", tags=["System"])
async def root() -> Dict[str, str]:
    """
    Root endpoint with API documentation links.
    
    Returns:
        Welcome message and useful links
    """
    return {
        "message": "Welcome to Fintech Trust Score API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "main_endpoint": "/api/score",
        "health_check": "/health"
    }


# ==================== WebSocket Endpoint ====================

@app.websocket("/ws/dashboard/{user_id}")
async def websocket_dashboard(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time dashboard updates.
    Sends data at exact 2-second intervals while listening for client messages.
    
    Args:
        websocket: WebSocket connection
        user_id: User ID for personalized updates
    """
    await manager.connect(websocket, user_id)
    
    # Map user IDs to names and types
    user_map = {
        "student": ("Aditya Sharma", "Student"),
        "gig_worker": ("Ayush Bhomia", "Gig Worker"),
        "salaried": ("Balram Panigrahi", "Salaried"),
    }
    
    user_name, user_type = user_map.get(user_id, ("Unknown User", "Unknown"))
    
    print(f"✅ WebSocket connected: {user_id} ({user_name})")
    
    try:
        # Send initial connection message
        await manager.send_personal(websocket, {
            "type": "connection",
            "status": "connected",
            "user_id": user_id,
            "user_name": user_name,
            "user_type": user_type,
            "timestamp": datetime.now().isoformat()
        })
        
        # Flag to control sending loop
        is_connected = True
        
        async def receive_messages():
            """Listen for incoming client messages."""
            nonlocal is_connected
            try:
                while is_connected:
                    try:
                        data = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
                        if data.get("type") == "ping":
                            await manager.send_personal(websocket, {
                                "type": "pong",
                                "timestamp": datetime.now().isoformat()
                            })
                            print(f"🔔 Ping from {user_id}")
                    except asyncio.TimeoutError:
                        # Client timeout - connection likely dead
                        print(f"⏱️ No message from {user_id} for 30s")
                        is_connected = False
                        break
                    except Exception as e:
                        print(f"Error receiving message from {user_id}: {e}")
                        is_connected = False
                        break
            except Exception as e:
                print(f"Message listener error for {user_id}: {e}")
                is_connected = False
        
        async def send_updates():
            """Send real-time updates every 2 seconds."""
            nonlocal is_connected
            update_count = 0
            try:
                while is_connected:
                    try:
                        await asyncio.sleep(2.0)  # Wait exactly 2 seconds
                        
                        # Generate data for current user
                        real_time_data = generate_real_time_data(user_type, user_name)
                        
                        # Generate data for all users
                        all_users_data = {}
                        for uid in ["student", "gig_worker", "salaried"]:
                            uname, utype = user_map.get(uid, ("Unknown", "Unknown"))
                            all_users_data[uid] = generate_real_time_data(utype, uname)
                        
                        update_count += 1
                        
                        # Create update message
                        message = {
                            "type": "dashboard_update",
                            "current_user": real_time_data,
                            "all_users": all_users_data,
                            "timestamp": datetime.now().isoformat(),
                            "update_count": update_count
                        }
                        
                        # Send to this user
                        await manager.send_personal(websocket, message)
                        
                        # Broadcast to all clients (every 2 seconds, all get same data)
                        await manager.broadcast({
                            "type": "global_update",
                            "updated_by": user_id,
                            "data": all_users_data,
                            "timestamp": datetime.now().isoformat(),
                            "update_count": update_count
                        })
                        
                        print(f"📤 Sent update #{update_count} to {user_id}")
                        
                    except asyncio.CancelledError:
                        print(f"Send task cancelled for {user_id}")
                        break
                    except Exception as e:
                        print(f"Error sending update to {user_id}: {e}")
                        is_connected = False
                        break
            except Exception as e:
                print(f"Send updates error for {user_id}: {e}")
                is_connected = False
        
        # Run both tasks concurrently
        receive_task = asyncio.create_task(receive_messages())
        send_task = asyncio.create_task(send_updates())
        
        # Wait for either task to complete (one fails means both should stop)
        done, pending = await asyncio.wait(
            [receive_task, send_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Cancel remaining task
        is_connected = False
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
    
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnect: {user_id}")
        manager.disconnect(websocket, user_id)
        
        # Notify other users
        await manager.broadcast({
            "type": "user_disconnected",
            "user_id": user_id,
            "user_name": user_name,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"❌ WebSocket error for {user_id}: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(websocket, user_id)


# ==================== Borrower Profile Endpoints ====================

@app.post("/api/borrower/profile", response_model=BorrowerProfileResponse, tags=["Borrower"])
async def save_borrower_profile(request: BorrowerProfileRequest) -> BorrowerProfileResponse:
    """
    Save or update borrower profile.
    
    Args:
        request: Borrower profile data
        
    Returns:
        Success response with saved profile
    """
    global borrower_profiles
    
    try:
        # Save profile to database
        profile_data = request.dict()
        profile_data['profile_updated_at'] = datetime.now().isoformat()
        
        borrower_profiles[request.user_id] = profile_data
        save_borrower_db(borrower_profiles)
        
        # Broadcast profile update to all connected clients
        await manager.broadcast({
            "type": "borrower_profile_updated",
            "user_id": request.user_id,
            "profile": profile_data,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"✅ Borrower profile saved for {request.user_id}")
        
        return BorrowerProfileResponse(
            success=True,
            message="Profile saved successfully",
            profile=profile_data,
            profile_complete=True
        )
    
    except Exception as e:
        print(f"Error saving borrower profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving profile: {str(e)}")


@app.get("/api/borrower/profile/{user_id}", response_model=BorrowerDataResponse, tags=["Borrower"])
async def get_borrower_profile(user_id: str) -> BorrowerDataResponse:
    """
    Get borrower profile and calculated scores.
    
    Args:
        user_id: User ID
        
    Returns:
        Borrower data with trust score and loan details
    """
    try:
        # Check if profile exists
        if user_id not in borrower_profiles:
            raise HTTPException(status_code=404, detail="Borrower profile not found")
        
        profile = borrower_profiles[user_id]
        
        # Get baseline data for user type
        user_type_map = {
            "student": ("Student", 62),
            "gig_worker": ("Gig Worker", 58),
            "salaried": ("Salaried", 78)
        }
        
        user_type, base_score = user_type_map.get(user_id, ("Unknown", 50))
        
        # Generate scores based on profile
        score_variation = random.uniform(-2, 2)
        trust_score = max(0, min(100, base_score + score_variation))
        
        # Determine loan eligibility
        if trust_score >= 80:
            eligible_loan = 500000 if "salaried" in user_id else (120000 if "gig" in user_id else 50000)
            interest_rate = 12.0 if "salaried" in user_id else (16.0 if "gig" in user_id else 14.5)
        elif trust_score >= 65:
            eligible_loan = 300000 if "salaried" in user_id else (80000 if "gig" in user_id else 30000)
            interest_rate = 14.0 if "salaried" in user_id else (17.0 if "gig" in user_id else 15.5)
        elif trust_score >= 50:
            eligible_loan = 100000 if "salaried" in user_id else (30000 if "gig" in user_id else 10000)
            interest_rate = 16.0 if "salaried" in user_id else (18.5 if "gig" in user_id else 17.5)
        else:
            eligible_loan = 0
            interest_rate = 0
        
        loan_status = "Approved" if trust_score >= 50 else "Rejected"
        
        # Return borrower data
        return BorrowerDataResponse(
            user_id=user_id,
            full_name=profile.get('full_name', 'N/A'),
            email=profile.get('email', 'N/A'),
            phone=profile.get('phone', 'N/A'),
            monthly_income=profile.get('monthly_income', 0),
            occupation=profile.get('occupation', 'N/A'),
            city=profile.get('city', 'N/A'),
            age=profile.get('age', 0),
            gender=profile.get('gender', 'N/A'),
            employment_type=profile.get('employment_type', 'N/A'),
            account_age_months=profile.get('account_age_months', 0),
            has_credit_history=profile.get('has_credit_history', False),
            education=profile.get('education', 'N/A'),
            marital_status=profile.get('marital_status', 'N/A'),
            trust_score=round(trust_score, 2),
            eligible_loan=eligible_loan,
            interest_rate=interest_rate,
            loan_status=loan_status,
            profile_updated_at=profile.get('profile_updated_at', datetime.now().isoformat())
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving borrower profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving profile: {str(e)}")


@app.get("/api/borrower/check-profile/{user_id}", tags=["Borrower"])
async def check_borrower_profile(user_id: str) -> Dict[str, Any]:
    """
    Check if borrower profile is complete.
    
    Args:
        user_id: User ID
        
    Returns:
        Profile completion status
    """
    profile_exists = user_id in borrower_profiles
    
    return {
        "user_id": user_id,
        "profile_exists": profile_exists,
        "profile_complete": profile_exists,
        "message": "Profile found" if profile_exists else "Profile not found, please complete registration"
    }


@app.post("/api/bank-statement/analyze", response_model=BankStatementAnalysisResponse, tags=["Bank Statement"])
async def analyze_bank_statement(request: BankStatementRequest) -> BankStatementAnalysisResponse:
    """
    Analyze ReBIT standard bank statement JSON for financial metrics.
    
    Args:
        request: Bank statement data (header + transactions)
        
    Returns:
        Complete financial analysis with risk assessment
    """
    try:
        # Parse bank statement
        analysis = parse_bank_statement(request.dict())
        
        # Extract key metrics for risk assessment
        cashflow = analysis.get('cashflow', {})
        income = analysis.get('income', {})
        spending = analysis.get('spending_patterns', {})
        emi = analysis.get('emi', {})
        
        # Calculate risk assessment scores
        savings_rate = cashflow.get('savings_rate', 0)
        income_stability = income.get('income_stability_score', 0)
        emi_regularity = emi.get('emi_regularity_score', 0)
        
        # Risk scoring (lower is better, 0-100)
        income_risk = 100 - income_stability if income.get('has_regular_income') else 50
        emi_risk = 100 - emi_regularity if emi.get('has_emi') else 0
        savings_risk = max(0, 50 - savings_rate) if savings_rate > 0 else 30
        
        overall_risk = (income_risk * 0.4 + emi_risk * 0.3 + savings_risk * 0.3)
        
        risk_assessment = {
            'overall_risk_score': round(overall_risk, 2),
            'risk_level': 'LOW' if overall_risk < 25 else 'MEDIUM' if overall_risk < 50 else 'HIGH',
            'income_risk': round(income_risk, 2),
            'emi_risk': round(emi_risk, 2),
            'savings_risk': round(savings_risk, 2),
            'financial_health': {
                'has_regular_income': income.get('has_regular_income'),
                'income_stability': income.get('income_stability_score'),
                'savings_rate': savings_rate,
                'has_active_emi': emi.get('has_emi'),
                'average_balance': cashflow.get('average_balance', 0),
                'monthly_income': cashflow.get('average_monthly_income', 0),
                'monthly_spend': cashflow.get('average_monthly_spend', 0),
            }
        }
        
        account_id = request.header.get('accountId')
        
        # Broadcast analysis to connected clients
        await manager.broadcast({
            "type": "bank_statement_analyzed",
            "account_id": account_id,
            "analysis": analysis,
            "risk_assessment": risk_assessment,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"✅ Bank statement analyzed for account {account_id}")
        
        return BankStatementAnalysisResponse(
            success=True,
            message="Bank statement analyzed successfully",
            analysis=analysis,
            risk_assessment=risk_assessment,
            account_id=account_id
        )
    
    except Exception as e:
        print(f"Error analyzing bank statement: {e}")
        raise HTTPException(status_code=400, detail=f"Error analyzing statement: {str(e)}")


# ==================== Error Handlers ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "detail": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    print(f"Unhandled exception: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status_code": 500,
            "detail": f"Internal server error: {str(exc)}"
        }
    )


# ==================== Main ====================

if __name__ == "__main__":
    import uvicorn
    
    print("Fintech Trust Score API")
    print("="*60)
    print("Starting server...")
    print("API Documentation: http://localhost:8000/docs")
    print("="*60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
