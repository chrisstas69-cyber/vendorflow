'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, Sparkles, Zap } from 'lucide-react';
import type { QuickAction } from '@/lib/assistant/quick-actions';
import {
  ORGANIZER_STARTER_PROMPTS,
  VENDOR_STARTER_PROMPTS,
} from '@/lib/assistant/quick-actions';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: QuickAction[];
}

export interface AssistantChatPanelProps {
  role: 'organizer' | 'vendor';
}

export function AssistantChatPanel({ role }: AssistantChatPanelProps) {
  const starters = role === 'organizer' ? ORGANIZER_STARTER_PROMPTS : VENDOR_STARTER_PROMPTS;
  const { card, cardInset, muted, heading, input: inputClass, btnPrimary, btnSecondary, divider, accent, dark } =
    useVendorTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        role === 'organizer'
          ? 'Hi — I can help with call sheets, vendor matching, and permit deadlines. Try a quick prompt below.'
          : 'Hi — I can help find events, check compliance docs, and draft applications.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const userBubble =
    role === 'vendor'
      ? 'bg-amber-400 text-gray-900'
      : dark
        ? 'bg-indigo-600 text-white'
        : 'bg-indigo-600 text-white';

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, message: text.trim() }),
        });
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply ?? 'Sorry, I could not generate a response.',
          actions: data.actions,
        };
        setMessages(prev => [...prev, assistantMsg]);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
      } finally {
        setLoading(false);
      }
    },
    [loading, role]
  );

  return (
    <div className={`flex flex-col h-[calc(100vh-12rem)] max-h-[720px] rounded-2xl border overflow-hidden ${card}`}>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? userBubble
                  : `${cardInset} ${heading}`
              }`}
            >
              {msg.role === 'assistant' && (
                <Sparkles className={`h-4 w-4 mb-1 ${role === 'vendor' ? accent : 'text-indigo-500'}`} />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.actions && msg.actions.length > 0 && (
                <div className={`flex flex-wrap gap-2 mt-3 pt-3 border-t ${divider}`}>
                  {msg.actions.map(action => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${btnPrimary}`}
                    >
                      <Zap className="h-3 w-3" />
                      {action.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`flex items-center gap-2 text-sm ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className={`border-t p-3 space-y-2 ${divider}`}>
        <div className="flex flex-wrap gap-2">
          {starters.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className={`text-xs px-3 py-1.5 rounded-full border ${btnSecondary}`}
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything…"
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${inputClass}`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`p-2.5 rounded-xl disabled:opacity-50 ${
              role === 'vendor' ? btnPrimary : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
