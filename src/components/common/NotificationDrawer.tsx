// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Active Deviation & Actionable Notifications Drawer
// ==============================================================================

import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useDeviations } from '../../services/db/useDatabase';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { alerts } = useDeviations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#101318] border-l border-[#282E37] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="h-14 border-b border-[#282E37] px-4 flex items-center justify-between bg-[#15191F]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E5AC58]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#E8EBF0]">
              Operational Alerts ({alerts.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8993A1] hover:text-[#E8EBF0] p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8993A1] font-mono border border-dashed border-[#282E37] rounded">
              All factory parameters operating within standard 3% tolerance. No active deviations.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.type === 'STOCK_MISMATCH') {
                    onNavigate('sales-orders');
                  } else {
                    onNavigate('deviation-monitor');
                  }
                  onClose();
                }}
                className="p-3 bg-[#15191F] border border-[#282E37] hover:border-[#E5AC58] transition-all cursor-pointer rounded-none relative group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {alert.severity === 'CRITICAL' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-[#F06B6B]" />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F0B44D]" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-[#72A9E8]" />
                    )}
                    <span className="text-[11px] font-mono font-bold text-[#E8EBF0]">
                      {alert.batchId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8993A1]">
                    {alert.date}
                  </span>
                </div>

                <div className="text-xs text-[#E8EBF0] font-medium mb-1">
                  {alert.productName}
                </div>

                <div className="text-[11px] text-[#8993A1] leading-relaxed">
                  {alert.reason}
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#282E37] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#E5AC58]">
                    Variance: {alert.variancePercent > 0 ? `+${alert.variancePercent}%` : `${alert.variancePercent}%`}
                  </span>
                  <span className="text-[#8993A1] group-hover:text-[#E8EBF0] flex items-center gap-1">
                    Inspect <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
