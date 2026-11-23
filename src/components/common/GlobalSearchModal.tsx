// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Global Quick Search Modal (⌘K / Ctrl+K)
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Package, FileText, ShoppingBag, Factory, User } from 'lucide-react';
import { useDatabase } from '../../services/db/useDatabase';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string, referenceId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const db = useDatabase();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const results: {
      type: string;
      title: string;
      subtitle: string;
      tab: string;
      id: string;
      icon: any;
    }[] = [];

    // Orders
    for (const o of db.orders) {
      if (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Sales Order',
          title: `${o.orderNumber} — ${o.customerName}`,
          subtitle: `₹${o.totalAmount} • Status: ${o.status}`,
          tab: 'sales-orders',
          id: o.id,
          icon: ShoppingBag,
        });
      }
    }

    // Invoices
    for (const inv of db.invoices) {
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'GST Invoice',
          title: `${inv.invoiceNumber} — ${inv.customerName}`,
          subtitle: `₹${inv.totalAmount} • ${inv.isInterstate ? 'IGST 5%' : 'CGST+SGST 5%'}`,
          tab: 'billing-gst',
          id: inv.id,
          icon: FileText,
        });
      }
    }

    // Production Batches
    for (const run of db.productionRuns) {
      if (
        run.batchId.toLowerCase().includes(q) ||
        run.productName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Production Batch',
          title: `${run.batchId} — ${run.productName}`,
          subtitle: `${run.actualGoodOutput} good pkts • Yield Var: ${run.yieldVariancePercent}%`,
          tab: 'production-studio',
          id: run.id,
          icon: Factory,
        });
      }
    }

    // Materials
    for (const mat of db.materials) {
      if (
        mat.name.toLowerCase().includes(q) ||
        mat.sku.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Inventory Item',
          title: `${mat.name} (${mat.sku})`,
          subtitle: `Stock: ${mat.currentStock} ${mat.unit} • Avg Cost: ₹${mat.averageCost}/${mat.unit}`,
          tab: 'inventory-flow',
          id: mat.id,
          icon: Package,
        });
      }
    }

    // Customers
    for (const cust of db.customers) {
      if (
        cust.name.toLowerCase().includes(q) ||
        cust.code.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Customer',
          title: `${cust.name} (${cust.code})`,
          subtitle: `${cust.state} • Outstanding: ₹${cust.totalOutstanding || 0}`,
          tab: 'collections',
          id: cust.id,
          icon: User,
        });
      }
    }

    return results.slice(0, 8);
  }, [query, db]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#15191F] border border-[#282E37] shadow-2xl rounded-none overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#282E37] bg-[#101318]">
          <Search className="w-4 h-4 text-[#8993A1]" />
          <input
            type="text"
            placeholder="Type batch ID, order number, customer, or material..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#E8EBF0] placeholder-[#5A6372] font-mono"
          />
          <button
            onClick={onClose}
            className="text-[#8993A1] hover:text-[#E8EBF0] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate(item.tab, item.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 text-left rounded hover:bg-[#1C2129] border border-transparent hover:border-[#282E37] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-[#101318] border border-[#282E37] text-[#E5AC58]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#E8EBF0]">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#8993A1] font-mono">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#101318] border border-[#282E37] text-[#8993A1]">
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-xs text-[#8993A1] font-mono">
              No matching orders, batches, customers or materials found for "{query}"
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#8993A1] font-mono space-y-1">
              <div>Quick suggestions:</div>
              <div className="text-[#5A6372]">
                Try typing "BATCH", "Retailer A", "Flour", "INV-2026", or "SO-"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
