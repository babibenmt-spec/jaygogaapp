import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Milk, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onToggleMode: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onToggleMode }) => {
  const { sendPasswordResetEmail, authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await sendPasswordResetEmail(email);
    if (!result.success) {
      setError(result.message || 'Failed to send reset link. Please try again.');
    } else {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Check Your Email</h2>
        <p className="text-gray-600 mt-2 mb-6">
          A password reset link has been sent to <strong>{email}</strong>. Please follow the instructions in the email to reset your password.
        </p>
        <motion.button
          onClick={onToggleMode}
          className="w-full bg-dairy-600 text-white py-3 rounded-lg font-medium hover:bg-dairy-700 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="inline-block mr-2" size={16} />
          Back to Sign In
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-dairy-100 rounded-full flex items-center justify-center mb-4">
          <Milk className="w-8 h-8 text-dairy-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        <p className="text-gray-600">Enter your email to receive a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
              placeholder="Enter your registered email"
              required
            />
          </div>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={authLoading}
          className="w-full bg-dairy-600 text-white py-3 rounded-lg font-medium hover:bg-dairy-700 transition-colors disabled:opacity-50 flex justify-center items-center"
          whileTap={{ scale: 0.98 }}
        >
          {authLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onToggleMode}
          className="text-dairy-600 hover:text-dairy-700 text-sm font-medium"
        >
          <ArrowLeft className="inline-block mr-1" size={14} /> Back to Sign In
        </button>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
