import type { Position } from '#shared/geo.ts';
import type { VesselType } from './vessel.data.ts';

const CARGO_CAPACITY_SHARE = 0.95;

export interface VesselParticulars {
  imo: number;
  name: string;
  type: VesselType;
  flag: string;
  deadweight: number;
  grossTonnage: number | null;
  lengthOverall: number | null;
  beam: number | null;
  maxDraft: number | null;
  builtYear: number | null;
}

export interface VesselSighting extends Position {
  speed: number | null;
  destination: string;
  distance: number;
}

export interface VesselCandidate {
  particulars: VesselParticulars;
  sighting: VesselSighting;
}

export interface ParcelFit {
  cargoLifted: number;
  shortLoad: number;
  utilisation: number;
}

export function vesselLabel({ name, imo }: Pick<VesselParticulars, 'name' | 'imo'>): string {
  return name || `IMO ${imo}`;
}

// The capacity is a share of the deadweight only, so the estimate assumes every cargo weighs out before it cubes out.
// The stowage factor of a dry cargo and the density of a wet one (see CargoProfile) are shown but never read here.
// A light cargo such as coal or grain can fill the holds or tanks well short of this tonnage, which makes
// the cargo lifted, and with it the freight and the screening, too optimistic for it. Checking the parcel volume
// against the grain or tank capacity of the ship would need that capacity, which the vessel feed does not supply.
export function cargoCapacity(deadweight: number): number {
  return deadweight * CARGO_CAPACITY_SHARE;
}

export function parcelFit(parcel: number, deadweight: number): ParcelFit {
  const capacity = cargoCapacity(deadweight);
  const cargoLifted = Math.min(parcel, capacity);
  return {
    cargoLifted,
    shortLoad: (parcel - cargoLifted) / parcel,
    utilisation: cargoLifted / capacity,
  };
}
