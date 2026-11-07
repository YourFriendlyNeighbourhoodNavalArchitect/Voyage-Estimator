import { fieldCaption, fieldText, isDemanded, type FieldSpec } from '#shared/fields.ts';
import { Checkbox, NumberField, PercentSlider, ReadOnlyField, SelectField, TextField } from './controls.tsx';

type Patch<T> = (change: Partial<T>) => void;

export function Field<T>({ spec, model, patch }: { spec: FieldSpec<T>; model: T; patch: Patch<T> }) {
  const value = model[spec.id];
  const label = fieldCaption(spec);
  const demanded = isDemanded(spec, model);
  const set = (next: unknown) => patch({ [spec.id]: next } as Partial<T>);
  switch (spec.kind) {
    case 'text':
      return <TextField label={label} value={value as string} onChange={set} />;
    case 'select':
      return <SelectField label={label} value={value as string} options={spec.options} placeholder={spec.placeholder} demanded={demanded} onChange={set} />;
    case 'checkbox':
      return <Checkbox label={label} boxLabel={spec.boxLabel} checked={value as boolean} onChange={set} />;
    case 'number':
    case 'percent':
      return (
        <NumberField
          label={label}
          value={value as number | null}
          rules={spec}
          scale={spec.kind === 'percent' ? 100 : 1}
          demanded={demanded}
          onChange={set}
        />
      );
    case 'slider':
      return <PercentSlider label={label} value={value as number} min={spec.min} max={spec.max} onChange={set} />;
    case 'readOnly':
      return <ReadOnlyField label={label} value={fieldText(spec, model)} />;
  }
}

export function Fields<T>({ specs, model, patch }: { specs: readonly FieldSpec<T>[]; model: T; patch: Patch<T> }) {
  return specs.map((spec) => <Field key={spec.id} spec={spec} model={model} patch={patch} />);
}
