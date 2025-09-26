import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react';

const UpdatePassword = () => {
  const { updatePassword, authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUpdated, setIsUpdated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    
    const result = await updatePassword(password);
    if (!result.success) {
      setError(result.message || 'Failed to update password. Please try again.');
    } else {
      setIsUpdated(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  };

  if (isUpdated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dairy-50 to-dairy-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Password Updated!</h2>
          <p className="text-gray-600 mt-2 mb-6">
            Your password has been successfully updated. Redirecting you to the dashboard...
          </p>
          <Loader2 className="animate-spin mx-auto text-dairy-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dairy-50 to-dairy-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Set New Password</h2>
          <p className="text-gray-600">Please enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                placeholder="Confirm new password"
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
            {authLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
          </motion.button>
        </form>
        <button
          onClick={logout}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium mt-4 w-full text-center"
        >
          Cancel and Logout
        </button>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;
