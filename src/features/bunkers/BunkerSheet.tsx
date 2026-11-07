import { Coins, Fuel } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { portChoices } from '#features/ports/Port.ts';
import { Sheet, SheetSection } from '#shared/ui/Sheet.tsx';
import { Alert } from '#shared/ui/Alert.tsx';
import { SelectField } from '#shared/ui/controls.tsx';
import { Fields } from '#shared/ui/Field.tsx';
import { BUNKER_PORTS, FUEL_PRICE_FIELDS } from './bunkerPrices.ts';

const PORT_CHOICES = portChoices(BUNKER_PORTS);

export function BunkerSheet() {
  const { state, active, bunkerQuote, bunkerPrices, setBunkerPort, patchBunkerPrices } = useEstimator();
  if (!active) return null;
  const fields = FUEL_PRICE_FIELDS.filter(({ id }) => id !== 'HFO' || active.vessel.hasScrubber);
  const unquoted = fields.filter(({ id }) => bunkerQuote?.[id] === null).map(({ id }) => id);

  return (
    <Sheet icon={Fuel} title="Bunker Prices">
      <SheetSection title="Prices" icon={Coins} columns={fields.length === 3 ? 4 : 3}>
        <SelectField label="Bunkering Port" value={state.bunker.port} options={PORT_CHOICES} onChange={setBunkerPort} />
        <Fields specs={fields} model={bunkerPrices} patch={patchBunkerPrices} />
      </SheetSection>
      {unquoted.length > 0 && <Alert>{`Prices not fetched: ${unquoted.join(', ')}.`}</Alert>}
    </Sheet>
  );
}
