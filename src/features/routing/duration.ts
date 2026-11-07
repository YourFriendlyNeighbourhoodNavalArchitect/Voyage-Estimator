import type { Port } from '#features/ports/Port.ts';
import type { VesselProfile } from '#features/vessel/VesselProfile.ts';
import { sumOf } from '#shared/collections.ts';
import { HOURS_PER_DAY } from '#shared/units.ts';
import type { RouteLeg, RouteResult } from './RouteResult.ts';

const TRANSIT_DURATION = 1;

export const SEGMENTS = ['ballast', 'laden', 'loading', 'discharge', 'canals'] as const;

export type Segment = (typeof SEGMENTS)[number];

export type VoyageDays = Record<Segment | 'total', number>;

interface VoyagePlan {
  vessel: Pick<VesselProfile, 'ballastSpeed' | 'ladenSpeed'>;
  route: RouteResult;
  seaMargin: number;
  loadPort: Port;
  dischargePort: Port;
  loadingDuration: number;
  dischargingDuration: number;
}

export function voyageDays({ vessel, route, seaMargin, loadPort, dischargePort, loadingDuration, dischargingDuration }: VoyagePlan): VoyageDays {
  const ballast = seaDays(route.ballast.distance, vessel.ballastSpeed, seaMargin);
  const laden = seaDays(route.laden.distance, vessel.ladenSpeed, seaMargin);
  const loading = portDays(loadingDuration, loadPort);
  const discharge = portDays(dischargingDuration, dischargePort);
  const canals = sumOf([route.ballast, route.laden], canalDays);
  return { ballast, laden, loading, discharge, canals, total: ballast + laden + loading + discharge + canals };
}

export function canalDays(leg: RouteLeg): number {
  return TRANSIT_DURATION * leg.transits.length;
}

function seaDays(distance: number, speed: number, seaMargin: number): number {
  return (distance / (speed * HOURS_PER_DAY)) * (1 + seaMargin);
}

function portDays(duration: number, { turnaround }: Port): number {
  return duration + turnaround / HOURS_PER_DAY;
}
