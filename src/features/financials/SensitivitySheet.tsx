import { useMemo, useState } from 'react';
import { Activity, FlaskConical, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import type { CharterTerms } from '#features/charterparty/CharterPartyTerms.ts';
import { reviseVesselProfile } from '#features/vessel/VesselProfile.ts';
import { mapValues } from '#shared/collections.ts';
import type { Column } from '#shared/display.ts';
import type { FieldSpec } from '#shared/fields.ts';
import { Button } from '#shared/ui/Button.tsx';
import { DataTable } from '#shared/ui/DataTable.tsx';
import { Fields } from '#shared/ui/Field.tsx';
import { Sheet, SheetNote, SheetSection } from '#shared/ui/Sheet.tsx';
import { metricChange, metrics, metricText, type Metric } from './metrics.ts';
import { voyageEstimate, type EstimateInputs, type VoyageEstimate } from './VoyageEstimate.ts';

interface Scenario {
  speed: number;
  bunkerPrice: number;
  earningRate: number;
  portTime: number;
}

const BASE_CASE: Scenario = { speed: 0, bunkerPrice: 0, earningRate: 0, portTime: 0 };

function scenarioFields({ rate }: CharterTerms): readonly FieldSpec<Scenario>[] {
  return [
    { kind: 'slider', id: 'speed', label: 'Speed', min: -0.2, max: 0.2 },
    { kind: 'slider', id: 'bunkerPrice', label: 'Bunker Prices', min: -0.4, max: 0.4 },
    { kind: 'slider', id: 'earningRate', label: rate.label, min: -0.3, max: 0.3 },
    { kind: 'number', id: 'portTime', label: 'Extra Port Time', unit: 'days', empty: 0 },
  ];
}

function scenarioInputs(inputs: EstimateInputs, { speed, bunkerPrice, earningRate, portTime }: Scenario): EstimateInputs {
  const { vessel, charterParty, fuelPrices } = inputs;
  const scaled = (value: number | null, change: number) => (value === null ? null : value * (1 + change));
  const extended = (duration: number | null) => (portTime === 0 ? duration : (duration ?? 0) + portTime / 2);
  return {
    ...inputs,
    vessel: speed === 0 ? vessel : reviseVesselProfile(vessel, { ballastSpeed: vessel.ballastSpeed * (1 + speed), ladenSpeed: vessel.ladenSpeed * (1 + speed) }),
    charterParty: {
      ...charterParty,
      earningRate: scaled(charterParty.earningRate, earningRate),
      loadingDuration: extended(charterParty.loadingDuration),
      dischargingDuration: extended(charterParty.dischargingDuration),
    },
    fuelPrices: mapValues(fuelPrices, (price) => scaled(price, bunkerPrice)),
  };
}

function outcomeColumns(base: VoyageEstimate, scenario: VoyageEstimate): readonly Column<Metric>[] {
  const change = ({ value }: Metric) => {
    const before = value(base);
    const after = value(scenario);
    return before === null || after === null ? null : after - before;
  };
  return [
    { label: 'Metric', emphasis: 'key', text: ({ label }) => label },
    { label: 'Base Case', text: (metric) => metricText(metric, metric.value(base)) },
    { label: 'Scenario', text: (metric) => metricText(metric, metric.value(scenario)) },
    { label: 'Change', text: (metric) => metricChange(metric, change(metric)) },
  ];
}

export function SensitivitySheet() {
  const base = useEstimator().active?.estimate;
  return base ? <Sensitivity base={base} /> : null;
}

function Sensitivity({ base }: { base: VoyageEstimate }) {
  const [scenario, setScenario] = useState<Scenario>(BASE_CASE);
  const outcome = useMemo(() => voyageEstimate(scenarioInputs(base.inputs, scenario)), [base, scenario]);

  return (
    <Sheet
      icon={FlaskConical}
      title="Sensitivity Analysis"
      actions={
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => setScenario(BASE_CASE)}>
          Reset
        </Button>
      }
    >
      <SheetSection
        title="Scenario"
        icon={SlidersHorizontal}
        columns={4}
        note={<SheetNote>The extra port time is split equally between the loading and discharging ports.</SheetNote>}
      >
        <Fields specs={scenarioFields(base.terms)} model={scenario} patch={(change) => setScenario((current) => ({ ...current, ...change }))} />
      </SheetSection>

      <SheetSection title="Outcome" icon={Activity} columns={1}>
        <DataTable columns={outcomeColumns(base, outcome)} rows={Object.values(metrics(base.terms))} rowKey={({ label }) => label} />
      </SheetSection>
    </Sheet>
  );
}
