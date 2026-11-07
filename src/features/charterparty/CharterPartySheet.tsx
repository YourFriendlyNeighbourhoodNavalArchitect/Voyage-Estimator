import { Coins, FileText, MapPin, Package } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import type { CargoProfile } from '#features/cargo/CargoProfile.ts';
import { measure, percent } from '#shared/format.ts';
import { Sheet, SheetNote, SheetSection } from '#shared/ui/Sheet.tsx';
import { Fields } from '#shared/ui/Field.tsx';
import { SegmentedControl } from '#shared/ui/SegmentedControl.tsx';
import { CARGO_FIELDS, CHARTER_TYPES, ITINERARY_FIELDS, moneyFields, totalCommission } from './CharterPartyTerms.ts';

function cargoNote(cargo: CargoProfile): string {
  return 'density' in cargo ? `Density: ${measure(cargo.density, 't/m³', 2)}` : `Stowage Factor: ${measure(cargo.stowageFactor, 'm³/t', 2)}`;
}

export function CharterPartySheet() {
  const { state, resolved, searching, patchCharterParty } = useEstimator();
  const { charterParty } = state;
  const { cargo, draftLimit } = resolved;

  return (
    <Sheet
      icon={FileText}
      title="Charter Party"
      busy={searching}
      actions={<SegmentedControl value={charterParty.charterType} options={CHARTER_TYPES} onChange={(charterType) => patchCharterParty({ charterType })} />}
    >
      <SheetSection
        title="Cargo"
        icon={Package}
        columns={2}
        note={cargo && <SheetNote>{cargoNote(cargo)}</SheetNote>}
      >
        <Fields specs={CARGO_FIELDS} model={charterParty} patch={patchCharterParty} />
      </SheetSection>

      <SheetSection
        title="Itinerary"
        icon={MapPin}
        columns={2}
        note={draftLimit !== null && <SheetNote>{`Maximum Allowable Draught: ${measure(draftLimit, 'm', 1)}`}</SheetNote>}
      >
        <Fields specs={ITINERARY_FIELDS} model={charterParty} patch={patchCharterParty} />
      </SheetSection>

      <SheetSection
        title="Financials"
        icon={Coins}
        columns={3}
        note={<SheetNote>{`Total Commission: ${percent(totalCommission(charterParty))}`}</SheetNote>}
      >
        <Fields specs={moneyFields(charterParty.charterType)} model={charterParty} patch={patchCharterParty} />
      </SheetSection>
    </Sheet>
  );
}
