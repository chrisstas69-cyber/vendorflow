export function MetricCard({
  label,
  value,
  unit,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantClasses = {
    default: 'bg-bg-secondary border-border-primary',
    success: 'bg-accent-primary/10 border-accent-primary',
    warning: 'bg-accent-secondary/10 border-accent-secondary',
    danger: 'bg-accent-tertiary/10 border-accent-tertiary',
  };
  return (
    <div className={`border-2 ${variantClasses[variant]} p-3`}>
      <div className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm ml-1 text-text-secondary">{unit}</span>}
      </div>
    </div>
  );
}
