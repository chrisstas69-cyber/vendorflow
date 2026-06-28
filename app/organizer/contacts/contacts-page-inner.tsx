'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { OpsContactDetailDrawer } from '@/components/ops-contacts/ops-contact-detail-drawer';
import { OpsImportIntelligencePanel } from '@/components/ops-contacts/ops-import-intelligence-panel';
import { useOpsContacts } from '@/hooks/use-ops-contacts';
import { usePilotConfig } from '@/hooks/use-pilot-config';
import {
  ORG_TYPE_LABELS,
  OUTREACH_STATUS_LABELS,
  PURPOSE_TAG_LABELS,
  type OpsOrganizationRecord,
} from '@/lib/ops-contacts-schema';
import { OrganizerLoadingState } from '@/components/organizer/organizer-loading-state';
import { BookUser, Lock, Mail, Phone, Search, Shield } from 'lucide-react';

export default function OrganizerContactsPageInner() {
  const searchParams = useSearchParams();
  const internalMode = searchParams.get('view') === 'internal';
  const viewerRole = internalMode ? 'internal' : 'organizer';

  const { organizer } = usePilotConfig();
  const { surface, muted, heading, btnSecondary, btnPrimary } = useOrganizerTheme();
  const { organizations, loading, error, filters, setFilters, loadOrganization, logOutreach, refresh } =
    useOpsContacts(viewerRole);

  const [selected, setSelected] = useState<OpsOrganizationRecord | null>(null);

  const openDetail = useCallback(
    async (id: string) => {
      const org = await loadOrganization(id);
      setSelected(org);
    },
    [loadOrganization]
  );

  const handleLogNote = async (summary: string, contactId?: string) => {
    if (!selected) return;
    await logOutreach(selected.id, { activityType: 'note', summary, contactId });
    const refreshed = await loadOrganization(selected.id);
    setSelected(refreshed);
  };

  return (
    <OrganizerLayout showBanners={false}>
      <OrganizerPageHeader
        title="Contact intelligence"
        description="Private operational directory — chambers, agencies, and event-day contacts for Long Island."
        actions={
          <Link
            href={internalMode ? '/organizer/contacts' : '/organizer/contacts?view=internal'}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${btnSecondary}`}
          >
            <Shield className="h-4 w-4" />
            {internalMode ? 'Organizer view' : 'Internal view'}
          </Link>
        }
      />

      <div className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${surface}`}>
        <Lock className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className={`text-sm font-medium ${heading}`}>Not a public directory</p>
          <p className={`text-sm mt-1 ${muted}`}>
            Premium operational contacts for {organizer.organization} ({organizer.region}).
            {internalMode
              ? ' Internal view — all records including sales pipeline & restricted agencies.'
              : ' Client view — organizer-visible contacts only.'}
          </p>
        </div>
      </div>

      {internalMode && <OpsImportIntelligencePanel onImported={refresh} />}

      <div className={`rounded-2xl p-4 mb-6 ${surface}`}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
            <input
              type="search"
              placeholder="Search orgs, contacts, departments…"
              value={filters.q}
              onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm border ${btnSecondary}`}
            />
          </div>
          <select
            value={filters.county}
            onChange={e => setFilters(f => ({ ...f, county: e.target.value }))}
            className={`text-sm rounded-lg border px-3 py-2 min-w-[140px] ${btnSecondary}`}
          >
            <option value="">All counties</option>
            <option value="nassau">Nassau</option>
            <option value="suffolk">Suffolk</option>
          </select>
          <select
            value={filters.orgType}
            onChange={e => setFilters(f => ({ ...f, orgType: e.target.value }))}
            className={`text-sm rounded-lg border px-3 py-2 min-w-[160px] ${btnSecondary}`}
          >
            <option value="">All org types</option>
            {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filters.purposeTag}
            onChange={e => setFilters(f => ({ ...f, purposeTag: e.target.value }))}
            className={`text-sm rounded-lg border px-3 py-2 min-w-[140px] ${btnSecondary}`}
          >
            <option value="">All purposes</option>
            {Object.entries(PURPOSE_TAG_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filters.outreachStatus}
            onChange={e => setFilters(f => ({ ...f, outreachStatus: e.target.value }))}
            className={`text-sm rounded-lg border px-3 py-2 min-w-[140px] ${btnSecondary}`}
          >
            <option value="">Outreach status</option>
            {Object.entries(OUTREACH_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <OrganizerLoadingState />
      ) : organizations.length === 0 ? (
        <div className={`rounded-2xl p-8 text-center ${surface}`}>
          <BookUser className={`h-10 w-10 mx-auto mb-3 ${muted}`} />
          <p className={`font-medium ${heading}`}>No contacts match your filters</p>
          <p className={`text-sm mt-1 ${muted}`}>Try broadening search or switch to internal view.</p>
        </div>
      ) : (
        <div className={`rounded-2xl overflow-hidden ${surface}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-left ${muted}`}>
                  <th className="p-3 font-medium">Organization</th>
                  <th className="p-3 font-medium hidden md:table-cell">Jurisdiction</th>
                  <th className="p-3 font-medium hidden lg:table-cell">Key contact</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => {
                  const contact = org.contacts[0];
                  return (
                    <tr
                      key={org.id}
                      className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50/80 dark:hover:bg-stone-800/30 cursor-pointer"
                      onClick={() => openDetail(org.id)}
                    >
                      <td className="p-3">
                        <div className={`font-semibold ${heading}`}>{org.name}</div>
                        <div className={`text-xs ${muted}`}>{ORG_TYPE_LABELS[org.type]}</div>
                      </td>
                      <td className={`p-3 hidden md:table-cell ${muted}`}>
                        {org.jurisdiction?.name ?? '—'}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {contact ? (
                          <div>
                            <div className={heading}>{contact.name}</div>
                            <div className={`text-xs ${muted}`}>
                              {contact.purposeTags.slice(0, 2).map(t => PURPOSE_TAG_LABELS[t]).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className={muted}>—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {OUTREACH_STATUS_LABELS[org.outreachStatus]}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                          {contact?.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className={`p-2 rounded-lg ${btnSecondary}`}
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          {contact?.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className={`p-2 rounded-lg ${btnSecondary}`}
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openDetail(org.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs ${btnPrimary}`}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className={`text-xs mt-6 ${muted}`}>
        Future: event-specific contact panels, compliance deep-links, and vendor-facing “Who to contact” for approved paying users.
      </p>

      <OpsContactDetailDrawer
        organization={selected}
        onClose={() => setSelected(null)}
        onLogNote={handleLogNote}
        viewerRole={viewerRole}
      />
    </OrganizerLayout>
  );
}
