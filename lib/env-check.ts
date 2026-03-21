export interface ConfigStatus {
  key: string;
  label: string;
  group: 'events';
  configured: boolean;
}

const CONFIG_KEYS: { key: string; label: string; group: 'events' }[] = [
  { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', label: 'Google Service Account JSON', group: 'events' },
  { key: 'GOOGLE_SPREADSHEET_ID', label: 'Google Spreadsheet ID', group: 'events' },
  { key: 'GMAIL_FROM', label: 'Gmail From Address', group: 'events' },
  { key: 'GMAIL_APP_PASSWORD', label: 'Gmail App Password', group: 'events' },
  { key: 'GMAIL_TO', label: 'Email Recipient', group: 'events' },
];

export function getConfigStatus(): ConfigStatus[] {
  return CONFIG_KEYS.map(({ key, label, group }) => ({
    key,
    label,
    group,
    configured: !!process.env[key],
  }));
}

export function hasAnyConfig(): boolean {
  return getConfigStatus().some(s => s.configured);
}
