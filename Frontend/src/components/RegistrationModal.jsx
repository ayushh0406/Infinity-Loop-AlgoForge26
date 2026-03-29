import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader } from 'lucide-react';
import { borrowerService } from '../services/borrowerService';
import Button from './ui/Button';

/**
 * Registration Modal - Shows after login to complete borrower profile
 */
export default function RegistrationModal({ user, isOpen, onComplete }) {
  const [formData, setFormData] = useState({
    user_id: user?.id || '',
    full_name: user?.name || '',
    age: '',
    gender: 'Male',
    email: user?.email || '',
    phone: '',
    city: '',
    occupation: '',
    monthly_income: '',
    employment_type: user?.type === 'Student' ? 'Student' : (user?.type === 'Gig Worker' ? 'Self-employed' : 'Salaried'),
    account_age_months: '',
    has_credit_history: false,
    education: '',
    marital_status: 'Single',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.phone || !formData.city || !formData.monthly_income || !formData.education) {
        throw new Error('Please fill all required fields');
      }

      // Submit profile
      const response = await borrowerService.saveBorrowerProfile({
        ...formData,
        age: parseInt(formData.age),
        monthly_income: parseFloat(formData.monthly_income),
        account_age_months: parseInt(formData.account_age_months) || 0,
      });

      if (response.success) {
        setSuccess(true);
        console.log('✅ Profile registered successfully');
        
        // Call onComplete after 1.5 seconds
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Error saving profile');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#060F24] border border-[rgba(255,255,255,0.1)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-[#060F24] to-[#060F24]/80 backdrop-blur-xl p-6 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                <p className="text-white/60 text-sm mt-1">Before you start, help us know you better</p>
              </div>
              <button
                onClick={onComplete}
                className="text-white/40 hover:text-white/60 transition-colors p-2"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
                    >
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                      <span className="text-red-200 text-sm">{error}</span>
                    </motion.div>
                  )}

                  {/* Grid Layout */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Your age"
                        min="18"
                        max="100"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Education */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Education *
                      </label>
                      <select
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      >
                        <option value="">Select education level</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="PhD">PhD</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Your city"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Occupation */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Occupation
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        placeholder="Your occupation"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Monthly Income */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Monthly Income (₹) *
                      </label>
                      <input
                        type="number"
                        name="monthly_income"
                        value={formData.monthly_income}
                        onChange={handleChange}
                        placeholder="50000"
                        min="0"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Employment Type
                      </label>
                      <select
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      >
                        <option value="Salaried">Salaried</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Student">Student</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Account Age */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Account Age (months)
                      </label>
                      <input
                        type="number"
                        name="account_age_months"
                        value={formData.account_age_months}
                        onChange={handleChange}
                        placeholder="24"
                        min="0"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Marital Status */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Marital Status
                      </label>
                      <select
                        name="marital_status"
                        value={formData.marital_status}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Credit History Checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <input
                      type="checkbox"
                      name="has_credit_history"
                      checked={formData.has_credit_history}
                      onChange={handleChange}
                      className="w-4 h-4 rounded"
                      disabled={loading}
                    />
                    <label className="text-white/80 text-sm cursor-pointer flex-1">
                      I have credit history
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onComplete}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Skip for now
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] text-white rounded-lg hover:from-[#3a7dd8] hover:to-[#7c2db8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center"
                  >
                    <Check size={32} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Profile Complete!</h3>
                  <p className="text-white/60 mb-6">
                    Your borrower profile has been registered. Now let's check your loan eligibility.
                  </p>
                  <div className="inline-block text-sm text-white/40">
                    Redirecting to dashboard...
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
