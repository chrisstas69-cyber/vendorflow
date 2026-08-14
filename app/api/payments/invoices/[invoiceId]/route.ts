import { scaffoldResponse } from '@/lib/api-scaffold';
import { requireSession } from '@/lib/auth/guards';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** GET — single invoice with line items and payment splits */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requireSession(req); if (!auth.ok) return auth.response;
  const { invoiceId } = await params;
  return scaffoldResponse('payments.invoices.detail', ['GET'], {
    invoiceId,
  });
}

/** PATCH — update invoice status, splits, or due date */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireSession(req); if (!auth.ok) return auth.response;
  const { invoiceId } = await params;
  return scaffoldResponse('payments.invoices.detail', ['PATCH'], {
    invoiceId,
  });
}
