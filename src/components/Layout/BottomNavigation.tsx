import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Users, ShoppingCart, FileText, Box } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: FileText, label: 'Statement', path: '/statement' },
    { icon: Box, label: 'Keret', path: '/keret' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center p-2 rounded-lg w-1/6 ${
                isActive ? 'text-dairy-600' : 'text-gray-500'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1 text-center">{item.label}</span>
              {isActive && (
                <motion.div
                  className="absolute bottom-1 w-1 h-1 bg-dairy-600 rounded-full"
                  layoutId="activeTab"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
