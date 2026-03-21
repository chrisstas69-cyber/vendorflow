import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  // Security: only allow from localhost
  const host = req.headers.get('host') || '';
  if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return NextResponse.json({ error: 'Setup only available on localhost' }, { status: 403 });
  }

  const body = await req.json();
  const envPath = path.join(process.cwd(), '.env.local');

  // Read existing .env.local if it exists
  let existing: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) existing[match[1].trim()] = match[2].trim();
    }
  }

  // Merge new values
  const allowedKeys = [
    'GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SPREADSHEET_ID',
    'GMAIL_FROM', 'GMAIL_APP_PASSWORD', 'GMAIL_TO',
    'CLAUDE_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY',
  ];

  for (const key of allowedKeys) {
    if (body[key] !== undefined && body[key] !== '') {
      existing[key] = body[key];
    }
  }

  // Write .env.local
  const content = Object.entries(existing)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  fs.writeFileSync(envPath, content);

  return NextResponse.json({
    success: true,
    message: 'Configuration saved. Restart the dev server for changes to take effect.',
    configured: Object.keys(existing),
  });
}
