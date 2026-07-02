import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import type { EventDebriefInput } from '@/lib/event-debrief-schema';
import { deleteDebrief, getDebrief, upsertDebrief } from '@/lib/event-debrief-store';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';

async function getOwnedDebrief(req: NextRequest, id: string) {
  const vendorEmail = resolveVendorEmail(req);
  const debrief = await getDebrief(id);
  if (!debrief || debrief.vendorEmail !== vendorEmail) return null;
  return debrief;
}

/** GET — single debrief (owner only) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const debrief = await getOwnedDebrief(req, id);
  if (!debrief) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, debrief, dataSource: getEffectiveDataSource() });
}

/** PATCH — partial update (owner only) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const existing = await getOwnedDebrief(req, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  const patch = (await req.json()) as Partial<EventDebriefInput>;
  const merged: EventDebriefInput = {
    ...existing,
    ...patch,
    id: existing.id,
    checklist: patch.checklist ?? existing.checklist,
  };
  const saved = await upsertDebrief(existing.vendorEmail, merged);
  return NextResponse.json({ ok: true, debrief: saved, dataSource: getEffectiveDataSource() });
}

/** DELETE — owner only */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const existing = await getOwnedDebrief(req, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  const ok = await deleteDebrief(id);
  return NextResponse.json({ ok, dataSource: getEffectiveDataSource() });
}

/** PUT — replace by id (owner only; email bound to session) */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const existing = await getOwnedDebrief(req, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  const body = await req.json();
  const input = body.debrief as EventDebriefInput;
  const saved = await upsertDebrief(existing.vendorEmail, { ...input, id });
  return NextResponse.json({ ok: true, debrief: saved, dataSource: getEffectiveDataSource() });
}
