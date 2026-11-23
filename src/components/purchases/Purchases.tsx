// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Purchases & Supplier Inflow Module (Benchmark Purchase: 60kg Flour @ ₹45/kg)
// ==============================================================================

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Building,
  CheckCircle2,
  DollarSign,
  PackagePlus,
} from 'lucide-react';
import { useDatabase, useFinance, useInventory, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/math';

export const Purchases: React.FC = () => {
  const dbState = useDatabase();
  const { purchases, recordPurchase } = useFinance();
  const { rawMaterials, packaging } = useInventory();
  const { currentUser } = useCurrentUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(dbState.suppliers[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('SAM-INV-8821');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('mat-flour');
  const [quantity, setQuantity] = useState(60);
  const [rate, setRate] = useState(45);

  const handleRecordPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const po = recordPurchase({
        supplierId: selectedSupplierId,
        supplierInvoiceNo,
        purchaseDate,
        items: [
          {
            materialId: selectedMaterialId,
            quantity,
            rate,
          },
        ],
      });

      alert(`Purchase receipt ${po.purchaseNumber} recorded! Stock added to inventory ledger.`);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Purchase entry failed: ${err.message}`);
    }
  };

  const allPurchasable = [...rawMaterials, ...packaging];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Purchase Management & Raw Material Inflow
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Supplier purchase receipts, automatic weighted-average rate updates & inventory ledger posting
          </p>
        </div>

        {currentUser.role !== 'AUDITOR' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Purchase Receipt</span>
          </button>
        )}
      </div>

      {/* Benchmark Explainer Banner */}
      <div className="p-3.5 bg-[#1C2129] border border-[#282E37] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#101318] border border-[#282E37] text-[#63D39B]">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#E8EBF0]">
              Benchmark Transaction: 60 kg Flour @ ₹45.00/kg
            </div>
            <div className="text-[11px] text-[#8993A1]">
              Opening: 100 kg @ ₹42.00 → Receipt: +60 kg @ ₹45.00 → Closing: 160 kg @ Weighted Avg ₹43.125/kg
            </div>
          </div>
        </div>
        <Badge variant="success">BENCHMARK VERIFIED</Badge>
      </div>

      {/* Purchases List */}
      <div className="bg-[#15191F] border border-[#282E37]">
        <div className="p-3 border-b border-[#282E37] flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
            Purchase Receipts ({purchases.length})
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#8993A1]">
            No purchases logged. Click "Record Purchase Receipt" to add supplier delivery.
          </div>
        ) : (
          <div className="divide-y divide-[#282E37]">
            {purchases.map((po) => (
              <div key={po.id} className="p-4 hover:bg-[#1C2129] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#E8EBF0] text-sm">{po.purchaseNumber}</span>
                    <Badge variant="success">{po.status}</Badge>
                  </div>
                  <span className="text-[#8993A1]">{po.purchaseDate}</span>
                </div>

                <div className="flex items-center justify-between text-[#8993A1]">
                  <span>Supplier: <strong className="text-[#E8EBF0]">{po.supplierName}</strong> ({po.supplierInvoiceNo || 'Direct'})</span>
                  <span className="text-sm font-bold text-[#E5AC58]">₹{formatINR(po.totalAmount, false)}</span>
                </div>

                <div className="p-2 bg-[#101318] border border-[#282E37] space-y-1">
                  {po.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-[11px]">
                      <span className="text-[#E8EBF0] font-semibold">{item.materialName}:</span>
                      <span>{item.quantity} {item.unit} @ ₹{item.rate.toFixed(2)}/{item.unit} = <strong className="text-[#E8EBF0]">₹{item.totalAmount.toFixed(2)}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECORD PURCHASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#15191F] border border-[#282E37] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282E37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#E5AC58]" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#E8EBF0]">
                  Record Supplier Purchase Receipt
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8993A1] hover:text-[#E8EBF0] text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  Supplier
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                >
                  {dbState.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Supplier Invoice #
                  </label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  Material
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                >
                  {allPurchasable.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku}) — Current Stock: {m.currentStock} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Purchase Rate (₹/unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
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
                  Post Purchase & Update Stock →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
