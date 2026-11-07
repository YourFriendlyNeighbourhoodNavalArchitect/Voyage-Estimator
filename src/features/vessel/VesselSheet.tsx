import { Coins, Cog, Flame, Gauge, Info, MapPin, Ship } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { measure, position } from '#shared/format.ts';
import { Badge } from '#shared/ui/Badge.tsx';
import { Fields } from '#shared/ui/Field.tsx';
import { Sheet, SheetSection } from '#shared/ui/Sheet.tsx';
import { VESSEL_FIELDS, type VesselProfile } from './VesselProfile.ts';

export function VesselSheet() {
  const { active, patchVessel } = useEstimator();
  if (!active) return null;
  const { vessel, sighting } = active;
  const patch = (change: Partial<VesselProfile>) => patchVessel(vessel.imo, change);

  return (
    <Sheet
      icon={Ship}
      title="Vessel Particulars"
      actions={
        <Badge icon={MapPin}>
          {position(sighting.latitude, sighting.longitude)}
          {sighting.speed !== null && ` / SOG ${measure(sighting.speed, 'kn', 1)}`}
          {sighting.destination && ` / "${sighting.destination}"`}
        </Badge>
      }
    >
      <SheetSection title="General" icon={Info} columns={4}>
        <Fields specs={VESSEL_FIELDS.general} model={vessel} patch={patch} />
      </SheetSection>
      <SheetSection title="Machinery" icon={Cog} columns={3}>
        <Fields specs={VESSEL_FIELDS.machinery} model={vessel} patch={patch} />
      </SheetSection>
      <SheetSection title="Speed and Consumption" icon={Gauge} columns={4}>
        <Fields specs={VESSEL_FIELDS.speed} model={vessel} patch={patch} />
      </SheetSection>
      <SheetSection title="Auxiliaries" icon={Flame} columns={3}>
        <Fields specs={VESSEL_FIELDS.auxiliaries} model={vessel} patch={patch} />
      </SheetSection>
      <SheetSection title="Financials" icon={Coins} columns={2}>
        <Fields specs={VESSEL_FIELDS.financials} model={vessel} patch={patch} />
      </SheetSection>
    </Sheet>
  );
}
