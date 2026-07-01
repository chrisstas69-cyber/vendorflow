import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import type { EventDebriefInput } from '@/lib/event-debrief-schema';
import { deleteDebrief, getDebrief, upsertDebrief } from '@/lib/event-debrief-store';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

/** GET — single debrief */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const debrief = await getDebrief(id);
  if (!debrief) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, debrief, dataSource: getEffectiveDataSource() });
}

/** PATCH — partial update (full upsert merge) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const existing = await getDebrief(id);
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

/** DELETE */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const ok = await deleteDebrief(id);
  return NextResponse.json({ ok, dataSource: getEffectiveDataSource() });
}

/** PUT — replace by id */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensurePlatformSeed();
  const { id } = await params;
  const body = await req.json();
  const vendorEmail = (body.vendorEmail as string) ?? DEMO_VENDOR_EMAIL;
  const input = body.debrief as EventDebriefInput;
  const saved = await upsertDebrief(vendorEmail, { ...input, id });
  return NextResponse.json({ ok: true, debrief: saved, dataSource: getEffectiveDataSource() });
}
