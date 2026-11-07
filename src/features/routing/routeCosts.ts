import type { VesselProfile } from '#features/vessel/VesselProfile.ts';
import { VESSEL_TYPES, type VesselType } from '#features/vessel/vessel.data.ts';
import { sumOf } from '#shared/collections.ts';
import type { FigureReader } from '#shared/figures.ts';
import type { RouteResult } from './RouteResult.ts';

const DOLLARS_PER_SDR = 1.3324;

const SUPER_BEAM = 27.74;
const NEOPANAMAX_BEAM = 32.61;
const NEOPANAMAX_LENGTH = 294.44;
const PANAMAX_DRAFT = 12.04;

export function suezToll(type: VesselType, { ballast, laden }: RouteResult, vessel: FigureReader<VesselProfile>): number {
  const tolls = VESSEL_TYPES[type].suezTolls;
  const legs = [[ballast, tolls.ballast], [laden, tolls.laden]] as const;
  const transits = legs.filter(([leg]) => leg.transits.includes('suez'));
  if (transits.length === 0) return 0;
  const grossTonnage = vessel('grossTonnage');
  return Math.round(sumOf(transits, ([, { a, b }]) => a * grossTonnage ** b) * DOLLARS_PER_SDR);
}

export function panamaToll(type: VesselType, { ballast, laden }: RouteResult, vessel: FigureReader<VesselProfile>): number {
  if (!ballast.transits.includes('panama') && !laden.transits.includes('panama')) return 0;
  const tariff = VESSEL_TYPES[type].panamaTolls;
  const beam = vessel('beam');
  const capacity = vessel(tariff.basis);
  const panamax = beam >= SUPER_BEAM ? tariff.super : tariff.regular;
  const oversize = beam > NEOPANAMAX_BEAM || vessel('lengthOverall') > NEOPANAMAX_LENGTH;
  const legs = [
    [ballast, (oversize ? tariff.neopanamax : panamax).ballast],
    [laden, (oversize || vessel('maxDraft') > PANAMAX_DRAFT ? tariff.neopanamax : panamax).laden],
  ] as const;
  return Math.round(sumOf(legs, ([leg, { a, b }]) => (leg.transits.includes('panama') ? a + b * capacity : 0)));
}

export function warRiskCost(hullAndMachineryValue: number, route: RouteResult, premium: number): number {
  return route.entersListedArea ? Math.round(hullAndMachineryValue * premium) : 0;
}
