'use client';

import { useState } from 'react';

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'textarea';
  group: string;
  helpText: string;
}

const FIELDS: ConfigField[] = [
  { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', label: 'Google Service Account JSON', placeholder: '{"type":"service_account",...}', type: 'textarea', group: 'Google Sheets', helpText: 'Go to console.cloud.google.com → Create Service Account → Download JSON key' },
  { key: 'GOOGLE_SPREADSHEET_ID', label: 'Google Spreadsheet ID', placeholder: '1EZFP9EOuU2b9Jh5plAf3G2eJ...', type: 'text', group: 'Google Sheets', helpText: 'The ID from your Google Sheets URL (between /d/ and /edit)' },
  { key: 'GMAIL_FROM', label: 'Gmail From Address', placeholder: 'you@gmail.com', type: 'text', group: 'Email Digest', helpText: 'Gmail address to send daily digest from' },
  { key: 'GMAIL_APP_PASSWORD', label: 'Gmail App Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password', group: 'Email Digest', helpText: 'Go to myaccount.google.com → Security → 2FA → App Passwords' },
  { key: 'GMAIL_TO', label: 'Email Recipient', placeholder: 'you@email.com', type: 'text', group: 'Email Digest', helpText: 'Where to send the daily event digest' },
];

export default function SetupPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const groups = Array.from(new Set(FIELDS.map(f => f.group)));

  const handleSave = async () => {
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
        setMessage({ type: 'success', text: `Saved! ${data.configured.length} keys configured. Restart the dev server for changes to take effect.` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Setup</h1>
        <p className="text-gray-400 mb-8">Add your API keys below. Google Sheets and Email are optional — the event tracker works without them, just with limited export features.</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 border border-green-700 text-green-300' : 'bg-red-900/50 border border-red-700 text-red-300'}`}>
            {message.text}
          </div>
        )}

        {groups.map(group => (
          <div key={group} className="mb-8">
            <h2 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-800 pb-2">{group}</h2>
            <div className="space-y-4">
              {FIELDS.filter(f => f.group === group).map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                  <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                      rows={4}
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
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
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save All Configuration'}
        </button>

        <p className="text-xs text-gray-600 mt-4 text-center">
          Configuration is saved to .env.local. You must restart the dev server after saving.
        </p>
      </div>
    </div>
  );
}
