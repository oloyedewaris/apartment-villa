interface RangeFilterProps {
  label: string;
  unit?: string;
  minimum: number;
  maximum: number;
  low: number;
  high: number;
  step?: number;
  format(value: number): string;
  onChange(low: number, high: number): void;
}

export function RangeFilter({ label, unit, minimum, maximum, low, high, step = 1, format, onChange }: RangeFilterProps) {
  const span = maximum - minimum || 1;
  const left = ((low - minimum) / span) * 100;
  const right = ((high - minimum) / span) * 100;
  return (
    <div className="filter-range">
      <label>
        {label}
        <span>{unit}</span>
      </label>
      <div className="range-values">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>
      <div className="range-control">
        <div className="range-line" />
        <div className="range-selection" style={{ left: `${left}%`, width: `${right - left}%` }} />
        <input
          type="range"
          min={minimum}
          max={maximum}
          step={step}
          value={low}
          onChange={(event) => onChange(Math.min(Number(event.target.value), high), high)}
          aria-label={`${label} minimum`}
        />
        <input
          type="range"
          min={minimum}
          max={maximum}
          step={step}
          value={high}
          onChange={(event) => onChange(low, Math.max(Number(event.target.value), low))}
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}
