'use client';

import { useState } from 'react';
import { Upload, X, FileText, DollarSign, Clock, TrendingUp, CreditCard, Banknote } from 'lucide-react';
import type { FinancialRecord } from '@/lib/mock-data';

interface ParsedTransaction {
  time: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  description: string;
}

interface ParsedReport {
  eventName: string;
  date: string;
  transactions: ParsedTransaction[];
  grossSales: number;
  expenses: number;
  netProfit: number;
  margin: number;
  breakEvenHour: string;
  bestHour: string;
  cashPercent: number;
  cardPercent: number;
}

interface PaymentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (record: Omit<FinancialRecord, 'id'>) => void;
  eventName?: string;
  eventDate?: string;
}

function parseSquareCSV(text: string): ParsedTransaction[] {
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());

    if (cleanFields.length >= 4) {
      const time = cleanFields[1] || '12:00 PM';
      const amount = parseFloat(cleanFields[2]?.replace(/[^0-9.-]/g, '') || '0');
      const paymentMethod = cleanFields[4]?.toLowerCase().includes('cash') ? 'cash' : 'card';
      const description = cleanFields[5] || 'Sale';

      if (amount > 0) {
        transactions.push({ time, amount, paymentMethod, description });
      }
    }
  }

  return transactions;
}

function calculateMetrics(transactions: ParsedTransaction[], totalExpenses: number) {
  const grossSales = transactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = grossSales - totalExpenses;
  const margin = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

  const cashTotal = transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);
  const cardTotal = transactions
    .filter(t => t.paymentMethod === 'card')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashPercent = grossSales > 0 ? Math.round((cashTotal / grossSales) * 100) : 0;
  const cardPercent = grossSales > 0 ? Math.round((cardTotal / grossSales) * 100) : 0;

  const hourlyData: Record<string, number> = {};
  transactions.forEach(t => {
    const parts = t.time.split(' ');
    const hour = `${t.time.split(':')[0]} ${parts[parts.length - 1] || 'PM'}`;
    hourlyData[hour] = (hourlyData[hour] || 0) + t.amount;
  });

  let bestHour = '12:00 PM';
  let bestAmount = 0;
  Object.entries(hourlyData).forEach(([hour, amount]) => {
    if (amount > bestAmount) {
      bestAmount = amount;
      bestHour = hour;
    }
  });

  let cumulative = 0;
  let breakEvenHour = '12:00 PM';
  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(`2000-01-01 ${a.time}`).getTime() - new Date(`2000-01-01 ${b.time}`).getTime()
  );
  for (const transaction of sorted) {
    cumulative += transaction.amount;
    if (cumulative >= totalExpenses) {
      breakEvenHour = transaction.time;
      break;
    }
  }

  return {
    grossSales,
    netProfit,
    margin,
    cashPercent,
    cardPercent,
    bestHour: `${bestHour} ($${bestAmount.toFixed(0)})`,
    breakEvenHour,
  };
}

