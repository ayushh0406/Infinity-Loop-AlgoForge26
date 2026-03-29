const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

const SANDBOX_BASE   = 'https://api.sandbox.co.in';
let sandboxToken     = process.env.SANDBOX_AUTH_TOKEN;
const SANDBOX_KEY    = process.env.SANDBOX_API_KEY;
const SANDBOX_SECRET = process.env.SANDBOX_API_SECRET;

const useSandbox = () =>
  SANDBOX_KEY && SANDBOX_KEY !== 'your_sandbox_api_key_here' &&
  SANDBOX_SECRET && SANDBOX_SECRET !== 'your_sandbox_api_secret_here';

const refreshToken = async () => {
  const res = await fetch(`${SANDBOX_BASE}/authenticate`, {
    method: 'POST',
    headers: { 'x-api-key': SANDBOX_KEY, 'x-api-secret': SANDBOX_SECRET, 'x-api-version': '1.0.0' },
  });
  const data = await res.json();
  if (data.code === 200 && data.access_token) {
    sandboxToken = data.access_token;
    console.log('[Sandbox] Token refreshed ✅');
  } else {
    throw new Error('Token refresh failed');
  }
};

const sandboxHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': sandboxToken,
  'x-api-key': SANDBOX_KEY,
  'x-api-version': '1.0.0',
});

const sandboxFetch = async (url, options) => {
  let res = await fetch(url, { ...options, headers: sandboxHeaders() });
  if (res.status === 401) {
    await refreshToken();
    res = await fetch(url, { ...options, headers: sandboxHeaders() });
  }
  return res;
};

const otpStore = {};

// ─── 1. PAN — Real Sandbox /kyc/pan/verify (PAN + Name + DOB, no OTP) ──────────
router.post('/initiate-pan', async (req, res) => {
  const { pan, name, dob } = req.body;

  if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return res.status(400).json({ msg: 'Invalid PAN format. Example: ABCDE1234F' });
  }

  if (useSandbox()) {
    try {
      const response = await sandboxFetch(`${SANDBOX_BASE}/kyc/pan/verify`, {
        method: 'POST',
        body: JSON.stringify({
          '@entity': 'in.co.sandbox.kyc.pan_verification.request',
          pan,
          name_as_per_pan: name || '',
          date_of_birth: dob || '',
          consent: 'Y',
          reason: 'KYC for TrustPool lending platform',
        }),
      });

      const rawText = await response.text();
      console.log('[Sandbox PAN Raw Response]', rawText);
      const data = JSON.parse(rawText);

      if (data.code === 200 && data.data) {
        const status = (data.data.status || '').toString().trim().toUpperCase();
        const panName = data.data.name_as_per_pan || data.data.name || '';

        console.log('[Sandbox PAN Status]', status, '| Name:', panName);

        if (status === 'VALID') {
          // PAN + Name + DOB all matched
          const referenceId = crypto.randomUUID();
          otpStore[referenceId] = { type: 'pan', verified: true, panName };
          return res.json({
            verified: true,
            msg: `PAN verified! Name: ${panName || pan}`,
            referenceId,
            panName,
          });
        } else {
          // Status is NOT_VALID, INVALID, etc — name/DOB mismatch
          const reason = data.data.message || `PAN status: ${status}. Name or DOB does not match.`;
          return res.status(400).json({ msg: reason });
        }
      }

      // Non-200 code = error
      const errMsg = (data.data && data.data.message) || data.message || 'PAN verification failed';
      return res.status(400).json({ msg: errMsg });

    } catch (err) {
      console.error('[Sandbox PAN Error]', err.message);
      // Fall through to mock
    }
  }

  // Mock fallback
  const referenceId = crypto.randomUUID();
  otpStore[referenceId] = { type: 'pan', otp: '9876' };
  console.log(`[Mock PAN] OTP: 9876 for ${pan}`);
  res.json({ msg: 'OTP sent to PAN-linked mobile. (Demo OTP: 9876)', referenceId });
});

