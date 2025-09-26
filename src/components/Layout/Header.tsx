import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-dairy-600 to-dairy-700 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-dairy-100 text-sm">Jay Goga Milk</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-dairy-100">Welcome</p>
            <p className="text-sm font-medium">{user?.username}</p>
          </div>
          <motion.button
            onClick={logout}
            className="p-2 bg-dairy-700 rounded-full hover:bg-dairy-800 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;
