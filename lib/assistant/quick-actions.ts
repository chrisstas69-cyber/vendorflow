export type QuickActionType = 'open_call_sheet' | 'open_application_template' | 'open_invoice_draft' | 'open_series';

export interface QuickAction {
  id: string;
  type: QuickActionType;
  label: string;
  href: string;
  payload?: Record<string, unknown>;
}

export function parseQuickActionsFromReply(text: string, role: 'organizer' | 'vendor'): QuickAction[] {
  const actions: QuickAction[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('call sheet') || lower.includes('call-sheet')) {
    actions.push({
      id: 'call-sheet',
      type: 'open_call_sheet',
      label: 'Open call sheet template',
      href: role === 'organizer' ? '/organizer/command' : '/command',
    });
  }

  if (lower.includes('application') || lower.includes('apply form')) {
    actions.push({
      id: 'application-template',
      type: 'open_application_template',
      label: 'Open application format',
      href: role === 'organizer' ? '/organizer/applications' : '/pulse',
    });
  }

  if (lower.includes('invoice') || lower.includes('booth fee')) {
    actions.push({
      id: 'invoice-draft',
      type: 'open_invoice_draft',
      label: 'Create invoice draft',
      href: role === 'organizer' ? '/organizer/invoicing' : '/vendor?tab=invoicing',
    });
  }

  if (lower.includes('series') || lower.includes('season')) {
    actions.push({
      id: 'series',
      type: 'open_series',
      label: 'View event series',
      href: '/organizer/events',
    });
  }

  return actions;
}

export const ORGANIZER_STARTER_PROMPTS = [
  'Draft a call sheet for my next street fair',
  'Which pending vendors are highest match?',
  'Summarize permit deadlines this month',
];

export const VENDOR_STARTER_PROMPTS = [
  'What events fit my booth setup?',
  'What documents am I missing for LI fairs?',
  'Help me write an application message',
];
