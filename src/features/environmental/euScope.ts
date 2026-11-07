import type { Burn } from '#features/bunkers/consumption.ts';
import { inEu } from '#features/ports/Port.ts';
import type { Segment } from '#features/routing/duration.ts';
import type { RouteLeg, RouteResult } from '#features/routing/RouteResult.ts';
import { sumOf } from '#shared/collections.ts';

const MINIMUM_TONNAGE = 5000;

export function euBurns(grossTonnage: number, burns: readonly Burn[], { ballast, laden }: RouteResult): Burn[] {
  if (grossTonnage < MINIMUM_TONNAGE) return [];
  const voyageShare = ({ from, to }: RouteLeg) => (Number(inEu(from)) + Number(inEu(to))) / 2;
  const transitLegs = [ballast, laden].filter(({ transits }) => transits.length > 0);
  const shares: Record<Segment, number> = {
    ballast: voyageShare(ballast),
    laden: voyageShare(laden),
    loading: Number(inEu(laden.from)),
    discharge: Number(inEu(laden.to)),
    canals: transitLegs.length === 0 ? 0 : sumOf(transitLegs, (leg) => leg.transits.length * voyageShare(leg)) / sumOf(transitLegs, (leg) => leg.transits.length),
  };
  return burns.map((burn) => ({ ...burn, quantity: burn.quantity * shares[burn.stage] })).filter(({ quantity }) => quantity > 0);
}
