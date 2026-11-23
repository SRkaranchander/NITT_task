// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Production Studio: BOM Master, Batch Creation & Cost Variance Engine
// ==============================================================================

import React, { useState } from 'react';
import {
  Factory,
  Plus,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  DollarSign,
  PackageCheck,
  ShieldAlert,
} from 'lucide-react';
import { useDatabase, useProduction, useInventory, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR, formatQty } from '../../utils/math';
import { calculateYieldVariance, calculateConsumptionVariance } from '../../utils/variance';
import { calculateProductionBatchCost } from '../../utils/costing';

export const ProductionStudio: React.FC = () => {
  const dbState = useDatabase();
  const { productionRuns, boms, recordProductionRun } = useProduction();
  const { allMaterials, rawMaterials, packaging, finishedGoods } = useInventory();
  const { currentUser } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'runs' | 'bom'>('runs');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for New Production Run
  const [selectedProductId, setSelectedProductId] = useState('mat-murukku');
  const [selectedBomId, setSelectedBomId] = useState('bom-murukku-std');
  const [batchIdInput, setBatchIdInput] = useState(`BATCH-${new Date().getFullYear()}-${String(productionRuns.length + 1).padStart(3, '0')}`);
  const [plannedOutput, setPlannedOutput] = useState(200);
  const [actualGoodOutput, setActualGoodOutput] = useState(188);
  const [damagedPackagingCount, setDamagedPackagingCount] = useState(6);
  const [labourCost, setLabourCost] = useState(1200);
  const [powerGasCost, setPowerGasCost] = useState(600);
  const [notes, setNotes] = useState('Benchmark Trial Run: Batch #1');

  // Actual Consumptions input state
  const [actualConsumptions, setActualConsumptions] = useState<{ [materialId: string]: number }>({
    'mat-flour': 40,
    'mat-oil': 10.5,
    'mat-spice': 1.2,
    'mat-pouch': 188,
    'mat-carton': 9,
  });

  const selectedBom = boms.find((b) => b.id === selectedBomId) || boms[0];
  const selectedProduct = finishedGoods.find((f) => f.id === selectedProductId) || finishedGoods[0];

  const handleConsumptionChange = (materialId: string, val: number) => {
    setActualConsumptions((prev) => ({
      ...prev,
      [materialId]: val,
    }));
  };

  const handleLaunchRun = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const consumptionsPayload = (selectedBom?.items || []).map((bi) => {
        const actualQty = actualConsumptions[bi.materialId] ?? bi.quantity;
        const damagedQty = bi.materialId === 'mat-pouch' ? damagedPackagingCount : 0;
        return {
          materialId: bi.materialId,
          actualQuantity: actualQty,
          damagedQuantity: damagedQty,
        };
      });

      recordProductionRun({
        batchId: batchIdInput,
        productId: selectedProductId,
        bomId: selectedBom.id,
        productionDate: new Date().toISOString().split('T')[0],
        plannedOutput,
        actualGoodOutput,
        rejectedOutput: 0,
        damagedPackaging: damagedPackagingCount,
        consumptions: consumptionsPayload,
        labourCost,
        powerGasCost,
        notes,
      });

      setIsModalOpen(false);
      alert(`Production batch ${batchIdInput} completed and stock ledger posted atomically!`);
    } catch (err: any) {
      alert(`Error recording production run: ${err.message}`);
    }
  };

  const selectedRun = productionRuns.find((r) => r.id === selectedRunId) || productionRuns[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Production Studio
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            BOM recipe management, batch execution, actual consumption & unit cost variance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#15191F] border border-[#282E37] rounded p-0.5 flex text-xs font-mono">
            <button
              onClick={() => setActiveTab('runs')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'runs'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-semibold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              Production Runs ({productionRuns.length})
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'bom'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-semibold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              Recipe Masters (BOM)
            </button>
          </div>

          {currentUser.role !== 'AUDITOR' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Batch Run</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'runs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batches Table List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#15191F] border border-[#282E37]">
              <div className="p-3 border-b border-[#282E37] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Recorded Production Batches
                </span>
                <span className="text-[11px] font-mono text-[#8993A1]">
                  Sorted by latest
                </span>
              </div>

              {productionRuns.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[#8993A1]">
                  No production runs logged. Click "Launch Batch Run" to start.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
                      <tr>
                        <th className="py-2.5 px-3">Batch ID</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Yield (Actual/Plan)</th>
                        <th className="py-2.5 px-3 text-center">Variance %</th>
                        <th className="py-2.5 px-3 text-right">Cost / Pkt</th>
                        <th className="py-2.5 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282E37]">
                      {productionRuns.map((run) => {
                        const isSelected = selectedRun?.id === run.id;
                        const hasYieldDev = Math.abs(run.yieldVariancePercent) > 3.0;

                        return (
                          <tr
                            key={run.id}
                            onClick={() => setSelectedRunId(run.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#1C2129] border-l-2 border-l-[#E5AC58]'
                                : 'hover:bg-[#1C2129]/60'
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-[#E8EBF0]">
                              {run.batchId}
                            </td>
                            <td className="py-3 px-3 text-[#E8EBF0]">
                              {run.productName}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-[#63D39B] font-bold">
                                {run.actualGoodOutput}
                              </span>{' '}
                              / {run.plannedOutput}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] border ${
                                  hasYieldDev
                                    ? 'bg-[#F0B44D]/10 text-[#F0B44D] border-[#F0B44D]/30'
                                    : 'bg-[#63D39B]/10 text-[#63D39B] border-[#63D39B]/30'
                                }`}
                              >
                                {run.yieldVariancePercent > 0
                                  ? `+${run.yieldVariancePercent}%`
                                  : `${run.yieldVariancePercent}%`}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-[#E5AC58] font-bold">
                              ₹{run.costPerPacket.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right text-[#E8EBF0]">
                              ₹{formatINR(run.totalRunCost, false)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Selected Batch Detailed Inspection Drawer (1 Col) */}
          <div className="space-y-4">
            {selectedRun ? (
              <div className="bg-[#15191F] border border-[#282E37] p-4 space-y-4">
                <div className="border-b border-[#282E37] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-[#E8EBF0]">
                      {selectedRun.batchId}
                    </span>
                    <Badge variant="success">{selectedRun.status}</Badge>
                  </div>
                  <div className="text-xs text-[#8993A1] mt-1">
                    {selectedRun.productName} • Recipe v{selectedRun.bomVersion}
                  </div>
                  <div className="text-[11px] font-mono text-[#8993A1] mt-0.5">
                    Supervisor: {selectedRun.supervisorName} | Date: {selectedRun.productionDate}
                  </div>
                </div>

                {/* Batch Costing Breakdown */}
                <div className="p-3 bg-[#101318] border border-[#282E37] space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8993A1]">
                    Cost Intelligence Analysis
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8993A1]">Raw Materials:</span>
                    <span className="text-[#E8EBF0]">₹{formatINR(selectedRun.materialCost, false)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8993A1]">Packaging Materials:</span>
                    <span className="text-[#E8EBF0]">₹{formatINR(selectedRun.packagingCost, false)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8993A1]">Direct Labour:</span>
                    <span className="text-[#E8EBF0]">₹{formatINR(selectedRun.labourCost, false)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8993A1]">Power & Gas Overheads:</span>
                    <span className="text-[#E8EBF0]">₹{formatINR(selectedRun.powerGasCost, false)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#282E37] flex justify-between text-xs font-mono font-bold">
                    <span className="text-[#E8EBF0]">Total Run Cost:</span>
                    <span className="text-[#E5AC58]">₹{formatINR(selectedRun.totalRunCost, false)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8993A1]">Good Packets Produced:</span>
                    <span className="text-[#63D39B] font-bold">{selectedRun.actualGoodOutput} pkts</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono font-bold pt-1 border-t border-[#282E37]">
                    <span className="text-[#E5AC58]">Cost Per Good Packet:</span>
                    <span className="text-[#E5AC58]">₹{selectedRun.costPerPacket.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-[#63D39B]">
                    <span>Selling Price (Pre-GST):</span>
                    <span>₹50.00</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-[#63D39B] font-bold">
                    <span>Gross Margin / Pkt:</span>
                    <span>₹{(50 - selectedRun.costPerPacket).toFixed(2)}</span>
                  </div>
                </div>

                {/* Ingredient Consumptions Table */}
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8993A1] mb-2">
                    Ingredient Consumptions & Tolerances
                  </div>
                  <div className="space-y-1.5">
                    {selectedRun.consumptions.map((c) => {
                      const hasVar = Math.abs(c.variancePercent) > 3.0;
                      return (
                        <div
                          key={c.id}
                          className="p-2 bg-[#101318] border border-[#282E37] text-xs font-mono flex items-center justify-between"
                        >
                          <div>
                            <div className="text-[#E8EBF0] font-medium">{c.materialName}</div>
                            <div className="text-[10px] text-[#8993A1]">
                              Plan: {c.plannedQuantity} {c.unit} → Actual: {c.actualQuantity} {c.unit}
                              {c.damagedQuantity > 0 && ` (+${c.damagedQuantity} damaged)`}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                hasVar
                                  ? 'bg-[#F0B44D]/10 text-[#F0B44D] border-[#F0B44D]/30'
                                  : 'bg-[#63D39B]/10 text-[#63D39B] border-[#63D39B]/30'
                              }`}
                            >
                              {c.variancePercent > 0 ? `+${c.variancePercent}%` : `${c.variancePercent}%`}
                            </span>
                            <div className="text-[10px] text-[#8993A1] mt-0.5">
                              ₹{formatINR(c.totalCost, false)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* BOM MASTER TAB */
        <div className="space-y-4">
          <div className="bg-[#15191F] border border-[#282E37] p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-[#E8EBF0]">
                  Standard Murukku 200g Master Formula (v1.0)
                </h2>
                <p className="text-xs text-[#8993A1]">
                  Base batch: 1 batch yields 200 finished packaged packets (200g each)
                </p>
              </div>
              <Badge variant="success">ACTIVE STANDARD</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3 text-right">Formula Qty (1 Batch)</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Standard Rate</th>
                    <th className="py-2.5 px-3 text-right">Cost Component</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282E37]">
                  {selectedBom.items.map((bi) => {
                    const mat = allMaterials.find((m) => m.id === bi.materialId);
                    const rate = mat?.averageCost || 0;
                    const componentTotal = bi.quantity * rate;

                    return (
                      <tr key={bi.id} className="hover:bg-[#1C2129]">
                        <td className="py-2.5 px-3">
                          <Badge variant={bi.itemType === 'INGREDIENT' ? 'default' : 'blue'}>
                            {bi.itemType}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">
                          {bi.materialName || mat?.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">
                          {bi.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-[#8993A1]">{bi.unit}</td>
                        <td className="py-2.5 px-3 text-right text-[#8993A1]">
                          ₹{rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#E5AC58] font-bold">
                          ₹{componentTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH NEW BATCH RUN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#15191F] border border-[#282E37] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#282E37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-[#E5AC58]" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#E8EBF0]">
                  Launch Batch Production Run
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8993A1] hover:text-[#E8EBF0] text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchRun} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Batch ID
                  </label>
                  <input
                    type="text"
                    value={batchIdInput}
                    onChange={(e) => setBatchIdInput(e.target.value)}
                    required
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none focus:border-[#E5AC58]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Finished Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none focus:border-[#E5AC58]"
                  >
                    {finishedGoods.map((fg) => (
                      <option key={fg.id} value={fg.id}>
                        {fg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipe Consumptions Input */}
              <div className="p-3 bg-[#101318] border border-[#282E37] space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase text-[#E5AC58]">
                  Actual Raw Material & Packaging Issued for Batch
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {selectedBom.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 bg-[#15191F] border border-[#282E37]">
                      <span className="text-[#8993A1] truncate">{item.materialName}:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={actualConsumptions[item.materialId] ?? item.quantity}
                          onChange={(e) => handleConsumptionChange(item.materialId, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-[#101318] border border-[#282E37] px-2 py-0.5 text-right font-mono text-[#E8EBF0] outline-none"
                        />
                        <span className="text-[10px] text-[#8993A1] w-6">{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output & Wastage */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Expected Yield (pkts)
                  </label>
                  <input
                    type="number"
                    value={plannedOutput}
                    onChange={(e) => setPlannedOutput(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#63D39B] mb-1">
                    Actual Good Output (pkts)
                  </label>
                  <input
                    type="number"
                    value={actualGoodOutput}
                    onChange={(e) => setActualGoodOutput(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#63D39B]/50 px-3 py-1.5 text-xs font-mono text-[#63D39B] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#F0B44D] mb-1">
                    Damaged Packaging (pcs)
                  </label>
                  <input
                    type="number"
                    value={damagedPackagingCount}
                    onChange={(e) => setDamagedPackagingCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#F0B44D] outline-none"
                  />
                </div>
              </div>

              {/* Overheads */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Direct Labour (₹)
                  </label>
                  <input
                    type="number"
                    value={labourCost}
                    onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                    Power & Gas (₹)
                  </label>
                  <input
                    type="number"
                    value={powerGasCost}
                    onChange={(e) => setPowerGasCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#282E37] flex items-center justify-end gap-2">
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
                  Post Batch & Update Inventory →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
