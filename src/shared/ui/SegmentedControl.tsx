export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="bg-navy-950 p-1 rounded-panel border border-gold-500/20 flex items-center">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            option === value ? 'bg-gold-600 text-navy-950 shadow' : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
