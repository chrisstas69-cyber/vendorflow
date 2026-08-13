import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/submit-event?error=missing-token', req.url));
  const submission = await prisma.eventSubmission.findUnique({ where: { verificationToken: token } });
  if (!submission) return NextResponse.redirect(new URL('/submit-event?error=invalid-token', req.url));
  await prisma.eventSubmission.update({ where: { id: submission.id }, data: { verifiedAt: new Date(), status: 'pending' } });
  return NextResponse.redirect(new URL('/submit-event?verified=1', req.url));
}
