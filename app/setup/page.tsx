'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'textarea';
  group: string;
  helpText: string;
}

const FIELDS: ConfigField[] = [
  { key: 'AIRTABLE_PAT', label: 'Airtable Personal Access Token', placeholder: 'patXXXXXXXXXXXXXX', type: 'password', group: 'Airtable (required)', helpText: 'Paste ONLY the token from airtable.com/create/tokens (starts with pat)' },
  { key: 'AIRTABLE_BASE_ID', label: 'Airtable Base ID', placeholder: 'appXXXXXXXXXXXXXX', type: 'text', group: 'Airtable (required)', helpText: 'From URL airtable.com/appXXXXXX/... — copy only the appXXXX part' },
  { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', label: 'Google Service Account JSON', placeholder: '{"type":"service_account",...}', type: 'textarea', group: 'Google Sheets (optional)', helpText: 'Skip for now if not ready' },
  { key: 'GOOGLE_SPREADSHEET_ID', label: 'Google Spreadsheet ID', placeholder: '1EZFP9EOuU2b9Jh5plAf3G2eJ...', type: 'text', group: 'Google Sheets (optional)', helpText: 'Optional' },
  { key: 'GMAIL_FROM', label: 'Gmail From Address', placeholder: 'you@gmail.com', type: 'text', group: 'Email Digest (optional)', helpText: 'Optional' },
  { key: 'GMAIL_APP_PASSWORD', label: 'Gmail App Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password', group: 'Email Digest (optional)', helpText: 'Optional' },
  { key: 'GMAIL_TO', label: 'Email Recipient', placeholder: 'you@email.com', type: 'text', group: 'Email Digest (optional)', helpText: 'Optional' },
];

export default function SetupPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [status, setStatus] = useState<{ airtableReady: boolean; nextSteps: string[] } | null>(null);

  useEffect(() => {
    fetch('/api/setup/status').then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  const groups = Array.from(new Set(FIELDS.map(f => f.group)));

  const handleSave = async () => {
    const pat = values.AIRTABLE_PAT?.trim();
    const base = values.AIRTABLE_BASE_ID?.trim();
    if (pat && !pat.startsWith('pat')) {
      setMessage({ type: 'error', text: 'Token must start with "pat" — you may have pasted the field name instead of the value.' });
      return;
    }
    if (base && !base.startsWith('app')) {
      setMessage({ type: 'error', text: 'Base ID must start with "app" — copy from your browser URL bar.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/setup/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Saved! Run in Terminal: npm run airtable:setup && npm run airtable:verify',
        });
        fetch('/api/setup/status').then(r => r.json()).then(setStatus);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
    setSaving(false);
  };

  return (
    <AppLayout title="SETUP">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {status && !status.airtableReady && (
          <div className="mb-6 p-4 border-2 border-accent-tertiary bg-accent-tertiary/10 text-sm">
            <strong>Airtable not connected yet.</strong> Fix the two fields below, then save.
          </div>
        )}
        {status?.airtableReady && (
          <div className="mb-6 p-4 border-2 border-accent-primary bg-accent-primary/10 text-sm text-black">
            Airtable credentials look valid. Run <code className="font-mono">npm run airtable:setup</code> in Terminal.
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 border-2 ${message.type === 'success' ? 'border-accent-primary bg-accent-primary/10' : 'border-accent-tertiary bg-accent-tertiary/10'}`}>
            {message.text}
          </div>
        )}

        {groups.map(group => (
          <div key={group} className="mb-8">
            <h2 className="text-sm font-bold text-accent-primary mb-4 border-b-2 border-border-primary pb-2">{group}</h2>
            <div className="space-y-4">
              {FIELDS.filter(f => f.group === group).map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold mb-1">{field.label}</label>
                  <p className="text-xs text-text-secondary mb-2">{field.helpText}</p>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="w-full bg-bg-primary border-2 border-border-primary px-4 py-3 text-sm font-mono"
                      rows={4}
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="w-full bg-bg-primary border-2 border-border-primary px-4 py-3 text-sm font-mono"
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent-primary hover:bg-accent-secondary disabled:opacity-50 text-black font-bold py-3 px-6 border-2 border-black"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <p className="text-xs text-text-secondary mt-4 text-center">
          <Link href="/" className="text-accent-primary underline">Back to Event Pulse</Link>
        </p>
      </div>
    </AppLayout>
  );
}
