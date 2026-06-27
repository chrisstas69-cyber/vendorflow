'use client';

export function FoundersEditionBanner({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-950 via-amber-900 to-indigo-950 text-amber-50 ${
        compact ? 'px-4 py-3' : 'px-6 py-5'
      }`}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_50%,#fbbf24,transparent_50%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 mb-1">
            Founders Edition · Long Island Pilot
          </div>
          <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>
            Nassau & Suffolk compliance built in
          </div>
          {!compact && (
            <p className="text-sm text-amber-100/80 mt-1 max-w-xl">
              Sales tax fields, health permits, and local document checks — tailored for LI street fairs and markets.
            </p>
          )}
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200">
          Early access
        </span>
      </div>
    </div>
  );
}
