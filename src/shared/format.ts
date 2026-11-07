const LOCALE = 'en-GB';
const MISSING = '-';

const COMPACT_DOLLARS = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  notation: 'compact',
  maximumSignificantDigits: 3,
});

export function usdCompact(value: number): string {
  return COMPACT_DOLLARS.format(Math.round(value));
}

function numeral(value: number | null, digits: number, signDisplay: 'auto' | 'exceptZero'): string {
  return value === null
    ? MISSING
    : value.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay });
}

export function figure(value: number | null, digits = 0): string {
  return numeral(value, digits, 'auto');
}

export function signedFigure(value: number | null, digits = 0): string {
  return numeral(value, digits, 'exceptZero');
}

export function percent(share: number | null, digits = 2): string {
  return share === null ? MISSING : `${figure(share * 100, digits)}%`;
}

export function signedPercent(share: number | null, digits = 2): string {
  return share === null ? MISSING : `${signedFigure(share * 100, digits)}%`;
}

export function counted(count: number, singular: string): string {
  return `${figure(count)} ${count === 1 ? singular : `${singular}s`}`;
}

export function unitLabel(text: string, unit?: string): string {
  return unit ? `${text} [${unit}]` : text;
}

export function measure(value: number | null, unit: string, digits = 0): string {
  return value === null ? MISSING : unitLabel(figure(value, digits), unit);
}

export function stated(value: string | number | null): string {
  return value === null || value === '' ? MISSING : String(value);
}

export function timestamp(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function position(latitude: number, longitude: number): string {
  return `${figure(Math.abs(latitude), 2)}° ${latitude < 0 ? 'S' : 'N'}, ${figure(Math.abs(longitude), 2)}° ${longitude < 0 ? 'W' : 'E'}`;
}
