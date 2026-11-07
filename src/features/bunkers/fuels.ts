export const FUEL_GRADES = ['HFO', 'VLSFO', 'MGO'] as const;
export type FuelGrade = (typeof FUEL_GRADES)[number];

export const CALORIFIC_VALUE: Record<FuelGrade, number> = {
  HFO: 40_500,
  VLSFO: 40_500,
  MGO: 42_700,
};

export const WELL_TO_TANK: Record<FuelGrade, number> = {
  HFO: 13.5,
  VLSFO: 13.5,
  MGO: 14.4,
};

const CARBON_DIOXIDE: Record<FuelGrade, number> = {
  HFO: 3.114,
  VLSFO: 3.114,
  MGO: 3.206,
};

const METHANE = 0.00005;
const NITROUS_OXIDE = 0.00018;
const METHANE_WARMING_POTENTIAL = 28;
const NITROUS_OXIDE_WARMING_POTENTIAL = 265;

export function tankToWake(grade: FuelGrade): number {
  return CARBON_DIOXIDE[grade] + METHANE * METHANE_WARMING_POTENTIAL + NITROUS_OXIDE * NITROUS_OXIDE_WARMING_POTENTIAL;
}
