import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Package, Loader2, IndianRupee, Edit2, Save } from 'lucide-react';

const Keret: React.FC = () => {
  const { orders, products, dataLoading } = useAuth();
  const [boxConfigs, setBoxConfigs] = useLocalStorage<Record<string, number>>('boxConfigs', {});
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const productSummary = useMemo(() => {
    // Create a summary of sales for today
    const salesSummary: { [productId: string]: { totalQuantity: number; totalValue: number } } = {};
    const todayOrders = orders.filter(order => order.date === today);

    todayOrders.forEach(order => {
      order.items.forEach(item => {
        if (!salesSummary[item.product_id]) {
          salesSummary[item.product_id] = { totalQuantity: 0, totalValue: 0 };
        }
        salesSummary[item.product_id].totalQuantity += item.quantity;
        salesSummary[item.product_id].totalValue += item.total;
      });
    });

    // Map over ALL products and merge with sales data, preserving the original order
    const allProductsSummary = products.map(product => {
      const sales = salesSummary[product.id] || { totalQuantity: 0, totalValue: 0 };
      return {
        productId: product.id,
        name: product.name,
        totalQuantity: sales.totalQuantity,
        totalValue: sales.totalValue,
      };
    });

    return allProductsSummary;
  }, [orders, products, today]);

  const handleConfigChange = (productId: string, value: string) => {
    const pieces = parseInt(value, 10);
    setBoxConfigs(prev => ({
      ...prev,
      [productId]: isNaN(pieces) || pieces < 0 ? 0 : pieces,
    }));
  };

  const calculateBoxNeeds = (totalQuantity: number, piecesPerBox: number) => {
    if (piecesPerBox <= 0) {
      return null;
    }
    const fullBoxes = Math.floor(totalQuantity / piecesPerBox);
    const remainingPieces = totalQuantity % piecesPerBox;
    const neededForNextBox = remainingPieces === 0 ? 0 : piecesPerBox - remainingPieces;

    return { fullBoxes, remainingPieces, neededForNextBox };
  };

  if (dataLoading) {
    return (
      <Layout title="Keret Calculator">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-dairy-600" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Keret Calculator">
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Keret Requirements for Today</h2>
              <p className="text-gray-600 text-sm">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <motion.button
              onClick={() => setIsEditing(prev => !prev)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md ${isEditing ? 'bg-green-600 text-white' : 'bg-dairy-600 text-white'}`}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
              <span>{isEditing ? 'Save Config' : 'Edit Config'}</span>
            </motion.button>
          </div>
        </motion.div>

        {products.length > 0 ? (
          <div className="space-y-3">
            {/* Header for larger screens */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-3 pb-2 border-b text-xs text-gray-500 font-bold uppercase tracking-wider">
              <div className="md:col-span-3">Product</div>
              <div className="md:col-span-3">Sales / Config</div>
              <div className="md:col-span-4 text-center">Calculation</div>
              <div className="md:col-span-2 text-right">Value</div>
            </div>

            {productSummary.map(({ productId, name, totalQuantity, totalValue }, index) => {
              const piecesPerBox = boxConfigs[productId] || 0;
              const calculation = calculateBoxNeeds(totalQuantity, piecesPerBox);
              
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 md:gap-4 md:items-center">
                    {/* Product Name & Total Value (stacked on mobile) */}
                    <div className="md:col-span-3 flex justify-between items-center md:block mb-2 md:mb-0">
                      <h3 className="font-semibold text-gray-800 truncate pr-2">{name}</h3>
                      <div className="md:hidden text-right">
                        <p className="font-bold text-sm text-dairy-700 flex items-center"><IndianRupee size={12} />{totalValue.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Inputs (Total sold & pcs/box) */}
                    <div className="md:col-span-3 flex items-center justify-around md:justify-start space-x-4 bg-gray-50 p-2 rounded-lg md:bg-transparent md:p-0">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Sold</p>
                        <p className="font-bold text-gray-800">{totalQuantity}</p>
                      </div>
                      
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={boxConfigs[productId] || ''}
                            onChange={(e) => handleConfigChange(productId, e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-dairy-500"
                            placeholder="Pcs/Box"
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Pcs/Box</p>
                          <p className="font-bold text-gray-800">{piecesPerBox > 0 ? piecesPerBox : '-'}</p>
                        </div>
                      )}
                    </div>

                    {/* Calculations */}
                    <div className="md:col-span-4 mt-3 md:mt-0">
                      {calculation ? (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <p className="text-lg font-bold text-blue-700">{calculation.fullBoxes}</p>
                            <p className="text-xs text-blue-600">Boxes</p>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded-lg">
                            <p className="text-lg font-bold text-yellow-700">{calculation.remainingPieces}</p>
                            <p className="text-xs text-yellow-600">Loose</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded-lg">
                            <p className="text-lg font-bold text-green-700">{calculation.neededForNextBox}</p>
                            <p className="text-xs text-green-600">Needed</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-4 md:py-0">Enter pcs/box to calculate</div>
                      )}
                    </div>
                    
                    {/* Total Value (desktop only) */}
                    <div className="hidden md:block md:col-span-2 text-right">
                       <p className="text-xs text-gray-500">Total Value</p>
                       <p className="font-bold text-dairy-700 flex items-center justify-end"><IndianRupee size={14} />{totalValue.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center"
          >
            <Package className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-600">Please add some products in the 'Products' section to see them here.</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Keret;
