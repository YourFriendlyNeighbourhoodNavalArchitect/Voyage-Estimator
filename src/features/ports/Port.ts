import type { Choice } from '#shared/fields.ts';
import type { Position } from '#shared/geo.ts';

export interface Port extends Position {
  code: string;
  name: string;
  country: string;
  maxDraft: number;
  turnaround: number;
}

const EU_COUNTRIES: ReadonlySet<string> = new Set(['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GF', 'GP', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MF', 'MQ', 'MT', 'NL', 'PL', 'PT', 'RE', 'RO', 'SE', 'SI', 'SK', 'YT']);

export function portLabel(port: Port): string {
  return `${port.name}, ${port.country}`;
}

export function portChoices(ports: readonly Port[]): Choice[] {
  return ports.map((port) => ({ value: port.code, label: portLabel(port) }));
}

export function limitingDraft(...ports: readonly (Port | null)[]): number | null {
  const drafts = ports.filter((port) => port !== null).map((port) => port.maxDraft);
  return drafts.length > 0 ? Math.min(...drafts) : null;
}

function countryCode(locode: string): string {
  return locode.slice(0, 2);
}

export function inCountries({ code }: { code: string | null }, countries: ReadonlySet<string>): boolean {
  return code !== null && countries.has(countryCode(code));
}

export function inEu(place: { code: string | null }): boolean {
  return inCountries(place, EU_COUNTRIES);
}
