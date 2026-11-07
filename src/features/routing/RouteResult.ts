import type { Coordinates, Position } from '#shared/geo.ts';

export interface RoutePoint extends Position {
  label: string;
  code: string | null;
}

export type Canal = 'suez' | 'panama';

export interface RouteLeg {
  from: RoutePoint;
  to: RoutePoint;
  distance: number;
  ecaFraction: number;
  transits: readonly Canal[];
  geometry: Coordinates[][];
}

export interface RouteResult {
  ballast: RouteLeg;
  laden: RouteLeg;
  entersListedArea: boolean;
}

export function voyageDistances({ ballast, laden }: RouteResult): { label: string; distance: number }[] {
  return [
    { label: 'Ballast Distance', distance: ballast.distance },
    { label: 'Laden Distance', distance: laden.distance },
    { label: 'Total Distance', distance: ballast.distance + laden.distance },
  ];
}
