'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, Sparkles, Zap } from 'lucide-react';
import type { QuickAction } from '@/lib/assistant/quick-actions';
import {
  ORGANIZER_STARTER_PROMPTS,
  VENDOR_STARTER_PROMPTS,
} from '@/lib/assistant/quick-actions';

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
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[720px] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.role === 'assistant' && (
                <Sparkles className="h-4 w-4 text-indigo-500 mb-1" />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700">
                  {msg.actions.map(action => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 text-gray-900 text-xs font-semibold hover:bg-amber-300"
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          {starters.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
