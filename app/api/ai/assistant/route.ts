import { NextRequest, NextResponse } from 'next/server';
import { assembleAssistantContext, sanitizeContextForPrompt } from '@/lib/assistant/context-assembler';
import { parseQuickActionsFromReply } from '@/lib/assistant/quick-actions';
import type { UserRole } from '@/lib/platform-data';

/** POST — conversational assistant with context assembly + quick actions */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const role = (body.role as 'organizer' | 'vendor') ?? 'vendor';
  const message = (body.message as string)?.trim();

  if (!message) {
    return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 });
  }

  const ctx = assembleAssistantContext(role as UserRole);
  const contextPrompt = sanitizeContextForPrompt(ctx);
  const apiKey = process.env.CLAUDE_API_KEY;

  let reply: string;

  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `You are VendorFlow's ${role} assistant. Use the platform context to give concise, actionable answers. When suggesting call sheets, applications, invoices, or series management, mention those terms clearly so the UI can offer quick-action buttons. Never invent secrets or credentials.`,
          messages: [
            {
              role: 'user',
              content: `Context:\n${contextPrompt}\n\nUser: ${message}`,
            },
          ],
        }),
      });
      const data = (await res.json()) as { content?: { text?: string }[] };
      reply = data.content?.[0]?.text ?? fallbackReply(role, message, ctx);
    } catch {
      reply = fallbackReply(role, message, ctx);
    }
  } else {
    reply = fallbackReply(role, message, ctx);
  }

  const actions = parseQuickActionsFromReply(reply, role);

  return NextResponse.json({ ok: true, reply, actions, contextSummary: ctx.summary });
}

function fallbackReply(role: string, message: string, ctx: ReturnType<typeof assembleAssistantContext>): string {
  const lower = message.toLowerCase();
  if (lower.includes('call sheet')) {
    return `Based on ${ctx.summary}, I can draft a call sheet for your next event. Open the command center to instantiate the template with vendor load-in times and permit deadlines.`;
  }
  if (lower.includes('document') || lower.includes('permit') || lower.includes('compliance')) {
    return `For Long Island events, check NYS Certificate of Authority and county health permits. Review your passport document center and the application workflow for missing items.`;
  }
  if (lower.includes('match') || lower.includes('vendor')) {
    return `Use the Decision Panel on each application for rule-based match scores (category, footprint, insurance, geo). I can refresh AI insights from the intelligence engine.`;
  }
  if (lower.includes('invoice') || lower.includes('pay')) {
    return `You have invoicing available in the ${role} panel. Create an invoice draft with the standard 50/50 milestone contract template.`;
  }
  return `Got it — "${message}". ${ctx.summary}. Try asking about call sheets, vendor matching, permit deadlines, or invoice drafts.`;
}
