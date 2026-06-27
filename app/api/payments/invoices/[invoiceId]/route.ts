import { scaffoldResponse } from '@/lib/api-scaffold';

interface RouteParams {
  params: { invoiceId: string };
}

/** GET — single invoice with line items and payment splits */
export async function GET(_req: Request, { params }: RouteParams) {
  return scaffoldResponse('payments.invoices.detail', ['GET'], {
    invoiceId: params.invoiceId,
  });
}

/** PATCH — update invoice status, splits, or due date */
export async function PATCH(_req: Request, { params }: RouteParams) {
  return scaffoldResponse('payments.invoices.detail', ['PATCH'], {
    invoiceId: params.invoiceId,
  });
}
