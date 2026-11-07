export interface DryBulkCargo {
  readonly name: string;
  readonly stowageFactor: number;
  readonly cargoClass: 'ore' | 'dry';
}

export interface WetBulkCargo {
  readonly name: string;
  readonly density: number;
  readonly cargoClass: 'dirty' | 'clean';
}

export type CargoProfile = DryBulkCargo | WetBulkCargo;

export type CargoClass = CargoProfile['cargoClass'];
