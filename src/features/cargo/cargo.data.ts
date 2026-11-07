import type { CargoProfile, DryBulkCargo, WetBulkCargo } from './CargoProfile.ts';

export const DRY_BULK: readonly DryBulkCargo[] = [
  { name: 'Iron Ore Fines', stowageFactor: 0.4, cargoClass: 'ore' },
  { name: 'Iron Ore Pellets', stowageFactor: 0.52, cargoClass: 'ore' },
  { name: 'Coal (Steam)', stowageFactor: 1.25, cargoClass: 'dry' },
  { name: 'Coal (Coking)', stowageFactor: 1.2, cargoClass: 'dry' },
  { name: 'Bauxite', stowageFactor: 0.78, cargoClass: 'dry' },
  { name: 'Alumina (Smelter Grade)', stowageFactor: 1.1, cargoClass: 'dry' },
  { name: 'Wheat', stowageFactor: 1.3, cargoClass: 'dry' },
  { name: 'Maize (Corn)', stowageFactor: 1.4, cargoClass: 'dry' },
  { name: 'Soybeans', stowageFactor: 1.4, cargoClass: 'dry' },
  { name: 'Sugar (Raw)', stowageFactor: 1.2, cargoClass: 'dry' },
  { name: 'Cement', stowageFactor: 0.65, cargoClass: 'dry' },
  { name: 'Clinker', stowageFactor: 0.75, cargoClass: 'dry' },
  { name: 'Fertiliser (Urea)', stowageFactor: 1.35, cargoClass: 'dry' },
  { name: 'Salt', stowageFactor: 0.85, cargoClass: 'dry' },
  { name: 'Petroleum Coke', stowageFactor: 1.15, cargoClass: 'dry' },
  { name: 'Scrap Metal', stowageFactor: 1.5, cargoClass: 'dry' },
];

export const WET_BULK: readonly WetBulkCargo[] = [
  { name: 'Crude Oil', density: 0.87, cargoClass: 'dirty' },
  { name: 'Fuel Oil (HFO 380)', density: 0.98, cargoClass: 'dirty' },
  { name: 'Gasoil / Diesel', density: 0.84, cargoClass: 'clean' },
  { name: 'Gasoline', density: 0.74, cargoClass: 'clean' },
  { name: 'Naphtha', density: 0.72, cargoClass: 'clean' },
  { name: 'Jet Fuel / Kerosene', density: 0.8, cargoClass: 'clean' },
  { name: 'Base Oil', density: 0.87, cargoClass: 'clean' },
  { name: 'Palm Oil', density: 0.92, cargoClass: 'clean' },
  { name: 'Soybean Oil', density: 0.92, cargoClass: 'clean' },
  { name: 'Methanol', density: 0.79, cargoClass: 'clean' },
  { name: 'Caustic Soda Solution (50%)', density: 1.52, cargoClass: 'clean' },
  { name: 'Sulphuric Acid (98%)', density: 1.84, cargoClass: 'clean' },
];

const CARGOES: readonly CargoProfile[] = [...DRY_BULK, ...WET_BULK];

export function findCargo(name: string): CargoProfile | null {
  return CARGOES.find((cargo) => cargo.name === name) ?? null;
}
