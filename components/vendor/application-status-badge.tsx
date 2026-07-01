'use client';

interface ApplicationStatusBadgeProps {
  status?: string;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  if (!status) return null;

  const tone =
    status === 'Booked' || status === 'Approved'
      ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
      : status === 'Not approved'
        ? 'bg-red-100 text-red-800'
        : status === 'Under review' || status === 'Applied'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  );
}
