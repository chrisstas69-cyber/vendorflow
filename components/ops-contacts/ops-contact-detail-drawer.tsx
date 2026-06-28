'use client';

import { useState } from 'react';
import {
  ORG_TYPE_LABELS,
  OUTREACH_STATUS_LABELS,
  PURPOSE_TAG_LABELS,
  VISIBILITY_LABELS,
  type OpsContactRecord,
  type OpsOrganizationRecord,
} from '@/lib/ops-contacts-schema';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { ExternalLink, Lock, Mail, MapPin, Phone, X } from 'lucide-react';

interface OpsContactDetailDrawerProps {
  organization: OpsOrganizationRecord | null;
  onClose: () => void;
  onLogNote: (summary: string, contactId?: string) => Promise<void>;
  viewerRole: 'internal' | 'organizer';
}

export function OpsContactDetailDrawer({
  organization,
  onClose,
  onLogNote,
  viewerRole,
}: OpsContactDetailDrawerProps) {
  const { surface, muted, heading, btnPrimary, btnSecondary, cardInset } = useOrganizerTheme();

  if (!organization) return null;

  const primaryContact = organization.contacts[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <aside
        className={`relative w-full max-w-lg h-full overflow-y-auto shadow-xl ${surface}`}
        role="dialog"
        aria-label={organization.name}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 border-b border-stone-200/80 dark:border-stone-700 bg-inherit">
          <div>
            <div className={`text-xs font-medium uppercase tracking-wide ${muted}`}>
              {ORG_TYPE_LABELS[organization.type]}
            </div>
            <h2 className={`text-xl font-bold ${heading}`}>{organization.name}</h2>
            {organization.jurisdiction && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${muted}`}>
                <MapPin className="h-3.5 w-3.5" />
                {organization.jurisdiction.name}
                {organization.jurisdiction.county && ` · ${organization.jurisdiction.county}`}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${btnSecondary}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              {OUTREACH_STATUS_LABELS[organization.outreachStatus]}
            </span>
            {organization.internalOnly && (
              <span className="text-xs px-2 py-1 rounded-full bg-stone-200 text-stone-700 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Internal record
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              Fit {organization.fitScore}
            </span>
          </div>

          {(organization.publicPhone || organization.publicEmail || organization.website) && (
            <div className={`rounded-xl p-4 ${cardInset}`}>
              <h3 className={`font-semibold text-sm mb-3 ${heading}`}>Organization line</h3>
              <div className="space-y-2">
                {organization.publicPhone && (
                  <QuickAction href={`tel:${organization.publicPhone}`} icon={Phone} label={organization.publicPhone} />
                )}
                {organization.publicEmail && (
                  <QuickAction href={`mailto:${organization.publicEmail}`} icon={Mail} label={organization.publicEmail} />
                )}
                {organization.website && (
                  <QuickAction href={organization.website} icon={ExternalLink} label="Website" external />
                )}
              </div>
            </div>
          )}

          {organization.notes && (
            <div>
              <h3 className={`font-semibold text-sm mb-2 ${heading}`}>Notes</h3>
              <p className={`text-sm ${muted}`}>{organization.notes}</p>
            </div>
          )}

          {organization.eventProfiles.length > 0 && (
            <div>
              <h3 className={`font-semibold text-sm mb-2 ${heading}`}>Event districts</h3>
              {organization.eventProfiles.map(ep => (
                <div key={ep.id} className={`rounded-xl p-3 mb-2 ${cardInset}`}>
                  <div className={`font-medium text-sm ${heading}`}>{ep.eventDistrict ?? 'General'}</div>
                  <div className={`text-xs mt-1 ${muted}`}>
                    {ep.eventTypes.join(', ')}
                    {ep.seasonality && ` · ${ep.seasonality}`}
                    {ep.typicalVendorCount && ` · ~${ep.typicalVendorCount} vendors`}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className={`font-semibold text-sm mb-3 ${heading}`}>Contacts</h3>
            <div className="space-y-3">
              {organization.contacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </div>

          {viewerRole === 'internal' && organization.outreachActivities.length > 0 && (
            <div>
              <h3 className={`font-semibold text-sm mb-2 ${heading}`}>Outreach log</h3>
              <ul className="space-y-2">
                {organization.outreachActivities.map(oa => (
                  <li key={oa.id} className={`text-sm rounded-lg p-3 ${cardInset}`}>
                    <div className={`text-xs ${muted}`}>
                      {new Date(oa.createdAt).toLocaleDateString()} · {oa.activityType}
                      {oa.actorLabel && ` · ${oa.actorLabel}`}
                    </div>
                    <div className={heading}>{oa.summary}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AddNoteForm
            onSubmit={summary => onLogNote(summary, primaryContact?.id)}
            btnPrimary={btnPrimary}
            muted={muted}
          />
        </div>
      </aside>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: typeof Phone;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900 dark:text-teal-400"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </a>
  );
}

function ContactCard({ contact }: { contact: OpsContactRecord }) {
  const { cardInset, muted, heading } = useOrganizerTheme();

  return (
    <div className={`rounded-xl p-4 ${cardInset}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`font-semibold ${heading}`}>{contact.name}</div>
          {contact.title && <div className={`text-sm ${muted}`}>{contact.title}</div>}
          {contact.department && <div className={`text-xs mt-0.5 ${muted}`}>{contact.department}</div>}
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
          {VISIBILITY_LABELS[contact.visibility]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {contact.purposeTags.map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {PURPOSE_TAG_LABELS[tag]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 text-sm text-teal-700">
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-sm text-teal-700">
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        )}
      </div>
      {contact.notes && <p className={`text-xs mt-2 ${muted}`}>{contact.notes}</p>}
    </div>
  );
}

function AddNoteForm({
  onSubmit,
  btnPrimary,
  muted,
}: {
  onSubmit: (summary: string) => Promise<void>;
  btnPrimary: string;
  muted: string;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        if (!note.trim()) return;
        setSaving(true);
        await onSubmit(note.trim());
        setNote('');
        setSaving(false);
      }}
    >
      <label className={`text-sm font-medium ${muted}`}>Log outreach / note</label>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        placeholder="Called permit desk — need fire marshal form by March 1…"
        className="w-full mt-1 text-sm rounded-lg border px-3 py-2 border-stone-200 dark:border-stone-700 bg-transparent"
      />
      <button
        type="submit"
        disabled={saving || !note.trim()}
        className={`mt-2 px-3 py-2 rounded-lg text-sm ${btnPrimary} disabled:opacity-50`}
      >
        Save note
      </button>
    </form>
  );
}
