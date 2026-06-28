'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  ContactPurposeTag,
  OpsOrganizationRecord,
  OrgType,
  OutreachStatus,
} from '@/lib/ops-contacts-schema';

export interface OpsContactsFilters {
  q: string;
  county: string;
  town: string;
  orgType: string;
  purposeTag: string;
  outreachStatus: string;
  showInternal: boolean;
}

export function useOpsContacts(viewerRole: 'internal' | 'organizer' = 'organizer') {
  const [organizations, setOrganizations] = useState<OpsOrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OpsContactsFilters>({
    q: '',
    county: '',
    town: '',
    orgType: '',
    purposeTag: '',
    outreachStatus: '',
    showInternal: viewerRole === 'internal',
  });

  const buildQuery = useCallback(
    (f: OpsContactsFilters) => {
      const p = new URLSearchParams();
      p.set('viewerRole', viewerRole);
      if (f.q) p.set('q', f.q);
      if (f.county) p.set('county', f.county);
      if (f.town) p.set('town', f.town);
      if (f.orgType) p.set('orgType', f.orgType);
      if (f.purposeTag) p.set('purposeTag', f.purposeTag);
      if (f.outreachStatus) p.set('outreachStatus', f.outreachStatus);
      if (f.showInternal && viewerRole === 'internal') p.set('internalOnly', 'true');
      return p.toString();
    },
    [viewerRole]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/contacts?${buildQuery(filters)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Failed to load contacts');
      setOrganizations(json.organizations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filters, buildQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadOrganization = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/ops/organizations/${id}?viewerRole=${viewerRole}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Not found');
      return json.organization as OpsOrganizationRecord;
    },
    [viewerRole]
  );

  const logOutreach = useCallback(
    async (organizationId: string, input: { activityType: string; summary: string; contactId?: string }) => {
      const res = await fetch(`/api/ops/organizations/${organizationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, actorLabel: viewerRole === 'internal' ? 'VendorFlow team' : 'Organizer' }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Failed to log activity');
      await refresh();
      return json.activity;
    },
    [viewerRole, refresh]
  );

  return {
    organizations,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    loadOrganization,
    logOutreach,
  };
}

export type { OpsOrganizationRecord, OrgType, OutreachStatus, ContactPurposeTag };
