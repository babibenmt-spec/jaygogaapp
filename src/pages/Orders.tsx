import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Customer, Product, OrderItem } from '../types';
import { Calendar, Plus, ShoppingCart, Check, Clock, Trash2, AlertTriangle, Loader2, IndianRupee, User, Edit } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type OrderItemWithId = OrderItem & { clientId: string };

interface CustomerDailySummary {
  customerId: string;
  customerName: string;
  orderIds: string[];
  allItems: OrderItem[];
  totalAmount: number;
  amountPaid: number;
  status: 'pending' | 'delivered';
}

const Orders: React.FC = () => {
  const { orders, customers, products, addOrder, updateOrder, deleteOrder, dataLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for adding a new order
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithId[]>([]);
  
  // State for editing an existing order
  const [editingSummary, setEditingSummary] = useState<CustomerDailySummary | null>(null);
  const [editingOrderItems, setEditingOrderItems] = useState<OrderItemWithId[]>([]);

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; summary: CustomerDailySummary | null }>({ show: false, summary: null });

  const dailyOrders = useMemo(() => {
    return orders.filter(order => order.date === selectedDate);
  }, [orders, selectedDate]);

  const customerDailySummaries = useMemo((): CustomerDailySummary[] => {
    const summaryMap: Record<string, CustomerDailySummary> = {};

    for (const order of dailyOrders) {
        if (!summaryMap[order.customer_id]) {
            summaryMap[order.customer_id] = {
                customerId: order.customer_id,
                customerName: order.customer_name,
                orderIds: [],
                allItems: [],
                totalAmount: 0,
                amountPaid: 0,
                status: 'delivered',
            };
        }

        const summary = summaryMap[order.customer_id];
        summary.orderIds.push(order.id);
        summary.allItems.push(...order.items);
        summary.totalAmount += order.total_amount;
        summary.amountPaid += order.amount_paid || 0;
        if (order.status === 'pending') {
            summary.status = 'pending';
        }
    }
    
    Object.values(summaryMap).forEach(summary => {
        const aggregatedItems: Record<string, OrderItem> = {};
        summary.allItems.forEach(item => {
            const key = `${item.product_id}-${item.price}`;
            if (aggregatedItems[key]) {
                aggregatedItems[key].quantity += item.quantity;
                aggregatedItems[key].total += item.total;
            } else {
                aggregatedItems[key] = { ...item };
            }
        });
        summary.allItems = Object.values(aggregatedItems).sort((a,b) => a.product_name.localeCompare(b.product_name));
    });

    return Object.values(summaryMap).sort((a, b) => a.customerName.localeCompare(b.customerName));
  }, [dailyOrders]);

  const dailyTotal = useMemo(() => {
    return customerDailySummaries.reduce((sum, summary) => sum + summary.totalAmount, 0);
  }, [customerDailySummaries]);

  const handleAddOrderItem = (isEditing = false) => {
    if (products.length > 0) {
      const firstProduct = products[0];
      const newItem: OrderItemWithId = {
        clientId: uuidv4(),
        product_id: firstProduct.id,
        product_name: firstProduct.name,
        quantity: 0,
        unit: firstProduct.unit,
        price: firstProduct.price,
        total: 0
      };
      const setState = isEditing ? setEditingOrderItems : setOrderItems;
      setState(prev => [...prev, newItem]);
    }
  };

  const handleRemoveOrderItem = (clientId: string, isEditing = false) => {
    const setState = isEditing ? setEditingOrderItems : setOrderItems;
    setState(prev => prev.filter(item => item.clientId !== clientId));
  };

  const handleUpdateOrderItem = (clientId: string, field: 'product_id' | 'quantity', value: any, isEditing = false) => {
    const setState = isEditing ? setEditingOrderItems : setOrderItems;
    setState(prev => prev.map(item => {
      if (item.clientId !== clientId) return item;
      let updatedItem = { ...item };

      if (field === 'product_id') {
        const product = products.find(p => p.id === value);
        if (!product) return item;
        
        updatedItem = {
          ...item,
          product_id: product.id,
          product_name: product.name,
          unit: product.unit,
          price: product.price,
          quantity: 1,
        };
      } else if (field === 'quantity') {
        updatedItem.quantity = parseFloat(value) || 0;
      }
      
      const currentProduct = products.find(p => p.id === updatedItem.product_id);
      if(currentProduct) {
        updatedItem.price = currentProduct.price;
        updatedItem.total = updatedItem.quantity * currentProduct.price;
      }

      return updatedItem;
    }));
  };

  const handleSubmitOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const total_amount = orderItems.reduce((sum, item) => sum + item.total, 0);
      const newOrder = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        date: selectedDate,
        total_amount,
        amount_paid: 0,
        status: 'pending' as 'pending' | 'delivered',
      };
      const itemsToSave = orderItems.map(({ clientId, ...rest }) => rest);
      await addOrder(newOrder, itemsToSave);
      setShowOrderForm(false);
      setSelectedCustomer(null);
      setOrderItems([]);
    } catch (error) {
      console.error("Failed to create order", error);
      alert("Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (summary: CustomerDailySummary) => {
    setEditingSummary(summary);
    setEditingOrderItems(summary.allItems.map(item => ({ ...item, clientId: uuidv4() })));
    setShowOrderForm(false);
  };

  const handleCloseEditModal = () => {
    setEditingSummary(null);
    setEditingOrderItems([]);
  };

  const handleSaveEdit = async () => {
    if (!editingSummary) return;
    setIsSubmitting(true);
    try {
      const newTotalAmount = editingOrderItems.reduce((sum, item) => sum + item.total, 0);
      const itemsToSave = editingOrderItems.map(({ clientId, ...rest }) => rest);
      
      // Consolidate orders: delete all old ones and create a single new one
      await Promise.all(editingSummary.orderIds.map(id => deleteOrder(id)));

      if (itemsToSave.length > 0) {
        await addOrder({
          customer_id: editingSummary.customerId,
          customer_name: editingSummary.customerName,
          date: selectedDate,
          total_amount: newTotalAmount,
          amount_paid: editingSummary.amountPaid, // Preserve total payment
          status: editingSummary.status,
        }, itemsToSave);
      }

      handleCloseEditModal();
    } catch (error) {
      console.error("Failed to update order", error);
      alert("Failed to update order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (summary: CustomerDailySummary) => {
    const newStatus = summary.status === 'pending' ? 'delivered' : 'pending';
    setIsSubmitting(true);
    try {
      await Promise.all(
        summary.orderIds.map(orderId => updateOrder(orderId, { status: newStatus }))
      );
    } catch (error) {
      console.error("Failed to update status for all orders", error);
      alert("Failed to update orders status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (summary: CustomerDailySummary) => {
    setDeleteConfirmation({ show: true, summary });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.summary) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        deleteConfirmation.summary.orderIds.map(orderId => deleteOrder(orderId))
      );
      setDeleteConfirmation({ show: false, summary: null });
    } catch (error) {
      console.error("Failed to delete orders", error);
      alert("Failed to delete orders.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderFormTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const editFormTotal = editingOrderItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <Layout title="Daily Orders">
      <div className="px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Daily Orders</h2>
            <motion.button
              onClick={() => { setShowOrderForm(true); handleCloseEditModal(); }}
              className="bg-dairy-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg"
              whileTap={{ scale: 0.95 }}
              disabled={customers.length === 0 || products.length === 0}
            >
              <Plus size={20} />
              <span>Add Order</span>
            </motion.button>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="text-dairy-600" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
            />
          </div>
        </div>

        <AnimatePresence>
          {deleteConfirmation.show && deleteConfirmation.summary && (
            <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="bg-white rounded-xl p-6 w-full max-w-sm text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Orders?</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to delete all orders for <strong>{deleteConfirmation.summary.customerName}</strong> for this day? This action cannot be undone.</p>
                <div className="flex space-x-3">
                  <motion.button onClick={() => setDeleteConfirmation({ show: false, summary: null })} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium" whileTap={{ scale: 0.98 }}>Cancel</motion.button>
                  <motion.button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex justify-center items-center" whileTap={{ scale: 0.98 }}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Delete'}</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingSummary && (
            <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="bg-white rounded-xl p-4 w-full max-w-lg max-h-[90vh] flex flex-col" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Edit Order for {editingSummary.customerName}</h3>
                <p className="text-sm text-gray-500 mb-4">Date: {selectedDate}</p>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Order Items</label>
                    <motion.button onClick={() => handleAddOrderItem(true)} className="text-dairy-600 text-sm font-medium" whileTap={{ scale: 0.95 }}>+ Add Item</motion.button>
                  </div>
                  {editingOrderItems.map((item) => (
                    <div key={item.clientId} className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <select value={item.product_id} onChange={(e) => handleUpdateOrderItem(item.clientId, 'product_id', e.target.value, true)} className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg">
                            {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input type="number" value={item.quantity} onChange={(e) => handleUpdateOrderItem(item.clientId, 'quantity', e.target.value, true)} className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Qty" />
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-sm font-semibold text-gray-800">₹{item.total.toFixed(2)}</span>
                        </div>
                        <div className="col-span-1 text-right">
                          <motion.button onClick={() => handleRemoveOrderItem(item.clientId, true)} className="p-1 text-red-500 hover:text-red-700" whileTap={{ scale: 0.95 }}><Trash2 size={16} /></motion.button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {editingOrderItems.length > 0 && (<div className="text-right pt-2 mt-2 border-t"><span className="text-lg font-bold text-gray-800">Total: ₹{editFormTotal.toFixed(2)}</span></div>)}
                </div>

                <div className="flex space-x-3 mt-4 pt-4 border-t">
                  <motion.button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 bg-dairy-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex justify-center items-center" whileTap={{ scale: 0.98 }}>
                    {isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Changes'}
                  </motion.button>
                  <motion.button onClick={handleCloseEditModal} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium" whileTap={{ scale: 0.98 }}>
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {dataLoading ? (
          <div className="text-center p-8"><Loader2 className="mx-auto animate-spin text-dairy-600" size={32} /></div>
        ) : customers.length === 0 || products.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Setup Required</h3>
            <p className="text-gray-600">{customers.length === 0 ? 'Please add customers' : 'Please add products'} before creating orders.</p>
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              {showOrderForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Order</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                      <select value={selectedCustomer?.id || ''} onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent">
                        <option value="">Choose customer...</option>
                        {customers.map(customer => (<option key={customer.id} value={customer.id}>{customer.name}</option>))}
                      </select>
                    </div>

                    {selectedCustomer && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Order Items</label>
                          <motion.button onClick={() => handleAddOrderItem(false)} className="text-dairy-600 text-sm font-medium" whileTap={{ scale: 0.95 }}>+ Add Item</motion.button>
                        </div>
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                              <div key={item.clientId} className="p-3 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-5">
                                        <select value={item.product_id} onChange={(e) => handleUpdateOrderItem(item.clientId, 'product_id', e.target.value, false)} className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg">
                                            {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <input type="number" value={item.quantity} onChange={(e) => handleUpdateOrderItem(item.clientId, 'quantity', e.target.value, false)} className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Qty" />
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <span className="text-sm font-semibold text-gray-800">₹{item.total.toFixed(2)}</span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <motion.button onClick={() => handleRemoveOrderItem(item.clientId, false)} className="p-1 text-red-500 hover:text-red-700" whileTap={{ scale: 0.95 }}><Trash2 size={16} /></motion.button>
                                    </div>
                                </div>
                            </div>
                          ))}
                        </div>
                        {orderItems.length > 0 && (<div className="text-right pt-2 mt-2 border-t"><span className="text-lg font-bold text-gray-800">Total: ₹{orderFormTotal.toFixed(2)}</span></div>)}
                      </div>
                    )}
                    <div className="flex space-x-3 mt-4">
                      <motion.button onClick={handleSubmitOrder} disabled={!selectedCustomer || orderItems.length === 0 || isSubmitting} className="flex-1 bg-dairy-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex justify-center items-center" whileTap={{ scale: 0.98 }}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Create Order'}</motion.button>
                      <motion.button onClick={() => { setShowOrderForm(false); setSelectedCustomer(null); setOrderItems([]); }} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium" whileTap={{ scale: 0.98 }}>Cancel</motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Day's Summary</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="font-bold text-lg text-dairy-700 flex items-center justify-end"><IndianRupee size={16} className="mr-1"/>{dailyTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {customerDailySummaries.length === 0 && !showOrderForm ? (
                <div className="text-center py-8 px-4 bg-white rounded-xl">
                  <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders for This Date</h3>
                  <p className="text-gray-600">Start adding orders for this date</p>
                </div>
              ) : (
                customerDailySummaries.map(summary => (
                  <motion.div key={summary.customerId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-3 pb-3 border-b">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800 flex items-center"><User size={18} className="mr-2 text-dairy-600"/>{summary.customerName}</h3>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-bold text-lg text-dairy-700">₹{summary.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-2 my-3">
                        <h4 className="text-sm font-semibold text-gray-600 mb-1">Items</h4>
                        {summary.allItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                            <div>
                              <span className="font-medium">{item.product_name}</span>
                              <span className="text-gray-500 text-xs ml-2">x{item.quantity} @ ₹{item.price.toFixed(2)}</span>
                            </div>
                            <span className="font-semibold text-gray-900">₹{item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${summary.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {summary.status}
                        </span>
                        <div className="flex items-center space-x-2">
                          <motion.button onClick={() => handleToggleStatus(summary)} disabled={isSubmitting} className={`p-2 text-xs rounded-lg flex items-center space-x-1.5 font-medium ${summary.status === 'delivered' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`} whileTap={{ scale: 0.95 }}>
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : (summary.status === 'pending' ? <Check size={14} /> : <Clock size={14} />)}
                            <span>{summary.status === 'pending' ? 'Deliver' : 'Set Pending'}</span>
                          </motion.button>
                          <motion.button onClick={() => handleOpenEditModal(summary)} className="p-2 text-blue-600 bg-blue-100 rounded-lg" whileTap={{ scale: 0.95 }} title="Edit Orders"><Edit size={14} /></motion.button>
                          <motion.button onClick={() => handleDelete(summary)} className="p-2 text-red-600 bg-red-100 rounded-lg" whileTap={{ scale: 0.95 }} title="Delete Orders"><Trash2 size={14} /></motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
