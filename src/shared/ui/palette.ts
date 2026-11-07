/**
 * The colours of the interface and of the printed report. Tailwind reads them
 * through tailwind.config.ts, and the report imports them directly.
 */
export const PALETTE = {
  /** Box surfaces and wells, darkest to lightest. */
  navy: {
    950: '#05152a', // input well, deepest nested surface
    900: '#071b33', // box surface, header
    800: '#0c294b', // raised surface, dividers, subtle fills
    700: '#143257', // hover, chart grid
  },
  /** Borders, highlights and accents. */
  gold: {
    300: '#e2c98b', // brightest highlight
    400: '#d0b06a', // accent icons and text
    500: '#c4a45c', // primary accent, focus rings, box border
    600: '#9f7a2f', // strong accent, button fill
    700: '#7c6224', // dim accent, and warning text on paper
  },
  /** Light text on the navy boxes, near-white to faint grey. */
  ink: {
    0: '#eef2f7',
    200: '#dbe2ec',
    300: '#c3cddb',
    400: '#94a2b6',
    500: '#6b7a90',
  },
  /** The printed report. */
  paper: {
    rule: '#d9c69a', // hairlines, table rules, chart axes
    label: '#3b4a5e', // row labels
    wash: '#fdf6e6', // the warning block behind gold-700 text
  },
} as const;
