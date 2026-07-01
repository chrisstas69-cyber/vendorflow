'use client';

import { useState } from 'react';
import { CheckSquare, Download, Plus, Printer, Trash2 } from 'lucide-react';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { useEventDebrief } from '@/contexts/event-debrief-context';
import { debriefsToCsv, downloadCsv, printLogbook } from '@/lib/event-debrief-export';
import type { ChecklistItem } from '@/lib/event-debrief-schema';

interface SetupChecklistProps {
  debriefId?: string;
  checklist: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  editableTemplate?: boolean;
}

export function SetupChecklist({
  debriefId,
  checklist,
  onChange,
  editableTemplate = true,
}: SetupChecklistProps) {
  const { cardInset, muted } = useVendorTheme();
  const { updateChecklistTemplate, addChecklistTemplateItem, removeChecklistTemplateItem, updateChecklist } =
    useEventDebrief();
  const [newItem, setNewItem] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(false);

  const toggle = async (id: string) => {
    const next = checklist.map(i => (i.id === id ? { ...i, done: !i.done } : i));
    onChange(next);
    if (debriefId && !debriefId.startsWith('draft-')) {
      await updateChecklist(debriefId, next);
    }
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    if (editingTemplate) {
      addChecklistTemplateItem(newItem);
      onChange([...checklist, { id: `chk-${Date.now()}`, label: newItem.trim(), done: false }]);
    } else {
      onChange([...checklist, { id: `chk-${Date.now()}`, label: newItem.trim(), done: false }]);
    }
    setNewItem('');
  };

  const handleRemove = (id: string) => {
    if (editingTemplate) removeChecklistTemplateItem(id);
    onChange(checklist.filter(i => i.id !== id));
    if (editingTemplate) {
      updateChecklistTemplate(checklist.filter(i => i.id !== id));
    }
  };

  const doneCount = checklist.filter(i => i.done).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          <span className="font-semibold text-sm">Setup checklist</span>
          <span className={`text-xs ${muted}`}>
            {doneCount}/{checklist.length}
          </span>
        </div>
        {editableTemplate && (
          <button
            type="button"
            onClick={() => setEditingTemplate(v => !v)}
            className={`text-xs ${muted} hover:underline`}
          >
            {editingTemplate ? 'Done editing' : 'Edit my list'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {checklist.map(item => (
          <label
            key={item.id}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${cardInset}`}
          >
            <input
              type="checkbox"
              className="rounded"
              checked={item.done}
              onChange={() => toggle(item.id)}
            />
            <span className={`text-sm flex-1 ${item.done ? 'line-through opacity-60' : ''}`}>
              {item.label}
            </span>
            {editingTemplate && (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  handleRemove(item.id);
                }}
                className="p-1 text-red-500"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add item…"
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700"
          aria-label="Add"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function EventLogbookExport() {
  const { btnSecondary } = useVendorTheme();
  const { debriefs } = useEventDebrief();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          const csv = debriefsToCsv(debriefs);
          downloadCsv(`vendorflow-logbook-${new Date().toISOString().slice(0, 10)}.csv`, csv);
        }}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${btnSecondary}`}
      >
        <Download className="h-4 w-4" /> Export CSV
      </button>
      <button
        type="button"
        onClick={() => printLogbook(debriefs, 'My vendor logbook')}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${btnSecondary}`}
      >
        <Printer className="h-4 w-4" /> Print book
      </button>
    </div>
  );
}
