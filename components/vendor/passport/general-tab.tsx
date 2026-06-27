'use client';

import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';

export function PassportGeneralTab() {
  const { passport, updatePassport, saving } = useVendorPassport();
  const { input, label, muted, accent } = useVendorTheme();

  const field = (
    fieldLabel: string,
    key: keyof Pick<
      typeof passport,
      'businessName' | 'dba' | 'contactName' | 'phone' | 'website' | 'description' | 'insuranceExpiry'
    >
  ) => (
    <label className="block">
      <span className={`text-sm font-medium ${label}`}>{fieldLabel}</span>
      {key === 'description' ? (
        <textarea
          rows={4}
          value={passport[key] ?? ''}
          onChange={e => updatePassport({ [key]: e.target.value })}
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
        />
      ) : (
        <input
          type={key === 'insuranceExpiry' ? 'date' : 'text'}
          value={passport[key] ?? ''}
          onChange={e => updatePassport({ [key]: e.target.value })}
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
        />
      )}
    </label>
  );

  return (
    <div className="space-y-4 max-w-xl">
      <p className={`text-sm ${muted}`}>
        Your public business profile — organizers see this when reviewing applications.
      </p>
      {field('Business name', 'businessName')}
      {field('DBA / display name', 'dba')}
      {field('Primary contact', 'contactName')}
      {field('Phone', 'phone')}
      {field('Website', 'website')}
      {field('About your business', 'description')}
      {field('Insurance expiry', 'insuranceExpiry')}
      {saving && <p className={`text-xs ${accent}`}>Saving…</p>}
    </div>
  );
}
