import type { Coordinates } from '#shared/geo.ts';

// Joint War Committee Listed Areas, JWLA-035 of 16 September 2026: https://lmalloyds.com/wp-content/uploads/2026/09/JWLA-035-Black-Sea.pdf
export const LISTED_COUNTRIES: ReadonlySet<string> = new Set(['AE', 'BH', 'BJ', 'DJ', 'ER', 'IL', 'IQ', 'IR', 'KW', 'LB', 'LY', 'NG', 'OM', 'QA', 'RU', 'SA', 'SD', 'SO', 'SY', 'TG', 'UA', 'VE', 'YE']);

const GULF_TO_SOUTHERN_RED_SEA: Coordinates[] = [
  [32, 25.5],
  [37.5, 25.5],
  [46.5, 31],
  [49, 31],
  [56.5, 28],
  [65, 25.321],
  [65, 10.8],
  [60.25, 10.8],
  [48.75, -6.75],
  [41.567, -1.667],
];

const BLACK_SEA_AND_SEA_OF_AZOV: Coordinates[] = [
  [29.1, 41.45],
  [28.85, 41.55],
  [28.35, 41.8],
  [28.3, 42.05],
  [28.05, 42.45],
  [28.1, 42.75],
  [28.3, 43.2],
  [28.7, 43.33],
  [28.85, 43.75],
  [28.95, 44.17],
  [29.25, 44.6],
  [29.8, 44.8],
  [29.95, 45.15],
  [29.75, 45.3],
  [29, 45.6],
  [30.5, 46.8],
  [35, 47.3],
  [39, 47.5],
  [41, 47.5],
  [41, 45],
  [42.5, 41],
  [41.4, 41.75],
  [40.5, 41.3],
  [39.7, 41.28],
  [38.4, 41.12],
  [37.65, 41.32],
  [37.3, 41.45],
  [36.6, 41.62],
  [36, 41.95],
  [35.15, 42.23],
  [33.75, 42.18],
  [33, 42.1],
  [32.4, 41.95],
  [31.8, 41.66],
  [31.4, 41.48],
  [30.7, 41.3],
  [29.6, 41.38],
];

const GULF_OF_GUINEA: Coordinates[] = [
  [1.2, 6.108],
  [3, -0.667],
  [8.7, -0.667],
  [10.5, 1],
  [10.5, 7],
  [1.2, 7],
];

const CABO_DELGADO: Coordinates[] = [
  [40.315, -10.327],
  [40.574, -10.172],
  [40.828, -13.5],
  [40.527, -13.5],
];

export const LISTED_WATERS = [GULF_TO_SOUTHERN_RED_SEA, BLACK_SEA_AND_SEA_OF_AZOV, GULF_OF_GUINEA, CABO_DELGADO];
