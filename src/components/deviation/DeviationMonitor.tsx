// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Deviation Monitor: Manufacturing Variance Analytics & Root Cause Inspector
// ==============================================================================

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingDown,
  ArrowRight,
  Filter,
  CheckCircle2,
  PackageX,
  Scale,
} from 'lucide-react';
import { useDeviations, useProduction } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';

interface DeviationMonitorProps {
  onNavigate: (tabId: string, referenceId?: string) => void;
}

export const DeviationMonitor: React.FC<DeviationMonitorProps> = ({ onNavigate }) => {
  const { alerts, criticalCount, warningCount } = useDeviations();
  const { productionRuns } = useProduction();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F0B44D]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Deviation Monitor
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Automatic detection of yield loss, excess consumption, damaged packaging &amp; shortage variances (&gt;3% tolerance)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1 bg-[#F06B6B]/10 border border-[#F06B6B]/30 text-[#F06B6B] rounded font-semibold">
            {criticalCount} Critical
          </div>
          <div className="px-3 py-1 bg-[#F0B44D]/10 border border-[#F0B44D]/30 text-[#F0B44D] rounded font-semibold">
            {warningCount} Warnings
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            <span>Configured Tolerance</span>
            <Scale className="w-4 h-4 text-[#E5AC58]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#E8EBF0]">± 3.0 %</div>
          <div className="text-xs text-[#8993A1] mt-1">Standard factory threshold</div>
        </div>

        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            <span>Yield Deficits</span>
            <TrendingDown className="w-4 h-4 text-[#F0B44D]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#F0B44D]">
            {alerts.filter((a) => a.type === 'YIELD_LOSS').length}
          </div>
          <div className="text-xs text-[#8993A1] mt-1">Below recipe yield output</div>
        </div>

        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            <span>Excess Ingredient Usage</span>
            <AlertCircle className="w-4 h-4 text-[#F06B6B]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#F06B6B]">
            {alerts.filter((a) => a.type === 'EXCESS_CONSUMPTION').length}
          </div>
          <div className="text-xs text-[#8993A1] mt-1">Over-absorption / spills</div>
        </div>

        <div className="p-4 bg-[#15191F] border border-[#282E37]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8993A1] uppercase mb-1">
            <span>Packaging Damaged</span>
            <PackageX className="w-4 h-4 text-[#E5AC58]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#E8EBF0]">
            {alerts.filter((a) => a.type === 'PACKAGING_DAMAGE').length}
          </div>
          <div className="text-xs text-[#8993A1] mt-1">Sealing / carton defects</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#15191F] border border-[#282E37]">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#8993A1] mr-2">Severity:</span>
          {(['ALL', 'CRITICAL', 'WARNING'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded transition-colors ${
                severityFilter === sev
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-semibold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#8993A1]">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#101318] border border-[#282E37] px-2.5 py-1 text-xs font-mono text-[#E8EBF0] outline-none rounded"
          >
            <option value="ALL">All Types</option>
            <option value="YIELD_LOSS">Yield Loss</option>
            <option value="EXCESS_CONSUMPTION">Excess Consumption</option>
            <option value="PACKAGING_DAMAGE">Packaging Damage</option>
            <option value="STOCK_MISMATCH">Stock Mismatch</option>
          </select>
        </div>
      </div>

      {/* Deviations List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#8993A1] bg-[#15191F] border border-[#282E37]">
            No deviations match the selected filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-[#15191F] border border-[#282E37] hover:border-[#E5AC58] transition-all rounded-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {alert.severity === 'CRITICAL' ? (
                    <AlertCircle className="w-4 h-4 text-[#F06B6B]" />
                  ) : alert.severity === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-[#F0B44D]" />
                  ) : (
                    <Info className="w-4 h-4 text-[#72A9E8]" />
                  )}
                  <span className="text-sm font-bold font-mono text-[#E8EBF0]">
                    {alert.batchId}
                  </span>
                  <Badge variant={alert.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                    {alert.severity}
                  </Badge>
                  <span className="text-xs font-mono text-[#8993A1]">
                    Type: {alert.type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#8993A1]">
                    Date: {alert.date}
                  </span>
                  <button
                    onClick={() => {
                      if (alert.type === 'STOCK_MISMATCH') {
                        onNavigate('sales-orders');
                      } else {
                        onNavigate('production-studio');
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-mono text-[#E5AC58] hover:underline"
                  >
                    <span>Inspect Transaction</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-sm font-semibold text-[#E8EBF0] mb-1">
                {alert.productName}
              </div>

              <p className="text-xs text-[#8993A1] leading-relaxed mb-3">
                {alert.reason}
              </p>

              {/* Variance Comparison Box */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-[#101318] border border-[#282E37] text-center text-xs font-mono max-w-lg">
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Standard Planned</div>
                  <div className="font-bold text-[#E8EBF0]">
                    {alert.plannedValue} {alert.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Actual Consumption</div>
                  <div className="font-bold text-[#F0B44D]">
                    {alert.actualValue} {alert.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8993A1] uppercase">Variance %</div>
                  <div className="font-bold text-[#F06B6B]">
                    {alert.variancePercent > 0 ? `+${alert.variancePercent}%` : `${alert.variancePercent}%`}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
