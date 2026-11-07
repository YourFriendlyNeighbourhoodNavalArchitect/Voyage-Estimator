const PORT_CALLS = 2;

interface Tariff {
  base: number;
  rate: number;
}

const PORT_DUES: Tariff = { base: 24000, rate: 0.3 };
const AGENCY_FEES: Tariff = { base: 1500, rate: 0.02 };

interface PortCosts {
  portDues: number;
  agencyFees: number;
}

export function portCosts(grossTonnage: number): PortCosts {
  return {
    portDues: voyageCharge(PORT_DUES, grossTonnage),
    agencyFees: voyageCharge(AGENCY_FEES, grossTonnage),
  };
}

function voyageCharge({ base, rate }: Tariff, grossTonnage: number): number {
  return Math.round(PORT_CALLS * (base + rate * grossTonnage));
}
