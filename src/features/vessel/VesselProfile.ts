import type { FieldSpec } from '#shared/fields.ts';
import { GRAMS_PER_TONNE, HOURS_PER_DAY } from '#shared/units.ts';
import type { VesselParticulars } from './VesselCandidate.ts';
import { VESSEL_TYPES, type VesselType } from './vessel.data.ts';

const SERVICE_LOAD = 0.75;
const BALLAST_DISPLACEMENT = 0.78;
const ECO_SFOC = 165;
const CONVENTIONAL_SFOC = 185;
const ECO_BUILT_YEAR = 2015;
const MAX_SPEED = 30;

type Condition = 'ballast' | 'laden';

const CONDITIONS = ['ballast', 'laden'] as const satisfies readonly Condition[];

const CONDITION_KEYS = {
  ballast: { speed: 'ballastSpeed', consumption: 'ballastConsumption' },
  laden: { speed: 'ladenSpeed', consumption: 'ladenConsumption' },
} as const;

interface SpeedPoint {
  speed: number;
  consumption: number;
}

export interface VesselProfile extends VesselParticulars {
  engineModel: string;
  ratedPower: number | null;
  hasScrubber: boolean;
  ballastSpeed: number;
  ladenSpeed: number;
  ballastConsumption: number | null;
  ladenConsumption: number | null;
  auxiliaryAtSea: number;
  auxiliaryInPort: number;
  boilerInPort: number;
  operatingCost: number | null;
  hullAndMachineryValue: number;
  consumptionBasis: Record<Condition, SpeedPoint | null>;
}

export const VESSEL_FIELDS = {
  general: [
    { kind: 'readOnly', id: 'name', label: 'Name' },
    { kind: 'readOnly', id: 'type', label: 'Vessel Type' },
    { kind: 'readOnly', id: 'builtYear', label: 'Built Year' },
    { kind: 'readOnly', id: 'flag', label: 'Flag' },
    { kind: 'number', id: 'deadweight', label: 'Deadweight', unit: 'tonnes', positive: true },
    { kind: 'number', id: 'grossTonnage', label: 'Gross Tonnage', positive: true, integer: true, empty: 'zero' },
    { kind: 'number', id: 'lengthOverall', label: 'Length Overall', unit: 'm', digits: 1, positive: true, empty: 'zero' },
    { kind: 'number', id: 'beam', label: 'Beam', unit: 'm', digits: 1, positive: true, empty: 'zero' },
    { kind: 'number', id: 'maxDraft', label: 'Draught', unit: 'm', digits: 1, positive: true, empty: 'zero' },
  ],
  machinery: [
    { kind: 'text', id: 'engineModel', label: 'Engine Model' },
    { kind: 'number', id: 'ratedPower', label: 'Rated Power', unit: 'kW', positive: true, empty: 'zero' },
    { kind: 'checkbox', id: 'hasScrubber', label: 'Scrubber', boxLabel: 'Fitted' },
  ],
  speed: [
    { kind: 'number', id: 'ballastSpeed', label: 'Ballast Speed', unit: 'kn', digits: 1, positive: true, max: MAX_SPEED },
    { kind: 'number', id: 'ladenSpeed', label: 'Laden Speed', unit: 'kn', digits: 1, positive: true, max: MAX_SPEED },
    { kind: 'number', id: 'ballastConsumption', label: 'Ballast Consumption', unit: 'tonnes/day', digits: 1, empty: 'zero' },
    { kind: 'number', id: 'ladenConsumption', label: 'Laden Consumption', unit: 'tonnes/day', digits: 1, empty: 'zero' },
  ],
  auxiliaries: [
    { kind: 'number', id: 'auxiliaryAtSea', label: 'Auxiliary at Sea', unit: 'tonnes/day', digits: 1, empty: 0 },
    { kind: 'number', id: 'auxiliaryInPort', label: 'Auxiliary in Port', unit: 'tonnes/day', digits: 1, empty: 0 },
    { kind: 'number', id: 'boilerInPort', label: 'Boiler in Port', unit: 'tonnes/day', digits: 1, empty: 0 },
  ],
  financials: [
    { kind: 'number', id: 'operatingCost', label: 'Operating Cost', unit: '$/day', empty: 'zero' },
    { kind: 'number', id: 'hullAndMachineryValue', label: 'Hull and Machinery Value', unit: '$', empty: 0 },
  ],
} satisfies Record<string, readonly FieldSpec<VesselProfile>[]>;

export const VESSEL_FIELD_LIST: readonly FieldSpec<VesselProfile>[] = Object.values(VESSEL_FIELDS).flat();

export function vesselProfile(particulars: VesselParticulars): VesselProfile {
  const { ballastSpeed, ladenSpeed, auxiliaryAtSea, auxiliaryInPort, boilerInPort } = VESSEL_TYPES[particulars.type];
  return {
    ...particulars,
    engineModel: '',
    ratedPower: null,
    hasScrubber: false,
    ballastSpeed,
    ladenSpeed,
    ballastConsumption: null,
    ladenConsumption: null,
    auxiliaryAtSea,
    auxiliaryInPort,
    boilerInPort,
    operatingCost: operatingCost(particulars),
    hullAndMachineryValue: 0,
    consumptionBasis: { ballast: null, laden: null },
  };
}

export function reviseVesselProfile(profile: VesselProfile, patch: Partial<VesselProfile>): VesselProfile {
  const revised = { ...profile, ...patch };
  const ratedPower = 'ratedPower' in patch ? revised.ratedPower : null;
  const rated = ratedPower !== null;
  const basis = rated ? ratedBasis(revised.type, revised.builtYear, ratedPower) : { ...profile.consumptionBasis };
  const derived: Partial<VesselProfile> = {};
  for (const condition of CONDITIONS) {
    const { speed, consumption } = CONDITION_KEYS[condition];
    const typed = patch[consumption];
    if (typed !== undefined) basis[condition] = typed === null ? null : { speed: revised[speed], consumption: typed };
    else if (rated || speed in patch) derived[consumption] = atSpeed(basis[condition], revised[speed]);
  }
  if ('deadweight' in patch) derived.operatingCost = operatingCost(revised);
  return { ...revised, ...derived, consumptionBasis: basis };
}

function operatingCost({ type, deadweight }: Pick<VesselParticulars, 'type' | 'deadweight'>): number {
  const { costIntercept, costSlope } = VESSEL_TYPES[type];
  return Math.round(Math.exp(costIntercept + costSlope * Math.log(deadweight)));
}

function ratedBasis(type: VesselType, builtYear: number | null, ratedPower: number): Record<Condition, SpeedPoint> {
  const sfoc = builtYear !== null && builtYear >= ECO_BUILT_YEAR ? ECO_SFOC : CONVENTIONAL_SFOC;
  const service = (ratedPower * SERVICE_LOAD * sfoc * HOURS_PER_DAY) / GRAMS_PER_TONNE;
  const speed = VESSEL_TYPES[type].ladenSpeed;
  return {
    ballast: { speed, consumption: service * BALLAST_DISPLACEMENT ** (2 / 3) },
    laden: { speed, consumption: service },
  };
}

function atSpeed(basis: SpeedPoint | null, speed: number): number | null {
  if (basis === null) return null;
  return Math.round(basis.consumption * (speed / basis.speed) ** 3 * 10) / 10;
}
