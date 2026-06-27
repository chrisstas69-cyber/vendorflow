import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // No redirects — the app works without keys, just with limited features
  // The setup page is always accessible
  // Individual features check their own keys and show helpful messages
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
