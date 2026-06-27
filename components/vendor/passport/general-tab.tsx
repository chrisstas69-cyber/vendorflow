'use client';

import { useVendorPassport } from '@/contexts/vendor-passport-context';

export function PassportGeneralTab() {
  const { passport, updatePassport, saving } = useVendorPassport();

  const field = (
    label: string,
    key: keyof Pick<
      typeof passport,
      'businessName' | 'dba' | 'contactName' | 'phone' | 'website' | 'description' | 'insuranceExpiry'
    >
  ) => (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {key === 'description' ? (
        <textarea
          rows={4}
          value={passport[key] ?? ''}
          onChange={e => updatePassport({ [key]: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={key === 'insuranceExpiry' ? 'date' : 'text'}
          value={passport[key] ?? ''}
          onChange={e => updatePassport({ [key]: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
        />
      )}
    </label>
  );

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-gray-500">
        Your public business profile — organizers see this when reviewing applications.
      </p>
      {field('Business name', 'businessName')}
      {field('DBA / display name', 'dba')}
      {field('Primary contact', 'contactName')}
      {field('Phone', 'phone')}
      {field('Website', 'website')}
      {field('About your business', 'description')}
      {field('Insurance expiry', 'insuranceExpiry')}
      {saving && <p className="text-xs text-amber-600">Saving…</p>}
    </div>
  );
}
