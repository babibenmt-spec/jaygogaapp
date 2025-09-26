import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import ForgotPassword from '../components/Auth/ForgotPassword';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgotPassword'>('login');

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return <Login onToggleMode={() => setMode('register')} onForgotPassword={() => setMode('forgotPassword')} />;
      case 'register':
        return <Register onToggleMode={() => setMode('login')} />;
      case 'forgotPassword':
        return <ForgotPassword onToggleMode={() => setMode('login')} />;
      default:
        return <Login onToggleMode={() => setMode('register')} onForgotPassword={() => setMode('forgotPassword')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dairy-50 to-dairy-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
