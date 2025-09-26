import { Unit } from '../types';

const conversionFactors: { [key in Unit]?: number } = {
  // We assume 1g/ml density for dairy products
  ml: 1,
  gm: 1,
  L: 1000,
  kg: 1000,
};

/**
 * Converts a value from one unit to another.
 * Assumes 1g/ml density, allowing conversion between volume and weight.
 * @returns The converted value, or the original value if units are incompatible (e.g., involving 'piece').
 */
export const convert = (value: number, fromUnit: Unit, toUnit: Unit): number => {
  if (fromUnit === toUnit) {
    return value;
  }

  // 'piece' is not convertible to/from other units
  if (fromUnit === 'piece' || toUnit === 'piece') {
    return value;
  }

  const fromFactor = conversionFactors[fromUnit];
  const toFactor = conversionFactors[toUnit];

  if (fromFactor && toFactor) {
    // Convert value to base unit (ml/gm), then to target unit
    const baseValue = value * fromFactor;
    return baseValue / toFactor;
  }

  // Fallback for any unforeseen case
  return value;
};
