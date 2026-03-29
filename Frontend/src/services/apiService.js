/**
 * API Service for TrustPool AI Backend
 */

const BACKEND_URL = "http://localhost:5000";

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Register a new lender */
export const registerLender = async ({ name, email, password }) => {
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role: "lender" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Registration failed");
  return data;
};

/** Register a new borrower */
export const registerBorrower = async ({ name, email, password }) => {
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role: "borrower" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Registration failed");
  return data;
};

/** Login existing user (lender or borrower) */
export const loginUser = async (email, password) => {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Login failed");
  // Store token & user
  if (data.token) {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
};

/** Get current user profile */
export const getUserProfile = async () => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Failed to get profile");
  return data;
};

// ─── KYC ─────────────────────────────────────────────────────────────────────

/** Initiate PAN verification — direct lookup (no OTP), returns { verified, msg } */
export const initiatePanVerification = async (pan, name, dob) => {
  const res = await fetch(`${BACKEND_URL}/api/kyc/initiate-pan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pan, name, dob }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "PAN verification failed");
  return data; // { verified, msg }
};

/** Verify PAN OTP */
export const verifyPanOtp = async (otp, referenceId, email) => {
  const res = await fetch(`${BACKEND_URL}/api/kyc/verify-pan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp, referenceId, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "PAN OTP verification failed");
  return data; // { verified: true, msg }
};

/** Initiate Aadhaar verification – returns referenceId */
export const initiateAadhaarVerification = async (aadhaar) => {
  const res = await fetch(`${BACKEND_URL}/api/kyc/initiate-aadhaar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aadhaar }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Aadhaar initiation failed");
  return data; // { msg, referenceId }
};

/** Verify Aadhaar OTP */
export const verifyAadhaarOtp = async (otp, referenceId, email) => {
  const res = await fetch(`${BACKEND_URL}/api/kyc/verify-aadhaar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp, referenceId, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Aadhaar OTP verification failed");
  return data; // { verified: true, msg }
};

// ─── Payments ────────────────────────────────────────────────────────────────

/** Get lender payment/deposit data */
export const getLenderPayments = async () => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${BACKEND_URL}/api/payments/lender-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const logoutUser = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
};

export const getStoredUser = () => {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const isAuthenticated = () => !!localStorage.getItem("auth_token");

export const isLender = () => {
  const u = getStoredUser();
  return u?.role === "lender";
};
