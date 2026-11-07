import type { CargoClass } from '#features/cargo/CargoProfile.ts';

interface Coefficients {
  a: number;
  b: number;
}

interface TollConditions {
  laden: Coefficients;
  ballast: Coefficients;
}

interface PanamaTariff {
  basis: 'deadweight' | 'grossTonnage';
  regular: TollConditions;
  super: TollConditions;
  neopanamax: TollConditions;
}

interface VesselTypeProfile {
  feedTypes: readonly string[];
  carries: readonly CargoClass[];
  ballastSpeed: number;
  ladenSpeed: number;
  auxiliaryAtSea: number;
  auxiliaryInPort: number;
  boilerInPort: number;
  costIntercept: number;
  costSlope: number;
  suezTolls: TollConditions;
  panamaTolls: PanamaTariff;
}

const DRY_BULK_SUEZ: TollConditions = { laden: { a: 1269, b: 0.4978 }, ballast: { a: 1533, b: 0.4633 } };
const TANKER_SUEZ_BALLAST: Coefficients = { a: 478.1, b: 0.5835 };

const DRY_BULK_PANAMA: PanamaTariff = {
  basis: 'deadweight',
  regular: { laden: { a: 94_650, b: 1.65 }, ballast: { a: 85_650, b: 1.4025 } },
  super: { laden: { a: 134_650, b: 1.5 }, ballast: { a: 119_650, b: 1.275 } },
  neopanamax: { laden: { a: 348_620, b: 0.8 }, ballast: { a: 303_620, b: 0.68 } },
};

const TANKER_PANAMA: PanamaTariff = {
  basis: 'grossTonnage',
  regular: { laden: { a: 94_650, b: 4.98 }, ballast: { a: 85_650, b: 4.233 } },
  super: { laden: { a: 134_650, b: 4.3575 }, ballast: { a: 119_650, b: 3.7039 } },
  neopanamax: { laden: { a: 348_620, b: 2.6975 }, ballast: { a: 303_620, b: 2.2929 } },
};

const BULK_CARRIER = {
  ballastSpeed: 14,
  ladenSpeed: 13,
  auxiliaryAtSea: 2.5,
  auxiliaryInPort: 4,
  boilerInPort: 0.5,
  costIntercept: 6.71,
  costSlope: 0.188,
  suezTolls: DRY_BULK_SUEZ,
  panamaTolls: DRY_BULK_PANAMA,
};

const PROFILES = {
  'Bulk Carrier': {
    ...BULK_CARRIER,
    feedTypes: ['Bulk Carrier', 'Bulker', 'Cabu Carrier', 'Obo Carrier'],
    carries: ['ore', 'dry'],
  },
  'Ore Carrier': {
    ...BULK_CARRIER,
    feedTypes: ['Ore Carrier'],
    carries: ['ore'],
  },
  'Oil/Chemical Tanker': {
    feedTypes: ['Oil or Chemical Tanker', 'Oil Products Tanker', 'Chemical Tanker', 'Edible Oil Tanker', 'Tanker'],
    carries: ['dirty', 'clean'],
    ballastSpeed: 14.5,
    ladenSpeed: 13.5,
    auxiliaryAtSea: 3,
    auxiliaryInPort: 5,
    boilerInPort: 6,
    costIntercept: 7.73,
    costSlope: 0.13,
    suezTolls: { laden: { a: 262.5, b: 0.6731 }, ballast: TANKER_SUEZ_BALLAST },
    panamaTolls: TANKER_PANAMA,
  },
  'Crude Oil Tanker': {
    feedTypes: ['Crude Oil Tanker', 'Crude Oil', 'Shuttle Tanker'],
    carries: ['dirty'],
    ballastSpeed: 14.5,
    ladenSpeed: 13.5,
    auxiliaryAtSea: 5,
    auxiliaryInPort: 5,
    boilerInPort: 20,
    costIntercept: 7.56,
    costSlope: 0.13,
    suezTolls: { laden: { a: 513.9, b: 0.5991 }, ballast: TANKER_SUEZ_BALLAST },
    panamaTolls: TANKER_PANAMA,
  },
} satisfies Record<string, VesselTypeProfile>;

export type VesselType = keyof typeof PROFILES;

export const VESSEL_TYPES: Record<VesselType, VesselTypeProfile> = PROFILES;

export function carriersOf(cargoClass: CargoClass): VesselType[] {
  return (Object.keys(VESSEL_TYPES) as VesselType[]).filter((type) => VESSEL_TYPES[type].carries.includes(cargoClass));
}
