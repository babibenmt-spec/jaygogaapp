import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Orders from './pages/Orders';
import Statement from './pages/Statement';
import UpdatePassword from './pages/UpdatePassword';
import Keret from './pages/Keret';
import { Loader2 } from 'lucide-react';

const AppRoutes: React.FC = () => {
  const { user, authLoading, dataLoading } = useAuth();

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dairy-50 to-dairy-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 text-dairy-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Jay Goga Milk...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/statement" element={<Statement />} />
      <Route path="/keret" element={<Keret />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
