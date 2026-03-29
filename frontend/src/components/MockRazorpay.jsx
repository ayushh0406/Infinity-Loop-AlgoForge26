import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, CheckCircle, X, ShieldCheck, Loader2 } from 'lucide-react';

const MockRazorpay = ({ amount, email, onSuccess, onClose }) => {
  const [step, setStep] = useState('METHODS'); // METHODS, PROCESSING, SUCCESS
  const [selectedMethod, setSelectedMethod] = useState('');

  const initiatePayment = (method) => {
    setSelectedMethod(method);
    setStep('PROCESSING');
    
    // Simulate Razorpay network processing
    setTimeout(() => {
      setStep('SUCCESS');
      // Wait for success animation then trigger callback
      setTimeout(() => {
        onSuccess({ paymentId: 'pay_' + Math.random().toString(36).substr(2, 9) });
      }, 1500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[380px] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#02042b] p-4 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg tracking-wide border-2 border-white/20 px-2 py-0.5 rounded backdrop-blur">
              <span className="text-[#3395FF]">Trust</span>Pool
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-xs">Test Mode</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-slate-300 text-sm">{email}</p>
            <p className="text-2xl font-bold">₹{amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-slate-50 min-h-[300px] flex flex-col relative">
          
          {step === 'METHODS' && (
            <div className="p-4 flex-1">
              <p className="text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">Cards, UPI & More</p>
              
              <button 
                onClick={() => initiatePayment('UPI')}
                className="w-full flex items-center justify-between p-4 mb-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">UPI</h4>
                    <p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => initiatePayment('CARD')}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Card</h4>
                    <p className="text-xs text-slate-500">Visa, MasterCard, RuPay</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <Loader2 className="w-12 h-12 text-[#3395FF] animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Processing Payment</h3>
              <p className="text-slate-500 text-sm">Please do not press back or close this window.</p>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-4 scale-110">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Payment Successful</h3>
              <p className="text-slate-500 text-sm">Redirecting to TrustPool...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3 border-t border-slate-200 flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
          <ShieldCheck size={14} /> <span>Secured by <span className="text-slate-600 font-bold">Razorpay</span> Sandbox</span>
        </div>

      </div>
    </div>
  );
};

export default MockRazorpay;
