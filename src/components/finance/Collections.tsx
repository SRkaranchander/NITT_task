// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Collections & Receivables Module (Payments, FIFO Allocation & 4-Bucket Ageing)
// ==============================================================================

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';
import { useDatabase, useFinance, useSales, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/math';

export const Collections: React.FC = () => {
  const dbState = useDatabase();
  const { payments, totalReceivables, totalCollected, recordPayment } = useFinance();
  const { customers, invoices } = useSales();
  const { currentUser } = useCurrentUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(4000);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('UPI-77401122889');
  const [notes, setNotes] = useState('Benchmark Part Payment via GPay');

  const unpaidInvoices = invoices.filter((i) => i.outstandingAmount > 0.01 && i.status !== 'CANCELLED');

  // 4 Ageing Buckets calculation (0-30, 31-60, 61-90, 90+ days)
  const now = Date.now();
  const ageingBuckets = {
    '0-30': { label: '0–30 Days (Current)', amount: 0, count: 0 },
    '31-60': { label: '31–60 Days', amount: 0, count: 0 },
    '61-90': { label: '61–90 Days', amount: 0, count: 0 },
    '90+': { label: '90+ Days (Overdue)', amount: 0, count: 0 },
  };

  for (const inv of unpaidInvoices) {
    const invDate = new Date(inv.invoiceDate).getTime();
    const ageDays = Math.max(0, Math.floor((now - invDate) / (1000 * 60 * 60 * 24)));

    if (ageDays <= 30) {
      ageingBuckets['0-30'].amount += inv.outstandingAmount;
      ageingBuckets['0-30'].count++;
    } else if (ageDays <= 60) {
      ageingBuckets['31-60'].amount += inv.outstandingAmount;
      ageingBuckets['31-60'].count++;
    } else if (ageDays <= 90) {
      ageingBuckets['61-90'].amount += inv.outstandingAmount;
      ageingBuckets['61-90'].count++;
    } else {
      ageingBuckets['90+'].amount += inv.outstandingAmount;
      ageingBuckets['90+'].count++;
    }
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p = recordPayment({
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        amount: paymentAmount,
        paymentMode,
        referenceNumber,
        notes,
      });

      alert(`Payment receipt ${p.paymentNumber} of ₹${paymentAmount} recorded and allocated!`);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Collections & Receivables
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Payment receipts, invoice allocations, customer ledger balances & 4-bucket ageing
          </p>
        </div>

        {currentUser.role !== 'AUDITOR' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            Total Customer Receivables
          </div>
          <div className="text-2xl font-bold font-mono text-[#E5AC58]">
            {formatINR(totalReceivables)}
          </div>
          <div className="text-xs text-[#8993A1] mt-1">
            Across {unpaidInvoices.length} unpaid / partial invoices
          </div>
        </div>

        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            Total Collected This Month
          </div>
          <div className="text-2xl font-bold font-mono text-[#63D39B]">
            {formatINR(totalCollected)}
          </div>
          <div className="text-xs text-[#8993A1] mt-1">
            {payments.length} successful payment receipts
          </div>
        </div>

        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            Customers with Balances
          </div>
          <div className="text-2xl font-bold font-mono text-[#E8EBF0]">
            {customers.filter((c) => (c.totalOutstanding || 0) > 0).length} / {customers.length}
          </div>
          <div className="text-xs text-[#8993A1] mt-1">
            Credit periods: 30 to 45 days
          </div>
        </div>
      </div>

      {/* 4 Ageing Buckets Grid (Section 14) */}
      <div className="bg-[#15191F] border border-[#282E37] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
            Receivables Ageing Analysis
          </span>
          <span className="text-[11px] font-mono text-[#8993A1]">
            Statutory 30-day buckets
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#63D39B] uppercase font-bold">0–30 Days</div>
            <div className="text-base font-bold text-[#E8EBF0] mt-1">
              {formatINR(ageingBuckets['0-30'].amount)}
            </div>
            <div className="text-[10px] text-[#8993A1] mt-0.5">
              {ageingBuckets['0-30'].count} invoices (Current)
            </div>
          </div>

          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#E5AC58] uppercase font-bold">31–60 Days</div>
            <div className="text-base font-bold text-[#E8EBF0] mt-1">
              {formatINR(ageingBuckets['31-60'].amount)}
            </div>
            <div className="text-[10px] text-[#8993A1] mt-0.5">
              {ageingBuckets['31-60'].count} invoices
            </div>
          </div>

          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#F0B44D] uppercase font-bold">61–90 Days</div>
            <div className="text-base font-bold text-[#E8EBF0] mt-1">
              {formatINR(ageingBuckets['61-90'].amount)}
            </div>
            <div className="text-[10px] text-[#8993A1] mt-0.5">
              {ageingBuckets['61-90'].count} invoices
            </div>
          </div>

          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#F06B6B] uppercase font-bold">90+ Days</div>
            <div className="text-base font-bold text-[#E8EBF0] mt-1">
              {formatINR(ageingBuckets['90+'].amount)}
            </div>
            <div className="text-[10px] text-[#8993A1] mt-0.5">
              {ageingBuckets['90+'].count} invoices (Overdue)
            </div>
          </div>
        </div>
      </div>

      {/* Customer Balances & Payment Receipts Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Balances Table */}
        <div className="bg-[#15191F] border border-[#282E37]">
          <div className="p-3 border-b border-[#282E37] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
              Customer Ledger Balances
            </span>
          </div>

          <div className="divide-y divide-[#282E37] text-xs font-mono">
            {customers.map((c) => (
              <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-[#1C2129]">
                <div>
                  <div className="font-bold text-[#E8EBF0]">{c.name}</div>
                  <div className="text-[11px] text-[#8993A1] mt-0.5">
                    {c.businessName} • {c.state}
                  </div>
                  <div className="text-[10px] text-[#5A6372]">
                    GSTIN: {c.gstin} • Credit: {c.creditPeriodDays} days
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase text-[#8993A1]">Outstanding:</div>
                  <div className="text-sm font-bold text-[#E5AC58]">
                    {formatINR(c.totalOutstanding || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Receipts History */}
        <div className="bg-[#15191F] border border-[#282E37]">
          <div className="p-3 border-b border-[#282E37] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
              Recorded Payment Receipts ({payments.length})
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#8993A1]">
              No payments recorded yet. Click "Record Payment" to log an inflow.
            </div>
          ) : (
            <div className="divide-y divide-[#282E37] text-xs font-mono">
              {payments.map((p) => (
                <div key={p.id} className="p-3.5 hover:bg-[#1C2129]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#E8EBF0]">{p.paymentNumber}</span>
                    <Badge variant="success">{p.paymentMode}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[#8993A1]">
                    <span>{p.customerName}</span>
                    <span className="text-sm font-bold text-[#63D39B]">
                      +{formatINR(p.amount)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5A6372] mt-1 flex items-center justify-between">
                    <span>Ref: {p.referenceNumber || 'N/A'}</span>
                    <span>{p.paymentDate}</span>
                  </div>
                  {p.allocations && p.allocations.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-[#282E37] text-[10px] text-[#8993A1]">
                      Allocated to: <span className="text-[#E8EBF0]">{p.allocations.map((a) => `${a.invoiceNumber} (₹${a.allocatedAmount})`).join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#15191F] border border-[#282E37] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282E37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#E5AC58]" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#E8EBF0]">
                  Record Customer Payment
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8993A1] hover:text-[#E8EBF0] text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Outstanding: ₹{c.totalOutstanding || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  Specific Invoice Allocation (Optional - FIFO applies if left empty)
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                >
                  <option value="">Auto-Allocate (Oldest Invoices First)</option>
                  {invoices
                    .filter((i) => i.customerId === selectedCustomerId && i.outstandingAmount > 0.01)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — Due: ₹{inv.outstandingAmount}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                    <option value="CASH">Cash Counter</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  Reference / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#282E37] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#101318] border border-[#282E37] text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded"
                >
                  Save & Allocate Payment →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
