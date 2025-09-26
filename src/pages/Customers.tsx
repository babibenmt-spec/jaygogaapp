import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, ChevronRight, Loader2 } from 'lucide-react';

const Customers: React.FC = () => {
  const { customers, addCustomer, dataLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addCustomer({ 
        name: formData.name,
        address: formData.address,
        contact_number: formData.contact_number,
      });
      handleCancel();
    } catch (error) {
      console.error("Failed to add customer", error);
      alert("Failed to add customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', address: '', contact_number: '' });
    setShowForm(false);
  };

  return (
    <Layout title="My Customers">
      <div className="px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Customers</h2>
          <motion.button
            onClick={() => setShowForm(true)}
            className="bg-dairy-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            <span>Add Customer</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Add New Customer
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                    placeholder="Rameshભાઈ, Sureshભાઈ..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                    placeholder="Enter customer's address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                    placeholder="Enter customer's phone number"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-dairy-600 text-white py-3 rounded-lg font-medium flex justify-center items-center"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Customer'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {dataLoading ? (
            <div className="text-center p-8"><Loader2 className="mx-auto animate-spin text-dairy-600" size={32} /></div>
          ) : customers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center"
            >
              <Users className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Customers Added</h3>
              <p className="text-gray-600 mb-4">Start by adding your first customer</p>
              <motion.button
                onClick={() => setShowForm(true)}
                className="bg-dairy-600 text-white px-6 py-2 rounded-lg"
                whileTap={{ scale: 0.95 }}
              >
                Add First Customer
              </motion.button>
            </motion.div>
          ) : (
            customers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <Link to={`/customers/${customer.id}`} className="block p-4 hover:bg-gray-50 transition-colors rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{customer.name}</h3>
                    </div>

                    <div className="pl-2">
                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Customers;
