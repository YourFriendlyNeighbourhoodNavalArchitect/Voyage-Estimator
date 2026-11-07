import { useState, type ReactNode } from 'react';
import { choiceLabel, choiceValue, isGroup, numberEntry, type Choice, type Choices, type NumberRules } from '#shared/fields.ts';
import { percent } from '#shared/format.ts';

const CONTROL_SKIN = 'w-full min-h-control px-2.5 py-1 bg-navy-950 border rounded-control text-sm';

const INPUT_BASE = `${CONTROL_SKIN} text-ink-0 focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed`;

function fieldBorder(filled: boolean, demanded = false): string {
  return demanded ? 'border-gold-500' : filled ? 'border-gold-600/40' : 'border-ink-500/30';
}

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-note text-ink-400 mb-0.5">{label}</div>
      {children}
    </div>
  );
}

export function NumberField({
  label,
  value,
  rules,
  scale,
  demanded,
  onChange,
}: {
  label: string;
  value: number | null;
  rules: NumberRules;
  scale: number;
  demanded: boolean;
  onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const stored = value === null ? '' : String(Number((value * scale).toPrecision(12)));
  return (
    <FieldShell label={label}>
      <input
        type="text"
        inputMode={rules.integer ? 'numeric' : 'decimal'}
        value={draft ?? stored}
        onFocus={() => setDraft(stored)}
        onBlur={() => setDraft(null)}
        onChange={(event) => {
          const text = event.target.value;
          const entry = numberEntry(text, rules, scale);
          if (entry.kind === 'refused') return;
          setDraft(text);
          if (entry.kind === 'value') onChange(entry.value);
        }}
        className={`${INPUT_BASE} tabular-nums ${fieldBorder(value !== null, demanded)}`}
      />
    </FieldShell>
  );
}

export function PercentSlider({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <FieldShell label={label}>
      <div className={`${CONTROL_SKIN} flex items-center gap-2.5 ${fieldBorder(true)}`}>
        <input
          type="range"
          min={Math.round(min * 100)}
          max={Math.round(max * 100)}
          step={1}
          value={Math.round(value * 100)}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          className="flex-1 min-w-0 accent-gold-500 cursor-pointer"
        />
        <span className="tabular-nums text-gold-300">{percent(value, 0)}</span>
      </div>
    </FieldShell>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldShell label={label}>
      <div className={`${CONTROL_SKIN} flex items-center border-gold-500/15 text-ink-300`}>{value}</div>
    </FieldShell>
  );
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldShell label={label}>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT_BASE} ${fieldBorder(value !== '')}`} />
    </FieldShell>
  );
}

function ChoiceOption({ choice }: { choice: Choice }) {
  return <option value={choiceValue(choice)}>{choiceLabel(choice)}</option>;
}

export function SelectField({
  label,
  value,
  options,
  placeholder,
  demanded = false,
  onChange,
}: {
  label: string;
  value: string;
  options: Choices;
  placeholder?: string;
  demanded?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT_BASE} ${fieldBorder(value !== '', demanded)}`}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((entry) =>
          isGroup(entry) ? (
            <optgroup key={entry.label} label={entry.label}>
              {entry.choices.map((choice) => (
                <ChoiceOption key={choiceValue(choice)} choice={choice} />
              ))}
            </optgroup>
          ) : (
            <ChoiceOption key={choiceValue(entry)} choice={entry} />
          ),
        )}
      </select>
    </FieldShell>
  );
}

export function Checkbox({
  label,
  boxLabel,
  checked,
  onChange,
}: {
  label: string;
  boxLabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <FieldShell label={label}>
      <label
        className={`${CONTROL_SKIN} flex items-center gap-2 cursor-pointer select-none has-disabled:opacity-50 has-disabled:cursor-not-allowed ${fieldBorder(checked)}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="w-3.5 h-3.5 accent-gold-500 cursor-pointer"
        />
        <span className={checked ? 'text-gold-300' : 'text-ink-400'}>{boxLabel}</span>
      </label>
    </FieldShell>
  );
}
