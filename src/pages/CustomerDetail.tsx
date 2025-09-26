import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Customer, DailyOrder, OrderItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit2, Trash2, ShoppingCart, IndianRupee, Clock, CheckCircle, AlertTriangle, CreditCard, Loader2, Package, Home, Phone } from 'lucide-react';

interface DailySummary {
  date: string;
  orders: DailyOrder[];
  totalAmount: number;
  totalPaid: number;
  balance: number;
  allItems: OrderItem[];
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { customers, orders, updateCustomer, deleteCustomer, updateOrder, dataLoading } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ show: boolean; summary: DailySummary | null }>({ show: false, summary: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({ name: '', address: '', contact_number: '' });

  const customer = useMemo(() => customers.find(c => c.id === id), [customers, id]);
  
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        address: customer.address,
        contact_number: customer.contact_number,
      });
    }
  }, [customer]);

  const customerOrders = useMemo(() => {
    if (!id) return [];
    return orders
      .filter(o => o.customer_id === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, id]);

  const dailySummaries = useMemo((): DailySummary[] => {
    if (!customerOrders) return [];

    const groupedByDate = customerOrders.reduce((acc, order) => {
        const date = order.date;
        if (!acc[date]) {
            acc[date] = {
                date: date,
                orders: [],
                totalAmount: 0,
                totalPaid: 0,
                balance: 0,
                allItems: [],
            };
        }
        acc[date].orders.push(order);
        acc[date].totalAmount += order.total_amount;
        acc[date].totalPaid += order.amount_paid || 0;
        acc[date].allItems.push(...order.items);
        return acc;
    }, {} as Record<string, Omit<DailySummary, 'balance'>>);

    return Object.values(groupedByDate).map(summary => ({
        ...summary,
        balance: summary.totalAmount - summary.totalPaid,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customerOrders]);

  const stats = useMemo(() => {
    const totalOrdersValue = dailySummaries.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPaid = dailySummaries.reduce((sum, s) => sum + s.totalPaid, 0);
    return {
      totalOrders: customerOrders.length,
      totalSpent: totalPaid,
      pendingAmount: totalOrdersValue - totalPaid,
    };
  }, [dailySummaries, customerOrders.length]);

  const statCards = [
    { icon: ShoppingCart, label: 'Total Orders', value: stats.totalOrders, color: 'bg-blue-100 text-blue-600' },
    { icon: IndianRupee, label: 'Total Paid', value: `₹${stats.totalSpent.toFixed(2)}`, color: 'bg-green-100 text-green-600' },
    { icon: Clock, label: 'Pending Amount', value: `₹${stats.pendingAmount.toFixed(2)}`, color: 'bg-orange-100 text-orange-600' },
  ];

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateCustomer(id, formData);
      setShowEditForm(false);
    } catch (error) {
      console.error("Failed to update customer", error);
      alert("Failed to update customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await deleteCustomer(id);
      setShowDeleteConfirm(false);
      navigate('/customers', { replace: true });
    } catch (error) {
      console.error("Failed to delete customer", error);
      alert("Failed to delete customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (summary: DailySummary) => {
    setPaymentModal({ show: true, summary });
    setPaymentAmount('');
  };

  const handleSavePayment = async () => {
    if (!paymentModal.summary) return;

    let amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const balance = paymentModal.summary.balance;
    if (amountToPay > balance) {
      if (!window.confirm(`Payment (₹${amountToPay.toFixed(2)}) is more than the balance (₹${balance.toFixed(2)}). Record as overpayment?`)) {
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const updates: { orderId: string, newAmountPaid: number }[] = [];
      const pendingOrders = paymentModal.summary.orders
          .filter(o => (o.total_amount - (o.amount_paid || 0)) > 0)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (const order of pendingOrders) {
          if (amountToPay <= 0) break;
          const orderBalance = order.total_amount - (order.amount_paid || 0);
          const paymentForOrder = Math.min(amountToPay, orderBalance);
          updates.push({ orderId: order.id, newAmountPaid: (order.amount_paid || 0) + paymentForOrder });
          amountToPay -= paymentForOrder;
      }

      if (amountToPay > 0 && updates.length > 0) {
          const lastUpdate = updates[updates.length - 1];
          lastUpdate.newAmountPaid += amountToPay;
      } else if (amountToPay > 0) {
           const mostRecentOrder = paymentModal.summary.orders.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
           if(mostRecentOrder) {
              updates.push({ orderId: mostRecentOrder.id, newAmountPaid: (mostRecentOrder.amount_paid || 0) + amountToPay });
           }
      }
      
      await Promise.all(updates.map(u => updateOrder(u.orderId, { amount_paid: u.newAmountPaid })));

      setPaymentModal({ show: false, summary: null });
      setPaymentAmount('');
    } catch (error) {
      console.error("Failed to save payment", error);
      alert("Failed to save payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dataLoading) {
    return <div className="min-h-screen bg-milk-100 flex items-center justify-center"><Loader2 className="animate-spin text-dairy-600" size={32} /></div>;
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-milk-100 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">The customer you are looking for may have been deleted.</p>
          <motion.button onClick={() => navigate('/customers')} className="bg-dairy-600 text-white px-6 py-2 rounded-lg" whileTap={{ scale: 0.95 }}>
            Back to Customers
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-milk-100 pb-10">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center">
          <motion.button onClick={() => navigate('/customers')} className="p-2 mr-2 rounded-full hover:bg-gray-100" whileTap={{ scale: 0.9 }}>
            <ArrowLeft size={20} className="text-gray-700" />
          </motion.button>
          <h1 className="text-lg font-bold text-gray-800 truncate">Customer Details</h1>
        </div>
      </header>
      
      <main className="px-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-800">{customer.name}</h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Home size={14} className="mr-2 flex-shrink-0" />
                  <span>{customer.address}</span>
                </div>
                <div className="flex items-center">
                  <Phone size={14} className="mr-2 flex-shrink-0" />
                  <span>{customer.contact_number}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <motion.button onClick={() => setShowEditForm(true)} className="p-2 text-blue-600 bg-blue-100 rounded-lg" whileTap={{ scale: 0.95 }} title="Edit Customer">
                <Edit2 size={16} />
              </motion.button>
              <motion.button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-600 bg-red-100 rounded-lg" whileTap={{ scale: 0.95 }} title="Delete Customer">
                <Trash2 size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.1 }} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
              <div className={`p-2 rounded-full inline-block ${stat.color} mb-2`}>
                <stat.icon size={18} />
              </div>
              <p className="text-base font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order History</h3>
        {dailySummaries.length > 0 ? (
          <div className="space-y-4">
            {dailySummaries.map((summary, index) => (
              <motion.div key={summary.date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.05 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3 pb-3 border-b">
                  <h4 className="font-bold text-gray-800">{new Date(summary.date).toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                </div>

                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-600 mb-2 flex items-center"><Package size={16} className="mr-2 text-dairy-600"/>Items Ordered</h5>
                  <div className="space-y-1 text-sm text-gray-800 pl-4">
                    {summary.allItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-800">{item.product_name}</span>
                          <span className="text-gray-500 text-xs ml-2">x{item.quantity} @ ₹{item.price.toFixed(2)}</span>
                        </div>
                        <span className="font-medium">₹{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4 pt-3 border-t">
                  <div className="flex justify-between"><span className="text-gray-600">Day's Total:</span><span className="font-medium">₹{summary.totalAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Paid:</span><span className="font-medium text-green-600">₹{summary.totalPaid.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 font-bold">Balance:</span><span className={`font-bold ${summary.balance <= 0 ? 'text-green-700' : 'text-red-600'}`}>₹{summary.balance.toFixed(2)}</span></div>
                </div>
                
                <div className="flex justify-end items-center pt-3 border-t">
                  {summary.balance <= 0 ? (
                    <span className="flex items-center text-sm font-semibold text-green-600"><CheckCircle size={16} className="mr-2" />Fully Paid</span>
                  ) : (
                    <motion.button onClick={() => handleOpenPaymentModal(summary)} className="bg-dairy-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm" whileTap={{ scale: 0.95 }}>
                      <CreditCard size={16} />
                      <span>Record Payment</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <ShoppingCart className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-600">This customer has no orders yet.</p>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showEditForm && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-xl p-6 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Customer</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input type="text" value={formData.contact_number} onChange={e => setFormData(p => ({...p, contact_number: e.target.value}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
                <div className="flex space-x-3 pt-2">
                  <motion.button type="button" onClick={() => setShowEditForm(false)} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium" whileTap={{ scale: 0.98 }}>Cancel</motion.button>
                  <motion.button type="submit" disabled={isSubmitting} className="flex-1 bg-dairy-600 text-white py-3 rounded-lg font-medium flex justify-center items-center" whileTap={{ scale: 0.98 }}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Update'}</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {showDeleteConfirm && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-xl p-6 w-full max-w-sm text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Customer?</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{customer.name}</strong>? This action cannot be undone.</p>
              <div className="flex space-x-3"><motion.button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium" whileTap={{ scale: 0.98 }}>Cancel</motion.button><motion.button onClick={handleDeleteConfirm} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex justify-center items-center" whileTap={{ scale: 0.98 }}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Delete'}</motion.button></div>
            </motion.div>
          </motion.div>
        )}
        {paymentModal.show && paymentModal.summary && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-xl p-6 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Payment for {new Date(paymentModal.summary.date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Day's Total Amount:</span><span className="font-medium">₹{paymentModal.summary.totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Already Paid:</span><span className="font-medium text-green-600">₹{paymentModal.summary.totalPaid.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-600 font-bold">Balance Due:</span><span className="font-bold text-red-600">₹{paymentModal.summary.balance.toFixed(2)}</span></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter Amount to Pay</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="0.00" required />
                  </div>
                </div>
                <div className="flex space-x-3 pt-2">
                  <motion.button type="button" onClick={() => setPaymentModal({ show: false, summary: null })} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium" whileTap={{ scale: 0.98 }}>Cancel</motion.button>
                  <motion.button type="button" onClick={handleSavePayment} disabled={isSubmitting} className="flex-1 bg-dairy-600 text-white py-3 rounded-lg font-medium flex justify-center items-center" whileTap={{ scale: 0.98 }}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Payment'}</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDetail;
