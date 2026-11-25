// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Command Center Dashboard (Intuitive Operational Factory Overview)
// ==============================================================================

import React from 'react';
import {
  ShoppingCart,
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
  Plus,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Building2,
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import { useDatabase, useDeviations, useInventory, useSales, useFinance, useCurrentUser } from '../../services/db/useDatabase';
import { formatINR, formatQty } from '../../utils/math';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface CommandCenterProps {
  onNavigate: (tabId: string, referenceId?: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const db = useDatabase();
  const { currentUser } = useCurrentUser();
  const { alerts, criticalCount } = useDeviations();
  const { finishedGoods, rawMaterials, packaging, lowStockItems } = useInventory();
  const { orders, invoices } = useSales();
  const { totalReceivables, payments } = useFinance();

  // Metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const completedBatches = db.productionRuns.filter((r) => r.status === 'COMPLETED');
  const totalGoodPackets = completedBatches.reduce((sum, r) => sum + r.actualGoodOutput, 0);
  const totalFinishedGoodsStock = finishedGoods.reduce((sum, fg) => sum + fg.currentStock, 0);

  const rawMaterialKg = rawMaterials.reduce((sum, m) => sum + (m.unit === 'kg' ? m.currentStock : 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'APPROVED');
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  // Shortage order if any
  const shortageOrder = orders.find((o) => o.stockShortageCount > 0);
  const shortageItem = shortageOrder?.items.find((i) => i.shortageQuantity > 0);

  // Production Suggestion
  const productionSuggestion = shortageOrder && shortageItem ? {
    orderNumber: shortageOrder.orderNumber,
    customerName: shortageOrder.customerName,
    deficit: shortageItem.shortageQuantity,
    productName: shortageItem.productName,
  } : null;

  // Chart data
  const trendData = [
    { name: 'Mon', sales: 0, production: 0 },
    { name: 'Tue', sales: 0, production: 0 },
    { name: 'Wed', sales: 0, production: 0 },
    { name: 'Thu', sales: 0, production: 188 },
    { name: 'Fri', sales: 7875, production: 0 },
    { name: 'Sat', sales: 0, production: 0 },
    { name: 'Sun', sales: 0, production: 0 },
  ];

  return (
    <div className="dashboard-page p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. OPERATIONAL HERO BANNER WITH QUICK ACTIONS */}
      <div className="dashboard-hero bg-[#15191F] border border-[#282E37] p-5 md:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#E5AC58]">
                Factory Overview
              </span>
              <span className="text-[#363E4A]">•</span>
              <span className="text-xs text-[#8993A1] flex items-center gap-1 font-mono">
                <Building2 className="w-3.5 h-3.5 text-[#8993A1]" />
                NOIR Snacks Manufacturing (Tiruchirappalli, TN)
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold font-mono text-[#E8EBF0] tracking-tight">
              Good evening, {currentUser.fullName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-[#8993A1]">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-[#F0B44D] animate-pulse' : 'bg-[#63D39B]'}`} />
                <span className={alerts.length > 0 ? 'text-[#F0B44D] font-semibold' : 'text-[#63D39B] font-semibold'}>
                  {alerts.length > 0 ? `${alerts.length} Items Need Attention` : 'All Systems Operating Normally'}
                </span>
              </div>
              <span className="text-[#363E4A]">|</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#8993A1]" />
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-[#363E4A]">|</span>
              <span>Active Role: <strong className="text-[#E8EBF0]">{currentUser.role}</strong></span>
            </div>
          </div>

          {/* Quick Action Buttons for Non-Technical Users */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {currentUser.role !== 'AUDITOR' && (
              <>
                <button
                  onClick={() => onNavigate('sales-orders')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Order</span>
                </button>
                <button
                  onClick={() => onNavigate('production-studio')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1C2129] hover:bg-[#282E37] border border-[#363E4A] text-xs font-mono text-[#E8EBF0] rounded transition-colors"
                >
                  <Factory className="w-3.5 h-3.5 text-[#63D39B]" />
                  <span>Start Batch</span>
                </button>
                <button
                  onClick={() => onNavigate('purchases')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1C2129] hover:bg-[#282E37] border border-[#363E4A] text-xs font-mono text-[#E8EBF0] rounded transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-[#72A9E8]" />
                  <span>Inward Purchase</span>
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('audit-room')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0] rounded transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BALANCED 5-KPI STRIP */}
      <div className="metrics-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Invoiced Revenue"
          value={formatINR(totalRevenue)}
          subtitle={`${invoices.length} posted invoices`}
          icon={TrendingUp}
          highlightColor="amber"
          onClick={() => onNavigate('billing-gst')}
        />
        <KpiCard
          title="Production Output"
          value={`${totalGoodPackets} pkts`}
          subtitle={completedBatches.length > 0 ? `${completedBatches.length} batch completed` : 'No batches today'}
          icon={Factory}
          highlightColor="green"
          onClick={() => onNavigate('production-studio')}
        />
        <KpiCard
          title="Ready Finished Goods"
          value={`${totalFinishedGoodsStock} pkts`}
          subtitle="Packaged Murukku 200g"
          icon={Boxes}
          onClick={() => onNavigate('inventory-flow')}
        />
        <KpiCard
          title="Customer Receivables"
          value={formatINR(totalReceivables)}
          subtitle={`${db.customers.filter((c) => (c.totalOutstanding || 0) > 0).length} accounts with balance`}
          icon={CreditCard}
          highlightColor={totalReceivables > 0 ? 'amber' : 'default'}
          onClick={() => onNavigate('collections')}
        />
        <KpiCard
          title="Deviations & Alerts"
          value={alerts.length}
          subtitle={`${criticalCount} critical issue`}
          icon={AlertTriangle}
          highlightColor={criticalCount > 0 ? 'red' : alerts.length > 0 ? 'amber' : 'default'}
          badge={
            alerts.length > 0
              ? { text: `${alerts.length} ACTIVE`, variant: criticalCount > 0 ? 'critical' : 'warning' }
              : { text: 'OPTIMAL', variant: 'success' }
          }
          onClick={() => onNavigate('deviation-monitor')}
        />
      </div>

      {/* 3. DETERMINISTIC PRODUCTION DEFICIT SUGGESTION (Section 23.E) */}
      {productionSuggestion && (
        <div className="p-4 bg-[#1C2129] border-l-4 border-l-[#F06B6B] border border-[#282E37] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#15191F] border border-[#282E37] text-[#F06B6B] shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-[#E8EBF0] uppercase tracking-wider flex items-center gap-2">
                <span>Immediate Production Action Required</span>
                <Badge variant="critical">Stock Shortage: {productionSuggestion.deficit} pkts</Badge>
              </div>
              <p className="text-xs text-[#8993A1] mt-1 leading-relaxed">
                Order <strong className="text-[#E8EBF0] font-mono">{productionSuggestion.orderNumber}</strong> for{' '}
                <strong className="text-[#E8EBF0]">{productionSuggestion.customerName}</strong> requires{' '}
                <span className="text-[#F06B6B] font-semibold">{productionSuggestion.deficit} more packets</span> than currently available in finished goods. Launching 1 standard recipe batch in Production Studio will yield 200 packets and resolve this shortage.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('production-studio')}
            className="px-4 py-2 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded shrink-0 transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>Launch Batch Run</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. VISUAL PRODUCTION-TO-DISPATCH OPERATIONAL PIPELINE */}
      <div className="dashboard-panel bg-[#15191F] border border-[#282E37] p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E5AC58]"></span>
              Operational Pipeline Flow (Source to Dispatch)
            </h2>
            <p className="text-[11px] text-[#8993A1] mt-0.5">
              Click any stage to inspect transactions and live balances
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#63D39B] bg-[#63D39B]/10 px-2 py-0.5 rounded border border-[#63D39B]/30 hidden sm:inline">
            Single Shared Inventory
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Stage 1: Inward Purchases */}
          <div
            onClick={() => onNavigate('purchases')}
            className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors group"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1 flex items-center justify-between">
              <span>1. Purchases</span>
              <ArrowUpRight className="w-3 h-3 text-[#5A6372] group-hover:text-[#E5AC58]" />
            </div>
            <div className="text-base font-bold font-mono text-[#E8EBF0]">
              {db.purchases.length} Receipts
            </div>
            <div className="text-[11px] font-mono text-[#E5AC58] mt-1">
              ₹{formatINR(db.purchases.reduce((s, p) => s + p.totalAmount, 0), false)}
            </div>
          </div>

          {/* Stage 2: Raw Materials */}
          <div
            onClick={() => onNavigate('inventory-flow')}
            className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors group"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1 flex items-center justify-between">
              <span>2. Raw Stock</span>
              <ArrowUpRight className="w-3 h-3 text-[#5A6372] group-hover:text-[#E5AC58]" />
            </div>
            <div className="text-base font-bold font-mono text-[#E8EBF0]">
              {rawMaterialKg} kg
            </div>
            <div className="text-[11px] font-mono text-[#8993A1] mt-1">
              Flour, Oil, Spices
            </div>
          </div>

          {/* Stage 3: Production Batches */}
          <div
            onClick={() => onNavigate('production-studio')}
            className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors group"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1 flex items-center justify-between">
              <span>3. Production</span>
              <ArrowUpRight className="w-3 h-3 text-[#5A6372] group-hover:text-[#E5AC58]" />
            </div>
            <div className="text-base font-bold font-mono text-[#E8EBF0]">
              {completedBatches.length} Runs
            </div>
            <div className="text-[11px] font-mono text-[#63D39B] mt-1">
              {totalGoodPackets} pkts yield
            </div>
          </div>

          {/* Stage 4: Ready Finished Goods */}
          <div
            onClick={() => onNavigate('inventory-flow')}
            className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors group"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1 flex items-center justify-between">
              <span>4. Warehouse</span>
              <ArrowUpRight className="w-3 h-3 text-[#5A6372] group-hover:text-[#E5AC58]" />
            </div>
            <div className="text-base font-bold font-mono text-[#E8EBF0]">
              {totalFinishedGoodsStock} pkts
            </div>
            <div className="text-[11px] font-mono text-[#8993A1] mt-1">
              Packaged Snacks
            </div>
          </div>

          {/* Stage 5: Dispatches */}
          <div
            onClick={() => onNavigate('sales-orders')}
            className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors group"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1 flex items-center justify-between">
              <span>5. Dispatched</span>
              <ArrowUpRight className="w-3 h-3 text-[#5A6372] group-hover:text-[#E5AC58]" />
            </div>
            <div className="text-base font-bold font-mono text-[#E8EBF0]">
              {db.dispatches.length} Loads
            </div>
            <div className="text-[11px] font-mono text-[#63D39B] mt-1">
              Stock Deducted
            </div>
          </div>

          {/* Stage 6: Collections */}
          <div
            onClick={() => onNavigate('collections')}
            className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors group"
          >
            <div className="text-[10px] font-mono text-[#8993A1] uppercase mb-1 flex items-center justify-between">
              <span>6. Collections</span>
              <ArrowUpRight className="w-3 h-3 text-[#5A6372] group-hover:text-[#E5AC58]" />
            </div>
            <div className="text-base font-bold font-mono text-[#E8EBF0]">
              {formatINR(totalCollected)}
            </div>
            <div className="text-[11px] font-mono text-[#72A9E8] mt-1">
              {payments.length} Receipts
            </div>
          </div>
        </div>
      </div>

      {/* 5. BALANCED TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Actionable Items, Production Status & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Production Batch Card */}
          <div className="bg-[#15191F] border border-[#282E37] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0] flex items-center gap-2">
                  <Factory className="w-4 h-4 text-[#63D39B]" />
                  Latest Production Run & Batch Audit
                </h3>
                <p className="text-[11px] text-[#8993A1] mt-0.5">
                  Actual consumption compared to standard recipe tolerance
                </p>
              </div>
              <button
                onClick={() => onNavigate('production-studio')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                Studio →
              </button>
            </div>

            {completedBatches.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#8993A1] bg-[#101318] border border-dashed border-[#282E37]">
                No batches produced yet today. Click "Start Batch" to begin a production run.
              </div>
            ) : (
              <div className="space-y-4">
                {completedBatches.slice(0, 1).map((run) => (
                  <div key={run.id} className="p-4 bg-[#101318] border border-[#282E37] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-[#E8EBF0]">
                            {run.batchId}
                          </span>
                          <Badge variant="success">Completed</Badge>
                          {Math.abs(run.yieldVariancePercent) > 3.0 && (
                            <Badge variant="warning">
                              Yield Var: {run.yieldVariancePercent}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-[#8993A1] mt-0.5">
                          {run.productName} • Recipe v{run.bomVersion} • Date: {run.productionDate}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs text-[#8993A1]">Batch Cost per Packet:</div>
                        <div className="text-sm font-bold text-[#E5AC58]">
                          ₹{run.costPerPacket.toFixed(2)}
                          <span className="text-[10px] text-[#8993A1] font-normal ml-1">
                            (Margin: ₹{(50 - run.costPerPacket).toFixed(2)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Batch Quantities Strip */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 bg-[#15191F] border border-[#282E37] text-center text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-[#8993A1] uppercase">Expected Yield</div>
                        <div className="font-bold text-[#E8EBF0] mt-0.5">{run.plannedOutput} pkts</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8993A1] uppercase">Actual Good Packets</div>
                        <div className="font-bold text-[#63D39B] mt-0.5">{run.actualGoodOutput} pkts</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8993A1] uppercase">Damaged Pouches</div>
                        <div className="font-bold text-[#F0B44D] mt-0.5">{run.damagedPackaging} pcs</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8993A1] uppercase">Yield %</div>
                        <div className="font-bold text-[#E5AC58] mt-0.5">
                          {((run.actualGoodOutput / run.plannedOutput) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Stage Timeline */}
                    <div className="pt-2 border-t border-[#282E37]">
                      <div className="text-[10px] font-mono uppercase text-[#8993A1] mb-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#E5AC58]" />
                        <span>Traceability Timeline:</span>
                      </div>
                      <div className="grid grid-cols-5 text-center gap-1.5 font-mono text-[10px]">
                        <div className="p-1.5 bg-[#1C2129] border border-[#282E37] text-[#63D39B]">
                          ✓ BOM Loaded
                        </div>
                        <div className="p-1.5 bg-[#1C2129] border border-[#282E37] text-[#63D39B]">
                          ✓ Stock Issued
                        </div>
                        <div className="p-1.5 bg-[#1C2129] border border-[#282E37] text-[#63D39B]">
                          ✓ Output Done
                        </div>
                        <div className="p-1.5 bg-[#1C2129] border border-[#282E37] text-[#F0B44D]">
                          ⚠ Variance -6%
                        </div>
                        <div className="p-1.5 bg-[#1C2129] border border-[#282E37] text-[#63D39B]">
                          ✓ Ledger Posted
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Queue */}
          <div className="bg-[#15191F] border border-[#282E37] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0] flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#E5AC58]" />
                  Sales Orders & Delivery Queue
                </h3>
                <p className="text-[11px] text-[#8993A1] mt-0.5">
                  Orders awaiting approval, invoicing, and warehouse dispatch
                </p>
              </div>
              <button
                onClick={() => onNavigate('sales-orders')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                View All ({orders.length}) →
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#8993A1] bg-[#101318] border border-dashed border-[#282E37]">
                No orders received yet. Use "Create Order" to submit a sales order.
              </div>
            ) : (
              <div className="divide-y divide-[#282E37] border border-[#282E37]">
                {orders.slice(0, 4).map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => onNavigate('sales-orders', ord.id)}
                    className="p-3 bg-[#101318] hover:bg-[#1C2129] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#E8EBF0]">{ord.orderNumber}</span>
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
                        {ord.stockShortageCount > 0 && ord.status !== 'DISPATCHED' && (
                          <span className="text-[10px] text-[#F06B6B] bg-[#F06B6B]/10 px-1.5 py-0.5 rounded border border-[#F06B6B]/30 font-bold">
                            Shortage Flagged
                          </span>
                        )}
                      </div>
                      <div className="text-[#8993A1] mt-1">
                        {ord.customerName} ({ord.customerState}) • {ord.items.reduce((s, i) => s + i.quantity, 0)} packets
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#E8EBF0]">₹{formatINR(ord.totalAmount, false)}</div>
                      <div className="text-[10px] text-[#8993A1] mt-0.5">{ord.orderDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Actionable Alerts & Stock Health */}
        <div className="space-y-6">
          {/* Actionable Deviation Alerts */}
          <div className="bg-[#15191F] border border-[#282E37] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#F0B44D]" />
                  Active Operational Alerts ({alerts.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('deviation-monitor')}
                className="text-xs font-mono text-[#E5AC58] hover:underline"
              >
                Monitor →
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#63D39B] bg-[#101318] border border-[#282E37]">
                ✓ All batches operating within recipe tolerance
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (a.type === 'STOCK_MISMATCH') onNavigate('sales-orders');
                      else onNavigate('deviation-monitor');
                    }}
                    className="p-3 bg-[#101318] border border-[#282E37] hover:border-[#E5AC58] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-bold text-[#E8EBF0]">{a.batchId}</span>
                      <Badge variant={a.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                        {a.variancePercent > 0 ? `+${a.variancePercent}%` : `${a.variancePercent}%`}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#E8EBF0] font-medium mb-1">
                      {a.productName}
                    </div>
                    <p className="text-[11px] text-[#8993A1] leading-relaxed line-clamp-2">
                      {a.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warehouse Material Health Snapshot */}
          <div className="bg-[#15191F] border border-[#282E37] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0] flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#72A9E8]" />
                Warehouse Stock Health
              </h3>
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
                    className="p-2.5 bg-[#101318] border border-[#282E37] hover:border-[#363E4A] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-[#E8EBF0] font-semibold">{m.name}</div>
                      <div className="text-[10px] text-[#8993A1]">
                        Rate: ₹{m.averageCost.toFixed(2)}/{m.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${isLow ? 'text-[#F06B6B]' : 'text-[#63D39B]'}`}>
                        {m.currentStock} {m.unit}
                      </span>
                      {isLow && (
                        <div className="text-[9px] text-[#F0B44D]">Reorder Level</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sales & Yield Flow Chart */}
          <div className="bg-[#15191F] border border-[#282E37] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                Revenue & Yield Flow
              </span>
              <span className="text-[10px] font-mono text-[#8993A1]">Weekly Trend</span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E5AC58" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E5AC58" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#5A6372" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5A6372" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101318',
                      borderColor: '#282E37',
                      color: '#E8EBF0',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#E5AC58"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
