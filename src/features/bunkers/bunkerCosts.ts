import type { FigureReader } from '#shared/figures.ts';
import type { FuelPrices } from './bunkerPrices.ts';
import { totalQuantity, type Burn } from './consumption.ts';
import { FUEL_GRADES, type FuelGrade } from './fuels.ts';

export interface GradeCost {
  grade: FuelGrade;
  quantity: number;
  price: number;
  cost: number;
}

export function bunkerCosts(burns: readonly Burn[], price: FigureReader<FuelPrices>): GradeCost[] {
  return FUEL_GRADES.flatMap((grade): GradeCost[] => {
    const quantity = totalQuantity(burns.filter((burn) => burn.grade === grade));
    if (quantity === 0) return [];
    const unitPrice = price(grade);
    return [{ grade, quantity, price: unitPrice, cost: Math.round(quantity * unitPrice) }];
  });
}
