import React, { useState, useMemo, useEffect } from 'react';
import { Product, Unit } from '../../types';
import { convert } from '../../utils/unitConverter';
import { allUnits } from '../../data/predefinedUnits';

interface PriceCalculatorProps {
  product: Product;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({ product }) => {
  const [quantity, setQuantity] = useState<string>('1');
  const [selectedUnit, setSelectedUnit] = useState<Unit>(product.unit);

  const convertibleUnits = useMemo(() => {
    if (product.unit === 'piece') {
      return ['piece'];
    }
    return allUnits.filter(u => u !== 'piece');
  }, [product.unit]);

  useEffect(() => {
    // Reset selected unit if it becomes invalid (e.g. product changes)
    if (!convertibleUnits.includes(selectedUnit)) {
      setSelectedUnit(product.unit);
    }
  }, [product.unit, convertibleUnits, selectedUnit]);

  const calculatedPrice = useMemo(() => {
    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || product.quantity <= 0) {
      return null;
    }
    
    // Convert the user-entered quantity and unit to the product's base unit
    const convertedInputQuantity = convert(numQuantity, selectedUnit, product.unit);

    // Calculate the price per single unit of the product's base unit
    const pricePerProductUnit = product.price / product.quantity;
    
    // Final price is the converted input quantity multiplied by the price per base unit
    return convertedInputQuantity * pricePerProductUnit;
  }, [quantity, selectedUnit, product]);

  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-dairy-500 focus:border-dairy-500"
            placeholder="e.g., 1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Unit
          </label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value as Unit)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-dairy-500 focus:border-dairy-500 disabled:bg-gray-100"
            disabled={product.unit === 'piece'}
          >
            {convertibleUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      {calculatedPrice !== null ? (
        <div className="text-center bg-dairy-50 p-2 rounded-md border border-dairy-100">
          <p className="text-sm text-dairy-800">Calculated Price:</p>
          <p className="text-lg font-bold text-dairy-700">
            ₹{calculatedPrice.toFixed(2)}
          </p>
        </div>
      ) : (
        <div className="text-center bg-red-50 p-2 rounded-md border border-red-100">
          <p className="text-sm text-red-700">Please enter a valid quantity.</p>
        </div>
      )}
    </div>
  );
};

export default PriceCalculator;
