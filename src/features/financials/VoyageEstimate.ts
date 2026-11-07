import { bunkerCosts, type GradeCost } from '#features/bunkers/bunkerCosts.ts';
import type { FuelPrices } from '#features/bunkers/bunkerPrices.ts';
import { fuelUse, type Burn } from '#features/bunkers/consumption.ts';
import { CHARTER_TERMS, COMMISSIONS, totalCommission, type CharterParty, type CharterTerms, type Commission } from '#features/charterparty/CharterPartyTerms.ts';
import type { EmissionRates } from '#features/environmental/emissionRates.ts';
import { euEtsCost, scopedEmissions } from '#features/environmental/euEts.ts';
import { euBurns } from '#features/environmental/euScope.ts';
import { fuelEuPenalty } from '#features/environmental/fuelEu.ts';
import type { Port } from '#features/ports/Port.ts';
import { portCosts } from '#features/ports/portCosts.ts';
import { voyageDays, type VoyageDays } from '#features/routing/duration.ts';
import { panamaToll, suezToll, warRiskCost } from '#features/routing/routeCosts.ts';
import type { RouteResult } from '#features/routing/RouteResult.ts';
import type { RoutingSettings } from '#features/routing/routingService.ts';
import { cargoCapacity, parcelFit, type ParcelFit } from '#features/vessel/VesselCandidate.ts';
import type { VesselProfile } from '#features/vessel/VesselProfile.ts';
import { recordOf, sumOf } from '#shared/collections.ts';
import { figureReaders, type Blank } from '#shared/figures.ts';

export const CHARGES = ['portDues', 'agencyFees', 'suezToll', 'panamaToll', 'warRisk', 'euEts', 'fuelEu'] as const;

export type Charge = (typeof CHARGES)[number];

export interface EstimateInputs {
  vessel: VesselProfile;
  charterParty: CharterParty;
  loadPort: Port;
  dischargePort: Port;
  route: RouteResult;
  routingSettings: RoutingSettings;
  fuelPrices: FuelPrices;
  emissionRates: EmissionRates;
}

type FigureSources = Pick<EstimateInputs, 'vessel' | 'charterParty' | 'fuelPrices' | 'emissionRates'>;

export type EstimateBlank = Blank<FigureSources>;

export interface VoyageEstimate {
  inputs: EstimateInputs;
  terms: CharterTerms;
  capacity: number;
  fit: ParcelFit;
  days: VoyageDays;
  burns: Burn[];
  bunkers: GradeCost[];
  etsEmissions: number;
  charges: Record<Charge, number>;
  operatingCost: number;
  voyageExpenses: number;
  earningBasis: number;
  revenue: number;
  commissions: Record<Commission, number>;
  netRevenue: number;
  netProfit: number;
  timeCharterEquivalent: number;
  margin: number | null;
  breakEvenRate: number | null;
  blanks: EstimateBlank[];
}

export function voyageEstimate(inputs: EstimateInputs): VoyageEstimate {
  const { vessel, charterParty, loadPort, dischargePort, route, routingSettings, fuelPrices, emissionRates } = inputs;
  const { reader, blanks } = figureReaders<FigureSources>({ vessel, charterParty, fuelPrices, emissionRates });
  const term = reader('charterParty');
  const particular = reader('vessel');
  const rate = reader('emissionRates');
  const terms = CHARTER_TERMS[charterParty.charterType];

  const fit = parcelFit(term('quantity'), vessel.deadweight);
  const days = voyageDays({
    vessel,
    route,
    seaMargin: routingSettings.seaMargin,
    loadPort,
    dischargePort,
    loadingDuration: term('loadingDuration'),
    dischargingDuration: term('dischargingDuration'),
  });
  const burns = fuelUse(particular, vessel.hasScrubber, days, route);
  const bunkers = bunkerCosts(burns, reader('fuelPrices'));
  const grossTonnage = particular('grossTonnage');
  const scoped = euBurns(grossTonnage, burns, route);
  const etsEmissions = scopedEmissions(scoped);

  const charges: Record<Charge, number> = {
    ...portCosts(grossTonnage),
    suezToll: suezToll(vessel.type, route, particular),
    panamaToll: panamaToll(vessel.type, route, particular),
    warRisk: warRiskCost(vessel.hullAndMachineryValue, route, routingSettings.warRiskPremium),
    euEts: euEtsCost(etsEmissions, rate),
    fuelEu: fuelEuPenalty(scoped, rate),
  };
  const operatingCost = Math.round(particular('operatingCost') * days.total);
  const voyageExpenses = sumOf(bunkers, ({ cost }) => cost) + sumOf(CHARGES, (charge) => charges[charge]);
  const ownerExpenses = terms.ownerPaysVoyageExpenses ? voyageExpenses : 0;
  const ownerCost = ownerExpenses + operatingCost;

  const earningBasis = terms.basis === 'days' ? days.total : fit.cargoLifted;
  const revenue = Math.round(earningBasis * term('earningRate'));
  const commissions = recordOf(COMMISSIONS, (commission) => Math.round(revenue * charterParty[commission]));
  const netRevenue = revenue - sumOf(COMMISSIONS, (commission) => commissions[commission]);
  const netProfit = netRevenue - ownerCost;
  const netShare = 1 - totalCommission(charterParty);

  return {
    inputs,
    terms,
    capacity: cargoCapacity(vessel.deadweight),
    fit,
    days,
    burns,
    bunkers,
    etsEmissions,
    charges,
    operatingCost,
    voyageExpenses,
    earningBasis,
    revenue,
    commissions,
    netRevenue,
    netProfit,
    timeCharterEquivalent: (netRevenue - ownerExpenses) / days.total,
    margin: revenue > 0 ? netProfit / revenue : null,
    breakEvenRate: netShare > 0 && earningBasis > 0 ? ownerCost / (netShare * earningBasis) : null,
    blanks: blanks(),
  };
}
