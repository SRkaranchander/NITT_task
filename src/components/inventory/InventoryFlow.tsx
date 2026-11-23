// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Inventory Flow & Immutable Stock Ledger Module
// ==============================================================================

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Plus,
} from 'lucide-react';
import { useDatabase, useInventory, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR, formatQty } from '../../utils/math';
import * as XLSX from 'xlsx';

export const InventoryFlow: React.FC = () => {
  const dbState = useDatabase();
  const { allMaterials, rawMaterials, packaging, finishedGoods, ledger, reconcileStock, recordStockAdjustment } = useInventory();
  const { currentUser } = useCurrentUser();

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'RAW_MATERIAL' | 'PACKAGING' | 'FINISHED_GOODS'>('ALL');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'issues' | 'receipts' | 'dispatches'>('all');

  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjMaterialId, setAdjMaterialId] = useState('mat-flour');
  const [adjCount, setAdjCount] = useState(120);
  const [adjReason, setAdjReason] = useState('Physical audit cycle count');

  const filteredMaterials = useMemo(() => {
    if (activeCategory === 'ALL') return allMaterials;
    return allMaterials.filter((m) => m.category === activeCategory);
  }, [allMaterials, activeCategory]);

  const filteredLedger = useMemo(() => {
    return ledger.filter((entry) => {
      if (selectedMaterialFilter !== 'ALL' && entry.materialId !== selectedMaterialFilter) {
        return false;
      }
      if (activeLedgerTab === 'receipts' && !['OPENING_BALANCE', 'PURCHASE_RECEIPT', 'PRODUCTION_OUTPUT'].includes(entry.transactionType)) {
        return false;
      }
      if (activeLedgerTab === 'issues' && !['PRODUCTION_ISSUE', 'DAMAGE'].includes(entry.transactionType)) {
        return false;
      }
      if (activeLedgerTab === 'dispatches' && entry.transactionType !== 'SALES_DISPATCH') {
        return false;
      }
      if (ledgerSearchQuery.trim()) {
        const q = ledgerSearchQuery.toLowerCase();
        return (
          entry.referenceNumber.toLowerCase().includes(q) ||
          entry.materialName?.toLowerCase().includes(q) ||
          entry.transactionType.toLowerCase().includes(q) ||
          (entry.notes && entry.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [ledger, selectedMaterialFilter, activeLedgerTab, ledgerSearchQuery]);

  // Export Stock Ledger to Excel (.xlsx)
  const handleExportExcel = () => {
    const data = filteredLedger.map((e) => ({
      'Date & Time': new Date(e.createdAt).toLocaleString('en-IN'),
      'Reference Number': e.referenceNumber,
      'Material / Product': e.materialName,
      'Transaction Type': e.transactionType,
      'Qty In': e.quantityIn || 0,
      'Qty Out': e.quantityOut || 0,
      'Unit': e.unit,
      'Unit Cost (₹)': e.unitCost,
      'Running Balance': e.runningBalance,
      'Notes': e.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock_Ledger');
    XLSX.writeFile(wb, `NOIR_Stock_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Reference', 'Material', 'Type', 'In', 'Out', 'Unit', 'Unit Cost', 'Balance', 'Notes'];
    const rows = filteredLedger.map((e) => [
      `"${new Date(e.createdAt).toLocaleString('en-IN')}"`,
      `"${e.referenceNumber}"`,
      `"${e.materialName}"`,
      `"${e.transactionType}"`,
      e.quantityIn,
      e.quantityOut,
      `"${e.unit}"`,
      e.unitCost,
      e.runningBalance,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NOIR_Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#72A9E8]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Inventory Flow & Stock Ledger
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Immutable movement history, weighted-average rates & real-time balance reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role !== 'AUDITOR' && (
            <button
              onClick={() => setIsAdjModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#E5AC58] rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stock Adjustment</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0] rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2129] hover:bg-[#282E37] border border-[#363E4A] text-xs font-mono text-[#E5AC58] font-bold rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>XLSX Ledger Export</span>
          </button>
        </div>
      </div>

      {/* 1. Category Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveCategory('RAW_MATERIAL')}
          className={`p-4 bg-[#15191F] border cursor-pointer transition-colors ${
            activeCategory === 'RAW_MATERIAL' ? 'border-[#E5AC58]' : 'border-[#282E37] hover:border-[#363E4A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#8993A1] uppercase">Raw Materials</span>
            <Badge variant="default">{rawMaterials.length} Items</Badge>
          </div>
          <div className="text-xl font-bold font-mono text-[#E8EBF0]">
            {rawMaterials.reduce((s, m) => s + (m.unit === 'kg' ? m.currentStock : 0), 0)} kg
          </div>
          <div className="text-xs text-[#8993A1] mt-1">Flour, Oil, Salt & Spices</div>
        </div>

        <div
          onClick={() => setActiveCategory('PACKAGING')}
          className={`p-4 bg-[#15191F] border cursor-pointer transition-colors ${
            activeCategory === 'PACKAGING' ? 'border-[#E5AC58]' : 'border-[#282E37] hover:border-[#363E4A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#8993A1] uppercase">Packaging Items</span>
            <Badge variant="blue">{packaging.length} Items</Badge>
          </div>
          <div className="text-xl font-bold font-mono text-[#E8EBF0]">
            {packaging.reduce((s, m) => s + m.currentStock, 0)} pcs
          </div>
          <div className="text-xs text-[#8993A1] mt-1">Printed Pouches, Master Cartons</div>
        </div>

        <div
          onClick={() => setActiveCategory('FINISHED_GOODS')}
          className={`p-4 bg-[#15191F] border cursor-pointer transition-colors ${
            activeCategory === 'FINISHED_GOODS' ? 'border-[#E5AC58]' : 'border-[#282E37] hover:border-[#363E4A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#8993A1] uppercase">Finished Goods</span>
            <Badge variant="success">{finishedGoods.length} Products</Badge>
          </div>
          <div className="text-xl font-bold font-mono text-[#63D39B]">
            {finishedGoods.reduce((s, m) => s + m.currentStock, 0)} pkts
          </div>
          <div className="text-xs text-[#8993A1] mt-1">Packaged Murukku 200g</div>
        </div>
      </div>

      {/* 2. Materials Table with Reconciled Balances */}
      <div className="bg-[#15191F] border border-[#282E37]">
        <div className="p-3 border-b border-[#282E37] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
              Material Stock Master & Health
            </span>
            <span className="text-[10px] font-mono text-[#63D39B] bg-[#63D39B]/10 px-2 py-0.5 rounded border border-[#63D39B]/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Reconciled with Ledger
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono">
            {['ALL', 'RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOODS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#1C2129] text-[#E8EBF0] font-semibold border border-[#363E4A]'
                    : 'text-[#8993A1] hover:text-[#E8EBF0]'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
              <tr>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Opening Stock</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Avg Rate</th>
                <th className="py-2.5 px-3 text-right">Stock Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282E37]">
              {filteredMaterials.map((m) => {
                const isLow = m.currentStock <= m.reorderLevel;
                const totalVal = m.currentStock * m.averageCost;

                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMaterialFilter(m.id)}
                    className="hover:bg-[#1C2129] cursor-pointer"
                  >
                    <td className="py-3 px-3 font-semibold text-[#8993A1]">{m.sku}</td>
                    <td className="py-3 px-3 font-bold text-[#E8EBF0]">{m.name}</td>
                    <td className="py-3 px-3">
                      <Badge variant={m.category === 'FINISHED_GOODS' ? 'success' : m.category === 'PACKAGING' ? 'blue' : 'default'}>
                        {m.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right text-[#8993A1]">
                      {m.openingStock} {m.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#E8EBF0]">
                      <span className={isLow ? 'text-[#F06B6B]' : 'text-[#63D39B]'}>
                        {m.currentStock} {m.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-[#E5AC58]">
                      ₹{m.averageCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#E8EBF0]">
                      ₹{formatINR(totalVal, false)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isLow ? (
                        <Badge variant="warning">Reorder Req.</Badge>
                      ) : (
                        <Badge variant="success">Healthy</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Comprehensive Stock Movement Ledger Table */}
      <div className="bg-[#15191F] border border-[#282E37]">
        <div className="p-3 border-b border-[#282E37] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
              Immutable Stock Movement Ledger ({filteredLedger.length} Movements)
            </div>
            <div className="text-[11px] font-mono text-[#8993A1] mt-0.5">
              Auditor-traceable stock ledger entries with running balance
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#101318] border border-[#282E37] px-2 py-1 rounded">
              <Search className="w-3.5 h-3.5 text-[#8993A1] mr-1.5" />
              <input
                type="text"
                placeholder="Search reference or notes..."
                value={ledgerSearchQuery}
                onChange={(e) => setLedgerSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-[#E8EBF0] font-mono w-44 placeholder-[#5A6372]"
              />
            </div>

            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="bg-[#101318] border border-[#282E37] px-2.5 py-1 text-xs font-mono text-[#E8EBF0] outline-none rounded"
            >
              <option value="ALL">All Materials</option>
              {allMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Ref ID</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3 text-right">In</th>
                <th className="py-2.5 px-3 text-right">Out</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Running Balance</th>
                <th className="py-2.5 px-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282E37]">
              {filteredLedger.map((entry) => {
                const isIn = entry.quantityIn > 0;
                const isOut = entry.quantityOut > 0;

                return (
                  <tr key={entry.id} className="hover:bg-[#1C2129]">
                    <td className="py-2.5 px-3 text-[#8993A1]">
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#E8EBF0]">
                      {entry.referenceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">
                      {entry.materialName}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          entry.transactionType.includes('RECEIPT') || entry.transactionType.includes('OUTPUT')
                            ? 'success'
                            : entry.transactionType === 'DAMAGE'
                            ? 'critical'
                            : entry.transactionType === 'SALES_DISPATCH'
                            ? 'blue'
                            : 'default'
                        }
                      >
                        {entry.transactionType}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isIn ? (
                        <span className="text-[#63D39B] font-bold">
                          +{entry.quantityIn} {entry.unit}
                        </span>
                      ) : (
                        <span className="text-[#5A6372]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isOut ? (
                        <span className="text-[#F06B6B] font-bold">
                          -{entry.quantityOut} {entry.unit}
                        </span>
                      ) : (
                        <span className="text-[#5A6372]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#8993A1]">
                      ₹{entry.unitCost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0] bg-[#101318]/50">
                      {entry.runningBalance} {entry.unit}
                    </td>
                    <td className="py-2.5 px-3 text-[#8993A1] max-w-xs truncate">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* PHYSICAL STOCK COUNT ADJUSTMENT MODAL */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#15191F] border border-[#282E37] p-5 shadow-2xl">
            <h3 className="text-sm font-bold font-mono text-[#E8EBF0] uppercase tracking-wider mb-3">
              Physical Stock Cycle Count Adjustment
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#8993A1] mb-1">Select Material / Product:</label>
                <select
                  value={adjMaterialId}
                  onChange={(e) => {
                    setAdjMaterialId(e.target.value);
                    const m = allMaterials.find((mat) => mat.id === e.target.value);
                    if (m) setAdjCount(m.currentStock);
                  }}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0] outline-none"
                >
                  {allMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku}) — Ledger: {m.currentStock} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8993A1] mb-1">Actual Physical Counted Quantity:</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={adjCount}
                  onChange={(e) => setAdjCount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8993A1] mb-1">Audit Adjustment Reason:</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Month-end physical verification"
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#282E37] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-3 py-1.5 bg-[#101318] border border-[#282E37] text-[#8993A1] hover:text-[#E8EBF0]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      recordStockAdjustment({
                        materialId: adjMaterialId,
                        actualPhysicalCount: adjCount,
                        reason: adjReason,
                      });
                      setIsAdjModalOpen(false);
                      alert('Stock ledger adjusted and audit trail logged!');
                    } catch (err: any) {
                      alert(`Error: ${err.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] font-bold"
                >
                  Post Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
