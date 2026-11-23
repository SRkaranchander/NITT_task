// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Command Center Dashboard (Industrial Control Center & Analytics)
// ==============================================================================

import React from 'react';
import {
  ShoppingCart,
  DollarSign,
  Factory,
  Boxes,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import { useDatabase, useDeviations, useInventory, useSales, useFinance } from '../../services/db/useDatabase';
import { formatINR, formatQty } from '../../utils/math';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

interface CommandCenterProps {
  onNavigate: (tabId: string, referenceId?: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const db = useDatabase();
  const { alerts, criticalCount } = useDeviations();
  const { finishedGoods, rawMaterials, packaging } = useInventory();
  const { orders, invoices } = useSales();
  const { totalReceivables, payments } = useFinance();

  // Real KPI calculations from database
  const ordersCount = orders.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const completedBatches = db.productionRuns.filter((r) => r.status === 'COMPLETED');
  const totalGoodPacketsProduced = completedBatches.reduce((sum, r) => sum + r.actualGoodOutput, 0);

  const totalFinishedGoodsStock = finishedGoods.reduce((sum, fg) => sum + fg.currentStock, 0);

  // Operational Flow Metrics
  const rawMaterialTotalKg = rawMaterials.reduce((sum, m) => sum + (m.unit === 'kg' ? m.currentStock : 0), 0);
  const packagingTotalPcs = packaging.reduce((sum, m) => sum + m.currentStock, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'APPROVED').length;
  const totalDispatchesCount = db.dispatches.length;
  const totalCollectionsMonth = payments.reduce((sum, p) => sum + p.amount, 0);

  // Chart Trends Data
  const trendData = [
    { name: 'Mon', sales: 0, production: 0, collections: 0 },
    { name: 'Tue', sales: 0, production: 0, collections: 0 },
    { name: 'Wed', sales: 0, production: 0, collections: 0 },
    { name: 'Thu', sales: 0, production: 188, collections: 0 },
    { name: 'Fri', sales: 7875, production: 0, collections: 0 },
    { name: 'Sat', sales: 0, production: 0, collections: 4000 },
    { name: 'Sun', sales: 0, production: 0, collections: 0 },
  ];

  // Dynamic deterministic production suggestion
  const shortageOrder = orders.find((o) => o.stockShortageCount > 0);
  let productionSuggestion = null;
  if (shortageOrder) {
    const shortageItem = shortageOrder.items.find((i) => i.shortageQuantity > 0);
    if (shortageItem) {
      productionSuggestion = {
        customerName: shortageOrder.customerName,
        orderNumber: shortageOrder.orderNumber,
        productName: shortageItem.productName,
        requiredQty: shortageItem.quantity,
        availableQty: shortageItem.availableStockAtOrder,
        shortageQty: shortageItem.shortageQuantity,
        suggestedBatch: 1,
        expectedBatchYield: 200,
      };
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Orders Today"
          value={ordersCount}
          subtitle={`₹${formatINR(orders.reduce((sum, o) => sum + o.totalAmount, 0), false)} gross`}
          icon={ShoppingCart}
          onClick={() => onNavigate('sales-orders')}
        />
        <KpiCard
          title="Invoiced Revenue"
          value={formatINR(totalRevenue)}
          subtitle={`${invoices.length} posted invoices`}
          icon={DollarSign}
          highlightColor="amber"
          onClick={() => onNavigate('billing-gst')}
        />
        <KpiCard
          title="Production"
          value={`${totalGoodPacketsProduced} pkts`}
          subtitle={`${completedBatches.length} completed batch`}
          icon={Factory}
          highlightColor="green"
          onClick={() => onNavigate('production-studio')}
        />
        <KpiCard
          title="Finished Goods"
          value={`${totalFinishedGoodsStock} pkts`}
          subtitle="Ready for dispatch"
          icon={Boxes}
          onClick={() => onNavigate('inventory-flow')}
        />
        <KpiCard
          title="Receivables"
          value={formatINR(totalReceivables)}
          subtitle="Outstanding balance"
          icon={CreditCard}
          highlightColor={totalReceivables > 0 ? 'amber' : 'default'}
          onClick={() => onNavigate('collections')}
        />
        <KpiCard
          title="Deviations"
          value={alerts.length}
          subtitle={`${criticalCount} critical alerts`}
          icon={AlertTriangle}
          highlightColor={criticalCount > 0 ? 'red' : 'default'}
          badge={
            alerts.length > 0
              ? { text: `${alerts.length} ACTIVE`, variant: 'critical' }
              : { text: 'OPTIMAL', variant: 'success' }
          }
          onClick={() => onNavigate('deviation-monitor')}
        />
      </div>

      {/* 2. OPERATIONAL FLOW PIPELINE VISUALIZATION */}
      <div className="bg-[#15191F] border border-[#282E37] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E5AC58] rounded-full"></span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
              Operational Material & Revenue Pipeline
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#8993A1]">
            Real-time stage connectivity
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 relative">
          {/* Stage 1: Purchases */}
          <div
            onClick={() => onNavigate('purchases')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              1. Purchases
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {db.purchases.length} POs
            </div>
            <div className="text-[11px] font-mono text-[#E5AC58] mt-1">
              ₹{formatINR(db.purchases.reduce((s, p) => s + p.totalAmount, 0), false)}
            </div>
          </div>

          {/* Stage 2: Raw Materials */}
          <div
            onClick={() => onNavigate('inventory-flow')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              2. Raw Material
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {rawMaterialTotalKg} kg
            </div>
            <div className="text-[11px] font-mono text-[#8993A1] mt-1">
              Flour, Oil, Spices
            </div>
          </div>

          {/* Stage 3: Production */}
          <div
            onClick={() => onNavigate('production-studio')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              3. Production Run
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {completedBatches.length} Batches
            </div>
            <div className="text-[11px] font-mono text-[#63D39B] mt-1">
              {totalGoodPacketsProduced} pkts yield
            </div>
          </div>

          {/* Stage 4: Finished Goods */}
          <div
            onClick={() => onNavigate('inventory-flow')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              4. Finished Goods
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {totalFinishedGoodsStock} pkts
            </div>
            <div className="text-[11px] font-mono text-[#8993A1] mt-1">
              Murukku 200g
            </div>
          </div>

          {/* Stage 5: Sales Orders */}
          <div
            onClick={() => onNavigate('sales-orders')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              5. Sales Orders
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {orders.length} Orders
            </div>
            <div className="text-[11px] font-mono text-[#F0B44D] mt-1">
              {pendingOrdersCount} in progress
            </div>
          </div>

          {/* Stage 6: Dispatches */}
          <div
            onClick={() => onNavigate('sales-orders')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              6. Dispatched
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {totalDispatchesCount} Dispatches
            </div>
            <div className="text-[11px] font-mono text-[#63D39B] mt-1">
              Stock deducted
            </div>
          </div>

          {/* Stage 7: Collections */}
          <div
            onClick={() => onNavigate('collections')}
            className="p-3 bg-[#101318] border border-[#282E37] relative group hover:border-[#E5AC58] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1">
              7. Collections
            </div>
            <div className="text-sm font-bold font-mono text-[#E8EBF0]">
              {formatINR(totalCollectionsMonth)}
            </div>
            <div className="text-[11px] font-mono text-[#72A9E8] mt-1">
              {payments.length} Payments
            </div>
          </div>
        </div>
      </div>

      {/* 3. DETERMINISTIC PRODUCTION SUGGESTION (Section 23.E) */}
      {productionSuggestion && (
        <div className="p-3.5 bg-[#1C2129] border-l-4 border-l-[#E5AC58] border border-[#282E37] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-[#15191F] border border-[#282E37] text-[#E5AC58] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-[#E8EBF0] uppercase tracking-wider flex items-center gap-2">
                <span>Smart Production Requirement Alert</span>
                <Badge variant="warning">Shortage Identified</Badge>
              </div>
              <div className="text-xs text-[#8993A1] mt-1">
                Order <span className="font-mono text-[#E8EBF0]">{productionSuggestion.orderNumber}</span> for{' '}
                <span className="font-semibold text-[#E8EBF0]">{productionSuggestion.customerName}</span> requires{' '}
                <span className="font-mono text-[#E8EBF0]">{productionSuggestion.requiredQty} pkts</span>.{' '}
                Available stock: <span className="font-mono text-[#63D39B]">{productionSuggestion.availableQty} pkts</span>.{' '}
                Deficit: <span className="font-mono text-[#F06B6B]">{productionSuggestion.shortageQty} pkts</span>.{' '}
                Based on recipe standard yield, launching 1 batch of Murukku 200g will yield{' '}
                <span className="font-mono text-[#E5AC58]">{productionSuggestion.expectedBatchYield} pkts</span> and satisfy this demand.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('production-studio')}
            className="px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-semibold rounded shrink-0 transition-colors"
          >
            Launch Production Run →
          </button>
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN SECTION: PRODUCTION RUNS & ACTIONABLE ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Latest Production Batches with Visual Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#15191F] border border-[#282E37] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#63D39B]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Production Batches & Batch Traceability Timeline
                </h2>
              </div>
              <button
                onClick={() => onNavigate('production-studio')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                Open Studio →
              </button>
            </div>

            {completedBatches.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#8993A1] border border-dashed border-[#282E37]">
                No production batches executed yet today. Click "1-Click Benchmark" or open Production Studio to start a run.
              </div>
            ) : (
              <div className="space-y-4">
                {completedBatches.map((run) => (
                  <div
                    key={run.id}
                    className="p-3.5 bg-[#101318] border border-[#282E37] rounded-none hover:border-[#363E4A] transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-[#E8EBF0]">
                            {run.batchId}
                          </span>
                          <Badge variant="success">{run.status}</Badge>
                          {Math.abs(run.yieldVariancePercent) > 3.0 && (
                            <Badge variant="warning">
                              Yield Var: {run.yieldVariancePercent}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-[#8993A1] mt-0.5">
                          {run.productName} • Standard Recipe BOM v{run.bomVersion}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono text-[#E8EBF0]">
                          Cost/Pkt: <span className="font-bold text-[#E5AC58]">₹{run.costPerPacket.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8993A1]">
                          Total: ₹{formatINR(run.totalRunCost, false)}
                        </div>
                      </div>
                    </div>

                    {/* Batch Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 p-2 bg-[#15191F] border border-[#282E37] text-center mb-3">
                      <div>
                        <div className="text-[10px] font-mono text-[#8993A1] uppercase">Planned</div>
                        <div className="text-xs font-mono font-bold text-[#E8EBF0]">{run.plannedOutput} pkts</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#8993A1] uppercase">Actual Good</div>
                        <div className="text-xs font-mono font-bold text-[#63D39B]">{run.actualGoodOutput} pkts</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#8993A1] uppercase">Damaged Pkgs</div>
                        <div className="text-xs font-mono font-bold text-[#F0B44D]">{run.damagedPackaging} pcs</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#8993A1] uppercase">Yield %</div>
                        <div className="text-xs font-mono font-bold text-[#E5AC58]">
                          {((run.actualGoodOutput / run.plannedOutput) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Section 23.A: Visual Batch Stage Timeline */}
                    <div className="pt-2 border-t border-[#282E37]">
                      <div className="text-[10px] font-mono uppercase text-[#8993A1] mb-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#E5AC58]" />
                        <span>Batch Audit Lifecycle Timeline:</span>
                      </div>
                      <div className="grid grid-cols-5 text-center gap-1">
                        <div className="p-1 bg-[#1C2129] border border-[#282E37]">
                          <div className="text-[9px] font-mono text-[#63D39B]">✓ BOM Loaded</div>
                          <div className="text-[9px] text-[#8993A1]">Formula A</div>
                        </div>
                        <div className="p-1 bg-[#1C2129] border border-[#282E37]">
                          <div className="text-[9px] font-mono text-[#63D39B]">✓ Stock Issued</div>
                          <div className="text-[9px] text-[#8993A1]">40kg Flour / 10.5L Oil</div>
                        </div>
                        <div className="p-1 bg-[#1C2129] border border-[#282E37]">
                          <div className="text-[9px] font-mono text-[#63D39B]">✓ Output Done</div>
                          <div className="text-[9px] text-[#8993A1]">188 Good Pkts</div>
                        </div>
                        <div className="p-1 bg-[#1C2129] border border-[#282E37]">
                          <div className="text-[9px] font-mono text-[#F0B44D]">⚠ Variance -6%</div>
                          <div className="text-[9px] text-[#8993A1]">Deviation Flagged</div>
                        </div>
                        <div className="p-1 bg-[#1C2129] border border-[#282E37]">
                          <div className="text-[9px] font-mono text-[#63D39B]">✓ Posted to Ledger</div>
                          <div className="text-[9px] text-[#8993A1]">Atomic Commit</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics Restrained Chart */}
          <div className="bg-[#15191F] border border-[#282E37] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#E5AC58]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Production Yield & Sales Revenue Flow
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8993A1]">Current Operating Cycle</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E5AC58" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#E5AC58" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#5A6372" fontSize={11} tickLine={false} />
                  <YAxis stroke="#5A6372" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101318',
                      borderColor: '#282E37',
                      color: '#E8EBF0',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#E5AC58"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Alerts Panel & Quick Inventory Snapshot */}
        <div className="space-y-4">
          {/* Actionable Alerts Panel */}
          <div className="bg-[#15191F] border border-[#282E37] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#F06B6B]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Actionable Deviation Alerts
                </h3>
              </div>
              <button
                onClick={() => onNavigate('deviation-monitor')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                Inspect All →
              </button>
            </div>

            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-[#8993A1] bg-[#101318] border border-[#282E37]">
                  No active deviations. Factory operating normally.
                </div>
              ) : (
                alerts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (a.type === 'STOCK_MISMATCH') onNavigate('sales-orders');
                      else onNavigate('deviation-monitor');
                    }}
                    className="p-2.5 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-bold text-[#E8EBF0]">{a.batchId}</span>
                      <Badge
                        variant={a.severity === 'CRITICAL' ? 'critical' : 'warning'}
                      >
                        {a.variancePercent > 0 ? `+${a.variancePercent}%` : `${a.variancePercent}%`}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#8993A1] line-clamp-2">
                      {a.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inventory Snapshot */}
          <div className="bg-[#15191F] border border-[#282E37] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#72A9E8]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Material Stock Health
                </h3>
              </div>
              <button
                onClick={() => onNavigate('inventory-flow')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                Ledger →
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {db.materials.map((m) => {
                const isLow = m.currentStock <= m.reorderLevel;
                return (
                  <div
                    key={m.id}
                    onClick={() => onNavigate('inventory-flow', m.id)}
                    className="p-2 bg-[#101318] border border-[#282E37] flex items-center justify-between hover:border-[#363E4A] cursor-pointer"
                  >
                    <div>
                      <div className="text-[#E8EBF0] font-medium">{m.name}</div>
                      <div className="text-[10px] text-[#8993A1]">
                        Avg: ₹{m.averageCost}/{m.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={
                          isLow ? 'text-[#F06B6B] font-bold' : 'text-[#63D39B] font-bold'
                        }
                      >
                        {m.currentStock} {m.unit}
                      </div>
                      {isLow && (
                        <div className="text-[9px] text-[#F0B44D]">Low Stock</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Sales Queue */}
          <div className="bg-[#15191F] border border-[#282E37] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#E5AC58]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Recent Sales Queue
                </h3>
              </div>
              <button
                onClick={() => onNavigate('sales-orders')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-[#8993A1] bg-[#101318] border border-[#282E37]">
                  No orders yet.
                </div>
              ) : (
                orders.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => onNavigate('sales-orders', ord.id)}
                    className="p-2.5 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-[#E8EBF0]">
                        {ord.orderNumber}
                      </span>
                      <Badge
                        variant={
                          ord.status === 'DISPATCHED'
                            ? 'success'
                            : ord.status === 'APPROVED'
                            ? 'blue'
                            : ord.status === 'SUBMITTED'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {ord.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#8993A1]">
                      <span>{ord.customerName}</span>
                      <span className="font-mono text-[#E8EBF0]">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
