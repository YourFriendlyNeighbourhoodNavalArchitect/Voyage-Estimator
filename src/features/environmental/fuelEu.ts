import type { Burn } from '#features/bunkers/consumption.ts';
import { CALORIFIC_VALUE, tankToWake, WELL_TO_TANK } from '#features/bunkers/fuels.ts';
import { sumOf } from '#shared/collections.ts';
import type { FigureReader } from '#shared/figures.ts';
import { GRAMS_PER_TONNE } from '#shared/units.ts';
import type { EmissionRates } from './emissionRates.ts';

const TARGET_INTENSITY = 89.3368;
const PENALTY = 2400;
const PENALTY_ENERGY = 41_000;

export function fuelEuPenalty(scoped: readonly Burn[], rate: FigureReader<EmissionRates>): number {
  const energy = sumOf(scoped, ({ grade, quantity }) => quantity * CALORIFIC_VALUE[grade]);
  const emissions = sumOf(scoped, ({ grade, quantity }) => quantity * (CALORIFIC_VALUE[grade] * WELL_TO_TANK[grade] + tankToWake(grade) * GRAMS_PER_TONNE));
  const deficit = emissions - TARGET_INTENSITY * energy;
  return deficit <= 0 ? 0 : Math.round((deficit / emissions) * (energy / PENALTY_ENERGY) * PENALTY * rate('euroRate'));
}
