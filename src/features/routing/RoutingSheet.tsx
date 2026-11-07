import { Globe, Navigation, SlidersHorizontal } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { measure } from '#shared/format.ts';
import { Alert } from '#shared/ui/Alert.tsx';
import { Fields } from '#shared/ui/Field.tsx';
import { ProgressNote } from '#shared/ui/ProgressNote.tsx';
import { Sheet, SheetNote, SheetSection } from '#shared/ui/Sheet.tsx';
import { voyageDistances, type RoutePoint, type RouteResult } from './RouteResult.ts';
import { ROUTING_FIELDS } from './routingService.ts';
import WORLD_LAND from './worldLand.json';

const WIDTH = 1000;
const HEIGHT = 500;
const TOP_LATITUDE = 84;
const BOTTOM_LATITUDE = -58;
const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const PARALLELS = [60, 30, 0, -30];

function project(longitude: number, latitude: number): { x: number; y: number } {
  return { x: ((longitude + 180) / 360) * WIDTH, y: ((90 - latitude) / 180) * HEIGHT };
}

function pathOf(lines: readonly (readonly number[])[][]): string {
  return lines
    .map((line) =>
      line
        .map(([longitude, latitude], index) => {
          const { x, y } = project(longitude, latitude);
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(''),
    )
    .join(' ');
}

const VIEW_TOP = project(0, TOP_LATITUDE).y;
const VIEW_BOTTOM = project(0, BOTTOM_LATITUDE).y;
const VIEW_BOX = `0 ${VIEW_TOP.toFixed(1)} ${WIDTH} ${(VIEW_BOTTOM - VIEW_TOP).toFixed(1)}`;
const LAND_PATH = pathOf(WORLD_LAND);

export function RoutingSheet() {
  const { state, active, patchRoutingSettings } = useEstimator();
  if (!active) return null;
  const { route } = active;

  return (
    <Sheet icon={Navigation} title="Routing">
      <SheetSection title="Options" icon={SlidersHorizontal} columns={4}>
        <Fields specs={ROUTING_FIELDS} model={state.routingSettings} patch={patchRoutingSettings} />
      </SheetSection>

      {route.status === 'loading' && <ProgressNote>Computing the sea route.</ProgressNote>}

      {route.data?.entersListedArea && <Alert>The route enters a war risk listed area.</Alert>}

      {route.status === 'error' && <Alert>{route.error}</Alert>}

      <SheetSection
        title="Map"
        icon={Globe}
        columns={1}
        note={
          route.data &&
          voyageDistances(route.data).map(({ label, distance }) => <SheetNote key={label}>{`${label}: ${measure(distance, 'nm', 1)}`}</SheetNote>)
        }
      >
        <SeaChart route={route.data} />
      </SheetSection>
    </Sheet>
  );
}

function SeaChart({ route }: { route: RouteResult | null }) {
  return (
    <svg viewBox={VIEW_BOX} className="w-full bg-navy-950 rounded-control select-none">
      <g className="stroke-navy-700/60" strokeWidth="0.5">
        {MERIDIANS.map((longitude) => {
          const { x } = project(longitude, 0);
          return <line key={longitude} x1={x} y1={VIEW_TOP} x2={x} y2={VIEW_BOTTOM} />;
        })}
        {PARALLELS.map((latitude) => {
          const { y } = project(0, latitude);
          return <line key={latitude} x1={0} y1={y} x2={WIDTH} y2={y} />;
        })}
      </g>
      <path d={LAND_PATH} className="fill-navy-800 stroke-gold-600" strokeWidth="0.6" strokeLinejoin="round" />
      {route && (
        <>
          <path d={pathOf(route.laden.geometry)} className="fill-none stroke-gold-300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <Marker point={route.laden.from} tone="fill-gold-300" label={`Load: ${route.laden.from.label}`} />
          <Marker point={route.laden.to} tone="fill-gold-500" label={`Discharge: ${route.laden.to.label}`} />
        </>
      )}
    </svg>
  );
}

function Marker({ point, tone, label }: { point: RoutePoint; tone: string; label: string }) {
  const { x, y } = project(point.longitude, point.latitude);
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`} className={tone}>
      <circle r="5" fillOpacity="0.35" />
      <circle r="3" className="stroke-ink-0" strokeWidth="1.2" />
      <text x="6" y="3" fontSize="9" fontWeight="bold">
        {label}
      </text>
    </g>
  );
}
