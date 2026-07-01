'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Upload } from 'lucide-react';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';

export interface ReceiptItem {
  id: string;
  category: string;
  amount: number;
  fileName?: string | null;
  notes: string;
  createdAt: string;
  hasImage: boolean;
  imageData?: string | null;
}

const CATEGORIES = [
  'Booth fees',
  'Permits',
  'Inventory',
  'Gas & mileage',
  'Supplies',
  'Insurance',
  'Other',
];

export function ReceiptVaultPanel() {
  const { card, cardInset, muted, btnPrimary } = useVendorTheme();
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/vendors/receipts');
    const data = await res.json();
    if (data.ok) setItems(data.items);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const cat of CATEGORIES) map.set(cat, { count: 0, total: 0 });
    for (const item of items) {
      const cur = map.get(item.category) ?? { count: 0, total: 0 };
      map.set(item.category, { count: cur.count + 1, total: cur.total + item.amount });
    }
    return map;
  }, [items]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await fetch('/api/vendors/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount) || 0,
          fileName: file.name,
          imageData: imageData.length < 500_000 ? imageData : undefined,
          notes: file.name,
        }),
      });
      await load();
      setAmount('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-bold">Receipt vault</h2>
        <label className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${btnPrimary}`}>
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload receipt'}
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            disabled={uploading}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-lg border px-2 py-1 bg-transparent"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount $"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="rounded-lg border px-2 py-1 w-28 bg-transparent"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {CATEGORIES.map(cat => {
          const stats = byCategory.get(cat) ?? { count: 0, total: 0 };
          return (
            <div key={cat} className={`rounded-xl p-3 ${cardInset}`}>
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold">{cat}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className={`text-xs ${muted}`}>{stats.count} receipts</div>
              <div className="text-lg font-bold mt-1">${stats.total.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {items.slice(0, 8).map(item => (
            <div key={item.id} className={`text-xs flex justify-between gap-2 p-2 rounded-lg ${cardInset}`}>
              <span>{item.category} · {item.fileName ?? 'Receipt'}</span>
              <span className="font-semibold">${item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
