import { inEu } from '#features/ports/Port.ts';
import { canalDays, type Segment, type VoyageDays } from '#features/routing/duration.ts';
import type { RouteLeg, RoutePoint, RouteResult } from '#features/routing/RouteResult.ts';
import { inEca } from '#features/routing/routingService.ts';
import type { VesselProfile } from '#features/vessel/VesselProfile.ts';
import { sumOf } from '#shared/collections.ts';
import type { FigureReader } from '#shared/figures.ts';
import type { FuelGrade } from './fuels.ts';

export interface Burn {
  stage: Segment;
  grade: FuelGrade;
  quantity: number;
}

export function fuelUse(particular: FigureReader<VesselProfile>, hasScrubber: boolean, days: VoyageDays, { ballast, laden }: RouteResult): Burn[] {
  const grade = (lowSulphurZone: boolean): FuelGrade => (hasScrubber ? 'HFO' : lowSulphurZone ? 'MGO' : 'VLSFO');
  const atSea = (stage: Segment, mainEngine: number, ecaFraction: number): Burn[] => {
    const quantity = days[stage] * (mainEngine + particular('auxiliaryAtSea'));
    return [
      { stage, grade: grade(true), quantity: quantity * ecaFraction },
      { stage, grade: grade(false), quantity: quantity * (1 - ecaFraction) },
    ];
  };
  const atBerth = (stage: Segment, port: RoutePoint): Burn => ({
    stage,
    grade: grade(inEca(port) || inEu(port)),
    quantity: days[stage] * (particular('auxiliaryInPort') + particular('boilerInPort')),
  });
  const inCanal = (leg: RouteLeg, mainEngine: 'ballastConsumption' | 'ladenConsumption'): number => {
    const transitDays = canalDays(leg);
    return transitDays === 0 ? 0 : transitDays * (particular(mainEngine) + particular('auxiliaryAtSea'));
  };
  const inCanals: Burn = { stage: 'canals', grade: grade(false), quantity: inCanal(ballast, 'ballastConsumption') + inCanal(laden, 'ladenConsumption') };
  return [
    ...atSea('ballast', particular('ballastConsumption'), ballast.ecaFraction),
    ...atSea('laden', particular('ladenConsumption'), laden.ecaFraction),
    atBerth('loading', laden.from),
    atBerth('discharge', laden.to),
    inCanals,
  ];
}

export function totalQuantity(burns: readonly Burn[]): number {
  return sumOf(burns, ({ quantity }) => quantity);
}
