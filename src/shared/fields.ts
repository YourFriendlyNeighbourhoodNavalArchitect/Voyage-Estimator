import type { Figure } from './display.ts';
import type { KeysOf } from './figures.ts';
import { figure, percent, stated, unitLabel } from './format.ts';

export type Choice = string | { value: string; label: string };

export interface ChoiceGroup {
  label: string;
  choices: readonly Choice[];
}

export type Choices = readonly (Choice | ChoiceGroup)[];

type NullableKeys<T> = Exclude<KeysOf<T, number | null>, KeysOf<T, number>>;

type Empty = 'zero' | 'demand' | number;

export interface NumberRules {
  max?: number;
  positive?: boolean;
  integer?: boolean;
  empty?: Empty;
}

interface Spec<K> {
  id: K;
  label: string;
}

interface NumberBase<K> extends Spec<K>, NumberRules {
  kind: 'number' | 'percent';
  unit?: string;
  digits?: number;
}

interface NullableNumberSpec<T> extends NumberBase<NullableKeys<T>> {
  empty: 'zero' | 'demand';
}

interface FixedNumberSpec<T> extends NumberBase<KeysOf<T, number>> {
  empty?: number;
}

interface SliderSpec<T> extends Spec<KeysOf<T, number>> {
  kind: 'slider';
  min?: number;
  max: number;
}

interface TextSpec<T> extends Spec<KeysOf<T, string>> {
  kind: 'text';
}

interface SelectSpec<T> extends Spec<KeysOf<T, string>> {
  kind: 'select';
  options: Choices;
  placeholder?: string;
  empty?: 'demand';
}

interface CheckboxSpec<T> extends Spec<KeysOf<T, boolean>> {
  kind: 'checkbox';
  boxLabel: string;
}

interface ReadOnlySpec<T> extends Spec<KeysOf<T, string | number | null>> {
  kind: 'readOnly';
}

export type FieldSpec<T> = NullableNumberSpec<T> | FixedNumberSpec<T> | SliderSpec<T> | TextSpec<T> | SelectSpec<T> | CheckboxSpec<T> | ReadOnlySpec<T>;

function isEmpty(value: unknown): boolean {
  return value === null || value === '';
}

export function isDemanded<T>(spec: FieldSpec<T>, model: T): boolean {
  return 'empty' in spec && spec.empty === 'demand' && isEmpty(model[spec.id]);
}

export function demandedFields<T>(specs: readonly FieldSpec<T>[], model: T): string[] {
  return specs.filter((spec) => isDemanded(spec, model)).map(({ label }) => label);
}

type RequiredId<S> = S extends { empty: 'demand'; id: infer K } ? K : never;

type Completed<T, K> = T & { [P in K & keyof T]: NonNullable<T[P]> };

export function completed<T, S extends FieldSpec<T>>(specs: readonly S[], model: T): Completed<T, RequiredId<S>> | null {
  return demandedFields(specs, model).length === 0 ? (model as Completed<T, RequiredId<S>>) : null;
}

export function fieldLabel<T>(specs: readonly FieldSpec<T>[], id: keyof T): string {
  const spec = specs.find((candidate) => candidate.id === id);
  if (!spec) throw new Error(`No field spec describes the key "${String(id)}".`);
  return spec.label;
}

export function fieldCaption<T>(spec: FieldSpec<T>): string {
  if (spec.kind === 'percent') return unitLabel(spec.label, spec.unit ?? '%');
  return unitLabel(spec.label, spec.kind === 'number' ? spec.unit : undefined);
}

export function fieldFigures<T>(specs: readonly FieldSpec<T>[], model: T): Figure[] {
  return specs.map((spec) => ({ label: fieldCaption(spec), value: fieldText(spec, model) }));
}

export function isGroup(entry: Choice | ChoiceGroup): entry is ChoiceGroup {
  return typeof entry === 'object' && 'choices' in entry;
}

export function choiceValue(choice: Choice): string {
  return typeof choice === 'string' ? choice : choice.value;
}

export function choiceLabel(choice: Choice): string {
  return typeof choice === 'string' ? choice : choice.label;
}

function selectedLabel(options: Choices, value: string): string {
  const match = options.flatMap((entry) => (isGroup(entry) ? entry.choices : [entry])).find((choice) => choiceValue(choice) === value);
  return match === undefined ? stated(value) : choiceLabel(match);
}

export function fieldText<T>(spec: FieldSpec<T>, model: T): string {
  const value = model[spec.id];
  switch (spec.kind) {
    case 'number':
      return figure(value as number | null, spec.digits);
    case 'percent':
      return percent(value as number | null, spec.digits);
    case 'slider':
      return percent(value as number, 0);
    case 'select':
      return selectedLabel(spec.options, value as string);
    case 'checkbox':
      return value ? spec.boxLabel : `Not ${spec.boxLabel}`;
    case 'text':
    case 'readOnly':
      return stated(value as string | number | null);
  }
}

type NumberEntry = { kind: 'refused' } | { kind: 'draft' } | { kind: 'value'; value: number | null };

const REFUSED: NumberEntry = { kind: 'refused' };
const DRAFT: NumberEntry = { kind: 'draft' };

function emptyEntry({ empty }: NumberRules): NumberEntry {
  if (empty === undefined) return DRAFT;
  return { kind: 'value', value: typeof empty === 'number' ? empty : null };
}

export function numberEntry(text: string, rules: NumberRules, scale = 1): NumberEntry {
  const { max = Infinity, positive = false, integer = false } = rules;
  if (text === '') return emptyEntry(rules);
  if (!(integer ? /^\d*$/ : /^\d*(\.\d*)?$/).test(text)) return REFUSED;

  const value = Number(text) / scale;
  if (Number.isNaN(value)) return DRAFT;
  if (value > max) return REFUSED;
  return positive && value === 0 ? DRAFT : { kind: 'value', value };
}
