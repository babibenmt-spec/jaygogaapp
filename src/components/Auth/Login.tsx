import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Milk, Loader2 } from 'lucide-react';

interface LoginProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggleMode, onForgotPassword }) => {
  const { login, authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.message || 'Invalid email or password');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600">Sign in to Jay Goga Milk</p>
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
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
              placeholder="Enter your password"
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
          {authLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
        </motion.button>
      </form>

      <div className="mt-4 flex justify-between items-center text-sm">
        <button
          onClick={onForgotPassword}
          className="text-gray-600 hover:text-dairy-700 font-medium"
        >
          Forgot Password?
        </button>
        <button
          onClick={onToggleMode}
          className="text-dairy-600 hover:text-dairy-700 font-medium"
        >
          Don't have an account?
        </button>
      </div>
    </motion.div>
  );
};

export default Login;
