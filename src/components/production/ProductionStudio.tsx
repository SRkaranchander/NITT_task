// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Production Studio: Re-engineered with Multi-Tab Architecture & Deep Batch Drawer
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
  ChevronRight,
  X,
  Layers,
  Scale,
  Calendar,
  User,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useDatabase, useProduction, useInventory, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { KpiCard } from '../common/KpiCard';
import { formatINR, formatQty } from '../../utils/math';
import { calculateYieldVariance, calculateConsumptionVariance } from '../../utils/variance';
import { calculateProductionBatchCost } from '../../utils/costing';
import { ProductionRun } from '../../types';

export const ProductionStudio: React.FC = () => {
  const dbState = useDatabase();
  const { productionRuns, boms, recordProductionRun } = useProduction();
  const { allMaterials, rawMaterials, packaging, finishedGoods } = useInventory();
  const { currentUser } = useCurrentUser();

  // 4 Main Tabs: 'overview' | 'runs' | 'bom' | 'details'
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'bom'>('overview');
  const [selectedBatch, setSelectedBatch] = useState<ProductionRun | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Production Run Form
  const [selectedProductId, setSelectedProductId] = useState('mat-murukku');
  const [selectedBomId, setSelectedBomId] = useState('bom-murukku-std');
  const [batchIdInput, setBatchIdInput] = useState(
    `BATCH-${new Date().getFullYear()}-${String(productionRuns.length + 1).padStart(3, '0')}`
  );
  const [plannedOutput, setPlannedOutput] = useState(200);
  const [actualGoodOutput, setActualGoodOutput] = useState(188);
  const [damagedPackagingCount, setDamagedPackagingCount] = useState(6);
  const [labourCost, setLabourCost] = useState(1200);
  const [powerGasCost, setPowerGasCost] = useState(600);
  const [notes, setNotes] = useState('Standard production batch run');

  // Consumptions State
  const [actualConsumptions, setActualConsumptions] = useState<{ [materialId: string]: number }>({
    'mat-flour': 40,
    'mat-oil': 10.5,
    'mat-spice': 1.2,
    'mat-pouch': 188,
    'mat-carton': 9,
  });

  const selectedBom = boms.find((b) => b.id === selectedBomId) || boms[0];
  const selectedProduct = finishedGoods.find((f) => f.id === selectedProductId) || finishedGoods[0];

  // Overview metrics
  const totalGoodPackets = productionRuns.reduce((sum, r) => sum + r.actualGoodOutput, 0);
  const totalPlannedPackets = productionRuns.reduce((sum, r) => sum + r.plannedOutput, 0);
  const avgYieldEfficiency = totalPlannedPackets > 0
    ? ((totalGoodPackets / totalPlannedPackets) * 100).toFixed(1)
    : '100.0';
  const avgCostPerPacket = productionRuns.length > 0
    ? (productionRuns.reduce((sum, r) => sum + r.costPerPacket, 0) / productionRuns.length).toFixed(2)
    : '31.14';

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

      const newRun = recordProductionRun({
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
      setSelectedBatch(newRun);
      alert(`Production batch ${batchIdInput} completed and stock ledger posted atomically!`);
    } catch (err: any) {
      alert(`Error recording production run: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. PAGE HEADER & PRIMARY CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282E37] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Factory className="w-5 h-5 text-[#63D39B]" />
            <h1 className="text-xl font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Production Studio
            </h1>
          </div>
          <p className="text-xs text-[#8993A1]">
            Recipe formulation, batch execution, physical consumption tracking & unit cost calculation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Tabs */}
          <div className="flex items-center bg-[#15191F] border border-[#282E37] rounded p-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-bold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'runs'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-bold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              Production Runs ({productionRuns.length})
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'bom'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-bold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              Recipe Masters (BOM)
            </button>
          </div>

          {/* Primary Action Button */}
          {currentUser.role !== 'AUDITOR' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Start New Production</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB 1: PRODUCTION OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Production KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Batches Executed"
              value={productionRuns.length}
              subtitle="Completed production runs"
              icon={Factory}
              highlightColor="green"
            />
            <KpiCard
              title="Total Good Output"
              value={`${totalGoodPackets} pkts`}
              subtitle="Ready for dispatch"
              icon={PackageCheck}
              highlightColor="default"
            />
            <KpiCard
              title="Average Yield Efficiency"
              value={`${avgYieldEfficiency}%`}
              subtitle="Compared to recipe baseline"
              icon={TrendingDown}
              highlightColor={parseFloat(avgYieldEfficiency) < 97 ? 'amber' : 'green'}
            />
            <KpiCard
              title="Average Unit Cost"
              value={`₹${avgCostPerPacket}`}
              subtitle="Per 200g finished packet"
              icon={DollarSign}
              highlightColor="amber"
            />
          </div>

          {/* Active Alerts Banner if Deviations Exist */}
          {productionRuns.some((r) => Math.abs(r.yieldVariancePercent) > 3.0) && (
            <div className="p-4 bg-[#1C2129] border-l-4 border-l-[#F0B44D] border border-[#282E37] flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F0B44D] shrink-0" />
                <div>
                  <div className="font-bold text-[#E8EBF0]">
                    Recipe Tolerance Warning Flagged on Batch BATCH-2026-001
                  </div>
                  <div className="text-[#8993A1] mt-0.5">
                    Yield variance (-6.0%) and refined oil absorption (+5.0%) exceeded the standard 3.0% tolerance limit.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const b = productionRuns[0];
                  if (b) setSelectedBatch(b);
                }}
                className="px-3 py-1.5 bg-[#15191F] hover:bg-[#282E37] border border-[#282E37] text-[#E5AC58] font-bold rounded shrink-0 transition-colors"
              >
                Inspect Batch →
              </button>
            </div>
          )}

          {/* Recent Batches List & Recipe Snapshot Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Batches Table (2 Cols) */}
            <div className="lg:col-span-2 bg-[#15191F] border border-[#282E37] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#282E37] pb-3">
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                    Recent Production Batches
                  </h2>
                  <p className="text-[11px] text-[#8993A1] mt-0.5">
                    Click any batch to inspect detailed consumption, damage, and costing
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('runs')}
                  className="text-xs font-mono text-[#E5AC58] hover:underline"
                >
                  View Full History →
                </button>
              </div>

              {productionRuns.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[#8993A1] bg-[#101318] border border-dashed border-[#282E37]">
                  No production runs recorded. Click "Start New Production" to begin your first batch.
                </div>
              ) : (
                <div className="divide-y divide-[#282E37] border border-[#282E37]">
                  {productionRuns.slice(0, 4).map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setSelectedBatch(run)}
                      className="p-3.5 bg-[#101318] hover:bg-[#1C2129] cursor-pointer transition-colors flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E8EBF0] text-sm">{run.batchId}</span>
                          <Badge variant="success">Completed</Badge>
                          {Math.abs(run.yieldVariancePercent) > 3.0 && (
                            <Badge variant="warning">
                              Yield Var: {run.yieldVariancePercent}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-[#8993A1] mt-1 text-[11px]">
                          {run.productName} • Recipe v{run.bomVersion} • Date: {run.productionDate}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[#63D39B] font-bold">
                          {run.actualGoodOutput} / {run.plannedOutput} pkts
                        </div>
                        <div className="text-[#E5AC58] text-[11px] font-bold mt-0.5">
                          ₹{run.costPerPacket.toFixed(2)} / pkt
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Standard Recipe Card Snapshot (1 Col) */}
            <div className="bg-[#15191F] border border-[#282E37] p-5 space-y-4">
              <div className="border-b border-[#282E37] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                    Standard Formula Reference
                  </h3>
                  <div className="text-[11px] text-[#8993A1] mt-0.5">
                    Murukku 200g (1 Batch = 200 Packets)
                  </div>
                </div>
                <Badge variant="blue">Recipe v1.0</Badge>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-[#101318] border border-[#282E37] flex items-center justify-between">
                  <span className="text-[#8993A1]">Rice Flour:</span>
                  <span className="text-[#E8EBF0] font-bold">40.0 kg</span>
                </div>
                <div className="p-2.5 bg-[#101318] border border-[#282E37] flex items-center justify-between">
                  <span className="text-[#8993A1]">Cooking Oil:</span>
                  <span className="text-[#E8EBF0] font-bold">10.0 L</span>
                </div>
                <div className="p-2.5 bg-[#101318] border border-[#282E37] flex items-center justify-between">
                  <span className="text-[#8993A1]">Salt & Spice Mix:</span>
                  <span className="text-[#E8EBF0] font-bold">1.2 kg</span>
                </div>
                <div className="p-2.5 bg-[#101318] border border-[#282E37] flex items-center justify-between">
                  <span className="text-[#8993A1]">Printed Pouches:</span>
                  <span className="text-[#E8EBF0] font-bold">200 pcs</span>
                </div>
                <div className="p-2.5 bg-[#101318] border border-[#282E37] flex items-center justify-between">
                  <span className="text-[#8993A1]">Master Cartons:</span>
                  <span className="text-[#E8EBF0] font-bold">10 pcs (20 pkts/ctn)</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('bom')}
                className="w-full py-2 bg-[#1C2129] hover:bg-[#282E37] border border-[#363E4A] text-xs font-mono text-[#E5AC58] font-bold rounded transition-colors text-center"
              >
                Inspect Recipe Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: FULL PRODUCTION RUNS TABLE */}
      {activeTab === 'runs' && (
        <div className="bg-[#15191F] border border-[#282E37] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                All Production Runs ({productionRuns.length})
              </h2>
              <p className="text-[11px] text-[#8993A1] mt-0.5">
                Complete historical record of batch formulas, outputs, costs, and tolerances
              </p>
            </div>
          </div>

          {productionRuns.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#8993A1] bg-[#101318] border border-dashed border-[#282E37]">
              No production runs logged. Click "Start New Production" to launch a run.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
                  <tr>
                    <th className="py-3 px-3">Batch ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3 text-right">Expected Output</th>
                    <th className="py-3 px-3 text-right">Actual Good Yield</th>
                    <th className="py-3 px-3 text-center">Yield Variance %</th>
                    <th className="py-3 px-3 text-right">Cost Per Packet</th>
                    <th className="py-3 px-3 text-right">Total Batch Cost</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282E37]">
                  {productionRuns.map((run) => {
                    const hasYieldDev = Math.abs(run.yieldVariancePercent) > 3.0;

                    return (
                      <tr
                        key={run.id}
                        onClick={() => setSelectedBatch(run)}
                        className="hover:bg-[#1C2129] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-[#E8EBF0]">{run.batchId}</td>
                        <td className="py-3 px-3 text-[#8993A1]">{run.productionDate}</td>
                        <td className="py-3 px-3 font-semibold text-[#E8EBF0]">{run.productName}</td>
                        <td className="py-3 px-3 text-right text-[#8993A1]">{run.plannedOutput} pkts</td>
                        <td className="py-3 px-3 text-right text-[#63D39B] font-bold">{run.actualGoodOutput} pkts</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] border ${
                              hasYieldDev
                                ? 'bg-[#F0B44D]/15 text-[#F0B44D] border-[#F0B44D]/30 font-bold'
                                : 'bg-[#63D39B]/15 text-[#63D39B] border-[#63D39B]/30'
                            }`}
                          >
                            {run.yieldVariancePercent > 0 ? `+${run.yieldVariancePercent}%` : `${run.yieldVariancePercent}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-[#E5AC58] font-bold">
                          ₹{run.costPerPacket.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#E8EBF0]">
                          ₹{formatINR(run.totalRunCost, false)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBatch(run);
                            }}
                            className="px-2.5 py-1 bg-[#101318] hover:bg-[#282E37] border border-[#282E37] text-[#E5AC58] text-[11px] font-bold rounded"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: RECIPE / BOM MANAGEMENT */}
      {activeTab === 'bom' && (
        <div className="space-y-6">
          <div className="bg-[#15191F] border border-[#282E37] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-3">
              <div>
                <h2 className="text-sm font-bold font-mono text-[#E8EBF0]">
                  Standard Murukku 200g Recipe Formulation (v1.0)
                </h2>
                <p className="text-xs text-[#8993A1] mt-0.5">
                  Standard batch size: 1 batch produces 200 packets (200g each)
                </p>
              </div>
              <Badge variant="success">ACTIVE STANDARD FORMULA</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
                  <tr>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3 text-right">Recipe Quantity</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Weighted Avg Cost</th>
                    <th className="py-2.5 px-3 text-right">Standard Component Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282E37]">
                  {selectedBom.items.map((bi) => {
                    const mat = allMaterials.find((m) => m.id === bi.materialId);
                    const rate = mat?.averageCost || 0;
                    const subtotal = bi.quantity * rate;

                    return (
                      <tr key={bi.id} className="hover:bg-[#1C2129]">
                        <td className="py-3 px-3">
                          <Badge variant={bi.itemType === 'INGREDIENT' ? 'default' : 'blue'}>
                            {bi.itemType}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#E8EBF0]">
                          {bi.materialName || mat?.name}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#E8EBF0]">
                          {bi.quantity}
                        </td>
                        <td className="py-3 px-3 text-[#8993A1]">{bi.unit}</td>
                        <td className="py-3 px-3 text-right text-[#8993A1]">
                          ₹{rate.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#E5AC58]">
                          ₹{subtotal.toFixed(2)}
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

      {/* 5. DEEP BATCH DETAILS SLIDING DRAWER / MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#15191F] border-l border-[#282E37] h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 border-b border-[#282E37] px-6 flex items-center justify-between bg-[#101318] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold font-mono text-[#E8EBF0]">
                  Batch Details: {selectedBatch.batchId}
                </span>
                <Badge variant="success">Completed</Badge>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-[#8993A1] hover:text-[#E8EBF0] p-1.5 rounded hover:bg-[#1C2129]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Sections */}
            <div className="p-6 space-y-6">
              {/* Section A: Batch Overview Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-[#101318] border border-[#282E37] text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Product</div>
                  <div className="font-bold text-[#E8EBF0] mt-0.5">{selectedBatch.productName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Production Date</div>
                  <div className="font-bold text-[#E8EBF0] mt-0.5">{selectedBatch.productionDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Supervisor</div>
                  <div className="font-bold text-[#E8EBF0] mt-0.5">{selectedBatch.supervisorName || 'Floor Manager'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Recipe Formula</div>
                  <div className="font-bold text-[#E5AC58] mt-0.5">Version {selectedBatch.bomVersion}.0</div>
                </div>
              </div>

              {/* Section B: Planned vs Actual Production Yield */}
              <div className="p-4 bg-[#101318] border border-[#282E37] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E8EBF0] uppercase tracking-wider text-[11px]">
                    Production Yield & Tolerance Analysis
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${
                    Math.abs(selectedBatch.yieldVariancePercent) > 3.0
                      ? 'bg-[#F0B44D]/15 text-[#F0B44D] border-[#F0B44D]/30 font-bold'
                      : 'bg-[#63D39B]/15 text-[#63D39B] border-[#63D39B]/30'
                  }`}>
                    Variance: {selectedBatch.yieldVariancePercent}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-[#15191F] border border-[#282E37]">
                    <div className="text-[10px] text-[#8993A1] uppercase">Expected Yield</div>
                    <div className="text-sm font-bold text-[#E8EBF0] mt-1">{selectedBatch.plannedOutput} pkts</div>
                  </div>
                  <div className="p-2.5 bg-[#15191F] border border-[#282E37]">
                    <div className="text-[10px] text-[#8993A1] uppercase">Actual Good Output</div>
                    <div className="text-sm font-bold text-[#63D39B] mt-1">{selectedBatch.actualGoodOutput} pkts</div>
                  </div>
                  <div className="p-2.5 bg-[#15191F] border border-[#282E37]">
                    <div className="text-[10px] text-[#8993A1] uppercase">Damaged Packaging</div>
                    <div className="text-sm font-bold text-[#F0B44D] mt-1">{selectedBatch.damagedPackaging} pcs</div>
                  </div>
                </div>
              </div>

              {/* Section C: Actual Consumptions & Recipe Variances */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Raw Material Consumptions
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {selectedBatch.consumptions.map((c) => {
                    const hasVar = Math.abs(c.variancePercent) > 3.0;

                    return (
                      <div
                        key={c.id}
                        className="p-3 bg-[#101318] border border-[#282E37] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-[#E8EBF0]">{c.materialName}</div>
                          <div className="text-[11px] text-[#8993A1] mt-0.5">
                            Planned: {c.plannedQuantity} {c.unit} → Actual Drawn: <strong className="text-[#E8EBF0]">{c.actualQuantity} {c.unit}</strong>
                            {c.damagedQuantity > 0 && ` (+${c.damagedQuantity} damaged)`}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                            hasVar
                              ? 'bg-[#F0B44D]/15 text-[#F0B44D] border-[#F0B44D]/30'
                              : 'bg-[#63D39B]/15 text-[#63D39B] border-[#63D39B]/30'
                          }`}>
                            {c.variancePercent > 0 ? `+${c.variancePercent}%` : `${c.variancePercent}%`}
                          </span>
                          <div className="text-[11px] text-[#8993A1] mt-1">
                            ₹{formatINR(c.totalCost, false)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section D: Cost Intelligence & Margin Walkthrough */}
              <div className="p-4 bg-[#101318] border border-[#282E37] space-y-2.5 font-mono text-xs">
                <div className="font-bold text-[#E8EBF0] uppercase tracking-wider text-[11px] border-b border-[#282E37] pb-2">
                  Batch Cost Accounting Breakdown
                </div>
                <div className="flex justify-between text-[#8993A1]">
                  <span>Raw Materials (Flour, Oil, Spices):</span>
                  <span className="text-[#E8EBF0]">₹{formatINR(selectedBatch.materialCost, false)}</span>
                </div>
                <div className="flex justify-between text-[#8993A1]">
                  <span>Packaging Materials (Pouches, Cartons):</span>
                  <span className="text-[#E8EBF0]">₹{formatINR(selectedBatch.packagingCost, false)}</span>
                </div>
                <div className="flex justify-between text-[#8993A1]">
                  <span>Direct Factory Labour:</span>
                  <span className="text-[#E8EBF0]">₹{formatINR(selectedBatch.labourCost, false)}</span>
                </div>
                <div className="flex justify-between text-[#8993A1]">
                  <span>Gas & Power Overheads:</span>
                  <span className="text-[#E8EBF0]">₹{formatINR(selectedBatch.powerGasCost, false)}</span>
                </div>
                <div className="pt-2 border-t border-[#282E37] flex justify-between font-bold text-sm">
                  <span className="text-[#E8EBF0]">Total Production Cost:</span>
                  <span className="text-[#E5AC58]">₹{formatINR(selectedBatch.totalRunCost, false)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#282E37]">
                  <span className="text-[#E5AC58]">Cost Per Good Packet:</span>
                  <span className="text-[#E5AC58]">₹{selectedBatch.costPerPacket.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#63D39B]">
                  <span>Standard Selling Price:</span>
                  <span>₹50.00</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#63D39B]">
                  <span>Realized Gross Margin / Packet:</span>
                  <span>₹{(50 - selectedBatch.costPerPacket).toFixed(2)} (37.7%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. START NEW PRODUCTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#15191F] border border-[#282E37] p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between border-b border-[#282E37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-[#E5AC58]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Start Batch Production Run
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8993A1] hover:text-[#E8EBF0]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchRun} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8993A1] mb-1">Batch ID</label>
                  <input
                    type="text"
                    value={batchIdInput}
                    onChange={(e) => setBatchIdInput(e.target.value)}
                    required
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-[#E8EBF0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8993A1] mb-1">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-[#E8EBF0] outline-none"
                  >
                    {finishedGoods.map((fg) => (
                      <option key={fg.id} value={fg.id}>
                        {fg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipe Consumptions */}
              <div className="p-3 bg-[#101318] border border-[#282E37] space-y-2">
                <div className="text-[11px] font-bold uppercase text-[#E5AC58]">
                  Actual Ingredients Issued
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBom.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-[#15191F] border border-[#282E37]">
                      <span className="text-[#8993A1] truncate">{item.materialName}:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={actualConsumptions[item.materialId] ?? item.quantity}
                          onChange={(e) => handleConsumptionChange(item.materialId, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-[#101318] border border-[#282E37] px-1.5 py-0.5 text-right font-bold text-[#E8EBF0]"
                        />
                        <span className="text-[10px] text-[#8993A1]">{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8993A1] mb-1">Expected (pkts)</label>
                  <input
                    type="number"
                    value={plannedOutput}
                    onChange={(e) => setPlannedOutput(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0]"
                  />
                </div>
                <div>
                  <label className="block text-[#63D39B] mb-1 font-bold">Good Output (pkts)</label>
                  <input
                    type="number"
                    value={actualGoodOutput}
                    onChange={(e) => setActualGoodOutput(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#63D39B]/50 px-3 py-1.5 text-[#63D39B] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#F0B44D] mb-1">Damaged Pouches</label>
                  <input
                    type="number"
                    value={damagedPackagingCount}
                    onChange={(e) => setDamagedPackagingCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#F0B44D]"
                  />
                </div>
              </div>

              {/* Overheads */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8993A1] mb-1">Direct Labour (₹)</label>
                  <input
                    type="number"
                    value={labourCost}
                    onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0]"
                  />
                </div>
                <div>
                  <label className="block text-[#8993A1] mb-1">Power & Fuel (₹)</label>
                  <input
                    type="number"
                    value={powerGasCost}
                    onChange={(e) => setPowerGasCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#282E37] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#101318] border border-[#282E37] text-[#8993A1] hover:text-[#E8EBF0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] font-bold"
                >
                  Post Batch to Ledger →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
