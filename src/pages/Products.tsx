import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Product, Unit } from '../types';
import { Plus, Edit2, Trash2, Package, Calculator, Loader2 } from 'lucide-react';
import PriceCalculator from '../components/Products/PriceCalculator';
import ProductImage from '../components/Products/ProductImage';

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, dataLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    unit: 'ml' as Unit,
    photo: ''
  });
  const [openCalculatorId, setOpenCalculatorId] = useState<string | null>(null);

  const units: Unit[] = ['ml', 'L', 'gm', 'kg', 'piece'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        photo: formData.photo,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      
      handleCancel();
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      unit: product.unit,
      photo: product.photo || ''
    });
    setEditingProduct(product);
    setShowForm(true);
    setOpenCalculatorId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error("Failed to delete product", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', price: '', quantity: '', unit: 'ml', photo: '' });
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <Layout title="My Products">
      <div className="px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Products</h2>
          <motion.button
            onClick={() => { setShowForm(true); setEditingProduct(null); setOpenCalculatorId(null); }}
            className="bg-dairy-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            <span>Add Product</span>
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
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name (Gujarati)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                    placeholder="દૂધ, છાસ, દહીં..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                      placeholder="e.g., 500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as Unit }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (for the quantity above)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                      placeholder="₹"
                      required
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent"
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-dairy-600 text-white py-3 rounded-lg font-medium flex justify-center items-center"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (editingProduct ? 'Update Product' : 'Add Product')}
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
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center"
            >
              <Package className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Added</h3>
              <p className="text-gray-600 mb-4">Start by adding your dairy products</p>
              <motion.button
                onClick={() => setShowForm(true)}
                className="bg-dairy-600 text-white px-6 py-2 rounded-lg"
                whileTap={{ scale: 0.95 }}
              >
                Add First Product
              </motion.button>
            </motion.div>
          ) : (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <ProductImage photo={product.photo} name={product.name} />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-gray-700">₹{product.price.toFixed(2)}</span> for {product.quantity} {product.unit}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 bg-blue-100 rounded-lg"
                      whileTap={{ scale: 0.95 }}
                      title="Edit Product"
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 bg-red-100 rounded-lg"
                      whileTap={{ scale: 0.95 }}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setOpenCalculatorId(openCalculatorId === product.id ? null : product.id);
                        setShowForm(false);
                        setEditingProduct(null);
                      }}
                      className={`p-2 rounded-lg ${openCalculatorId === product.id ? 'bg-dairy-200 text-dairy-800' : 'bg-dairy-100 text-dairy-600'}`}
                      whileTap={{ scale: 0.95 }}
                      title="Calculate Price"
                    >
                      <Calculator size={16} />
                    </motion.button>
                  </div>
                </div>
                <AnimatePresence>
                  {openCalculatorId === product.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PriceCalculator product={product} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