export function PaymentUploadDialog({
  isOpen,
  onClose,
  onImport,
  eventName = '',
  eventDate = '',
}: PaymentUploadDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedReport | null>(null);
  const [expenses, setExpenses] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const transactions = parseSquareCSV(text);
        if (transactions.length === 0) {
          setError('No valid transactions found in CSV');
          return;
        }
        const metrics = calculateMetrics(transactions, expenses);
        setParsedData({
          eventName: eventName || 'Imported Event',
          date: eventDate || new Date().toISOString().split('T')[0],
          transactions,
          ...metrics,
          expenses,
        });
      } catch {
        setError('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedData) return;
    onImport({
      eventName: parsedData.eventName,
      date: parsedData.date,
      grossSales: parsedData.grossSales,
      expenses: parsedData.expenses,
      netProfit: parsedData.netProfit,
      margin: parsedData.margin,
      breakEvenHour: parsedData.breakEvenHour,
      bestHour: parsedData.bestHour,
      cashPercent: parsedData.cashPercent,
      cardPercent: parsedData.cardPercent,
    });
    setParsedData(null);
    setExpenses(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-bg-secondary border-2 border-border-primary w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b-2 border-border-primary">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <h2 className="font-bold text-lg">IMPORT PAYMENT ACTIVITY</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-bg-tertiary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="border-2 border-accent-secondary bg-accent-secondary/5 p-3">
            <div className="font-bold text-sm mb-2">SUPPORTED FORMATS</div>
            <div className="text-xs text-text-secondary space-y-1">
              <div>• Square POS CSV Export</div>
              <div>• PayPal Transaction History CSV</div>
              <div>• Stripe Payment Export CSV</div>
              <div>• Generic CSV with: Time, Amount, Payment Method</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">EVENT NAME</label>
              <input
                type="text"
                value={eventName}
                disabled
                className="w-full px-3 py-2 border-2 border-border-primary bg-bg-tertiary text-text-secondary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">EVENT DATE</label>
              <input
                type="text"
                value={eventDate ? new Date(eventDate).toLocaleDateString() : ''}
                disabled
                className="w-full px-3 py-2 border-2 border-border-primary bg-bg-tertiary text-text-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              TOTAL EXPENSES (Booth Fee, Permits, Inventory, Gas, etc.)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">$</span>
              <input
                type="number"
                value={expenses}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setExpenses(val);
                  if (parsedData) {
                    const metrics = calculateMetrics(parsedData.transactions, val);
                    setParsedData({ ...parsedData, expenses: val, ...metrics });
                  }
                }}
                className="flex-1 px-3 py-2 border-2 border-border-primary bg-bg-primary"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">UPLOAD CSV FILE</label>
            <div className="border-2 border-dashed border-border-primary bg-bg-primary p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-text-secondary" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-block bg-accent-primary hover:bg-accent-secondary border-2 border-black text-black font-bold py-2 px-4 cursor-pointer transition-colors"
              >
                SELECT CSV FILE
              </label>
              <p className="text-xs text-text-secondary mt-2">Drag and drop or click to browse</p>
            </div>
          </div>

          {error && (
            <div className="border-2 border-accent-tertiary bg-accent-tertiary/10 p-3">
              <div className="text-sm font-bold text-accent-tertiary">{error}</div>
            </div>
          )}

          {parsedData && (
            <div className="border-2 border-accent-primary bg-bg-primary p-4 space-y-3">
              <div className="font-bold text-sm mb-3">IMPORT PREVIEW</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="border-2 border-border-primary bg-bg-secondary p-2">
                  <div className="text-xs text-text-secondary mb-1">GROSS SALES</div>
                  <div className="text-lg font-bold">${parsedData.grossSales.toFixed(2)}</div>
                </div>
                <div className="border-2 border-border-primary bg-bg-secondary p-2">
                  <div className="text-xs text-text-secondary mb-1">EXPENSES</div>
                  <div className="text-lg font-bold">${parsedData.expenses.toFixed(2)}</div>
                </div>
                <div className="border-2 border-accent-primary bg-accent-primary/10 p-2">
                  <div className="text-xs text-text-secondary mb-1">NET PROFIT</div>
                  <div className="text-lg font-bold text-accent-primary">${parsedData.netProfit.toFixed(2)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border-2 border-border-primary bg-bg-secondary p-2">
                  <div className="flex items-center gap-1 text-xs text-text-secondary mb-1">
                    <Clock className="h-3 w-3" />
                    BREAK-EVEN
                  </div>
                  <div className="text-sm font-bold">{parsedData.breakEvenHour}</div>
                </div>
                <div className="border-2 border-border-primary bg-bg-secondary p-2">
                  <div className="flex items-center gap-1 text-xs text-text-secondary mb-1">
                    <TrendingUp className="h-3 w-3" />
                    BEST HOUR
                  </div>
                  <div className="text-sm font-bold">{parsedData.bestHour}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 border-2 border-border-primary bg-bg-secondary p-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-xs text-text-secondary">CASH</div>
                    <div className="font-bold">{parsedData.cashPercent}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-2 border-border-primary bg-bg-secondary p-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-text-secondary">CARD</div>
                    <div className="font-bold">{parsedData.cardPercent}%</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                {parsedData.transactions.length} transactions imported • Margin: {parsedData.margin}%
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 border-t-2 border-border-primary">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-bg-tertiary hover:bg-bg-primary border-2 border-border-primary font-bold py-3 px-4 transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!parsedData}
            className={`flex-1 font-bold py-3 px-4 transition-colors flex items-center justify-center gap-2 ${
              parsedData
                ? 'bg-accent-primary hover:bg-accent-secondary border-2 border-black text-black'
                : 'bg-bg-tertiary border-2 border-border-primary text-text-secondary cursor-not-allowed'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            IMPORT & SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
