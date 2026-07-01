import { getRequiredForms } from '@/lib/documents';
import { DEMO_ORGANIZER_ID, type PlatformEvent } from '@/lib/platform-data';
import { getActiveOrganizerId } from '@/lib/pilot-config';

export interface VendorApplyPayload {
  eventId: string;
  eventName: string;
  vendorEmail: string;
  vendorName: string;
  category: string;
  message?: string;
  hasInsurance?: boolean;
  setupPhotoUrl?: string;
  requiredForms?: string[];
}

export async function submitVendorApplicationToOrganizer(
  event: Pick<PlatformEvent, 'id' | 'name' | 'category' | 'organizerId'>,
  data: Omit<VendorApplyPayload, 'eventId' | 'eventName'>
): Promise<{ ok: boolean; message: string; itemId?: string }> {
  const organizerId = event.organizerId || getActiveOrganizerId() || DEMO_ORGANIZER_ID;
  const requiredForms = getRequiredForms(event.category);

  try {
    const res = await fetch('/api/organizer/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        create: {
          organizerId,
          eventId: event.id,
          eventName: event.name,
          vendorEmail: data.vendorEmail,
          vendorName: data.vendorName,
          category: data.category,
          message: data.message ?? '',
          requiredForms,
          hasInsurance: data.hasInsurance ?? false,
          setupPhotoUrl: data.setupPhotoUrl,
        },
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, message: json.error ?? 'Application could not be saved' };
    }
    return {
      ok: true,
      message: 'Application submitted! The organizer will review it in their inbox.',
      itemId: json.item?.id,
    };
  } catch {
    return { ok: false, message: 'Network error — try again when online' };
  }
}