// ─── 2. Confirm PAN verified in DB ─────────────────────────────────────────────
router.post('/verify-pan', async (req, res) => {
  const { otp, referenceId, email } = req.body;
  const stored = otpStore[referenceId];

  if (!stored) return res.status(400).json({ msg: 'Invalid reference. Restart PAN verification.' });

  // Sandbox pre-verified — just mark in DB
  if (stored.verified) {
    delete otpStore[referenceId];
    if (email) await User.findOneAndUpdate({ email }, { isPanVerified: true });
    return res.json({ verified: true, msg: 'PAN Verified ✅' });
  }

  // Mock OTP check
  if (otp !== stored.otp) {
    return res.status(400).json({ msg: `Invalid OTP. Use ${stored.otp}` });
  }
  delete otpStore[referenceId];
  if (email) await User.findOneAndUpdate({ email }, { isPanVerified: true });
  res.json({ verified: true, msg: 'PAN Verified ✅' });
});

// ─── 3. Initiate Aadhaar — Real Sandbox OTP ────────────────────────────────────
router.post('/initiate-aadhaar', async (req, res) => {
  const { aadhaar } = req.body;
  if (!aadhaar || !/^[0-9]{12}$/.test(aadhaar)) {
    return res.status(400).json({ msg: 'Aadhaar must be exactly 12 digits' });
  }

  if (useSandbox()) {
    try {
      const response = await sandboxFetch(`${SANDBOX_BASE}/kyc/aadhaar/okyc/otp`, {
        method: 'POST',
        body: JSON.stringify({
          '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
          aadhaar_number: aadhaar,
          consent: 'Y',
          reason: 'KYC for TrustPool lending platform',
        }),
      });
      const data = await response.json();
      console.log('[Sandbox Aadhaar OTP]', JSON.stringify(data));

      if (data.code === 200 && data.data?.reference_id) {
        const internalRef = crypto.randomUUID();
        otpStore[internalRef] = { type: 'aadhaar', sandboxRef: data.data.reference_id };
        return res.json({ msg: 'OTP sent to your Aadhaar-linked mobile number', referenceId: internalRef });
      }

      const errMsg = (data.data && data.data.message) || data.message || 'Failed to send Aadhaar OTP';
      return res.status(400).json({ msg: errMsg });

    } catch (err) {
      console.error('[Sandbox Aadhaar Error]', err.message);
    }
  }

  // Mock fallback
  const referenceId = crypto.randomUUID();
  otpStore[referenceId] = { type: 'aadhaar', otp: '9876' };
  res.json({ msg: 'OTP sent to Aadhaar-linked mobile. (Demo OTP: 9876)', referenceId });
});

// ─── 4. Verify Aadhaar OTP ─────────────────────────────────────────────────────
router.post('/verify-aadhaar', async (req, res) => {
  const { otp, referenceId, email } = req.body;
  const stored = otpStore[referenceId];

  if (!stored) return res.status(400).json({ msg: 'Invalid reference. Restart Aadhaar verification.' });

  if (useSandbox() && stored.sandboxRef) {
    try {
      const response = await sandboxFetch(`${SANDBOX_BASE}/kyc/aadhaar/okyc/otp/verify`, {
        method: 'POST',
        body: JSON.stringify({
          '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
          reference_id: String(stored.sandboxRef),
          otp: String(otp),
        }),
      });
      const data = await response.json();
      console.log('[Sandbox Aadhaar Verify]', JSON.stringify(data));

      if (data.code === 200 && data.data?.status === 'VALID') {
        delete otpStore[referenceId];
        if (email) await User.findOneAndUpdate({ email }, { isAadhaarVerified: true });
        return res.json({
          verified: true,
          msg: 'Aadhaar Verified ✅',
          ekyc: { name: data.data.name, dob: data.data.date_of_birth, gender: data.data.gender, address: data.data.full_address },
        });
      }

      const errMsg = (data.data && data.data.message) || data.message || 'OTP verification failed';
      return res.status(400).json({ msg: errMsg });

    } catch (err) {
      console.error('[Sandbox Verify Error]', err.message);
      return res.status(500).json({ msg: 'Sandbox API error. Please try again.' });
    }
  }

  // Mock fallback
  if (otp !== (stored.otp || '9876')) {
    return res.status(400).json({ msg: `Invalid OTP. Use ${stored.otp || '9876'}` });
  }
  delete otpStore[referenceId];
  if (email) await User.findOneAndUpdate({ email }, { isAadhaarVerified: true });
  res.json({ verified: true, msg: 'Aadhaar Verified ✅' });
});

module.exports = router;
