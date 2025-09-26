import { Unit } from '../types';

export interface PredefinedUnit {
  label: string;
  quantity: number;
  unit: Unit;
}

export const liquidUnitOptions: PredefinedUnit[] = [
  { label: '100 ml', quantity: 100, unit: 'ml' },
  { label: '200 ml', quantity: 200, unit: 'ml' },
  { label: '250 ml', quantity: 250, unit: 'ml' },
  { label: '500 ml', quantity: 500, unit: 'ml' },
  { label: '1 L', quantity: 1, unit: 'L' },
  { label: '1.5 L', quantity: 1.5, unit: 'L' },
  { label: '2 L', quantity: 2, unit: 'L' },
];

export const solidUnitOptions: PredefinedUnit[] = [
  { label: '100 gm', quantity: 100, unit: 'gm' },
  { label: '200 gm', quantity: 200, unit: 'gm' },
  { label: '250 gm', quantity: 250, unit: 'gm' },
  { label: '500 gm', quantity: 500, unit: 'gm' },
  { label: '1 kg', quantity: 1, unit: 'kg' },
  { label: '1.5 kg', quantity: 1.5, unit: 'kg' },
  { label: '2 kg', quantity: 2, unit: 'kg' },
];

export const pieceUnitOptions: PredefinedUnit[] = [
  { label: '1 piece', quantity: 1, unit: 'piece' },
  { label: '2 pieces', quantity: 2, unit: 'piece' },
  { label: '5 pieces', quantity: 5, unit: 'piece' },
  { label: '10 pieces', quantity: 10, unit: 'piece' },
];

export const allUnits: Unit[] = ['ml', 'L', 'gm', 'kg', 'piece'];
