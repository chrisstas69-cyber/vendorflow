export type EventGrade = 'S' | 'A' | 'B' | 'C';

export function TierBadge({ tier, size = 'md' }: { tier: EventGrade; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' };
  const colorClasses: Record<EventGrade, string> = {
    S: 'bg-accent-primary text-black',
    A: 'bg-accent-secondary text-black',
    B: 'bg-accent-tertiary text-black',
    C: 'bg-border-secondary text-text-secondary',
  };
  return (
    <div className={`${sizeClasses[size]} ${colorClasses[tier]} border-2 border-black flex items-center justify-center font-bold`}>
      {tier}
    </div>
  );
}
