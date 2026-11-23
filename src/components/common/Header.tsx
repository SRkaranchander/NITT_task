// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Top Application Header
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Search, Bell, Play, RotateCcw, Shield, Menu } from 'lucide-react';
import { useCurrentUser, useDeviations } from '../../services/db/useDatabase';
import { db } from '../../services/db/store';

interface HeaderProps {
  currentTab: string;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onToggleMobileMenu?: () => void;
  onSelectTab: (tabId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSearch,
  onOpenNotifications,
  onToggleMobileMenu,
  onSelectTab,
}) => {
  const { currentUser } = useCurrentUser();
  const { alerts } = useDeviations();
  const [timeStr, setTimeStr] = useState('');
  const [benchmarkFeedback, setBenchmarkFeedback] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ' ' + now.toLocaleTimeString('en-IN', { hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRunBenchmark = () => {
    try {
      const res = db.runFullBenchmarkScenario();
      if (res.success) {
        setBenchmarkFeedback('Benchmark Scenario Executed Successfully!');
        setTimeout(() => setBenchmarkFeedback(null), 4000);
        onSelectTab('command-center');
      }
    } catch (err: any) {
      alert(`Benchmark execution error: ${err.message}`);
    }
  };

  const handleReset = () => {
    if (confirm('Reset factory data to Opening Benchmark State (Flour 100kg, Oil 30L, Spice 5kg, Pouches 500, Cartons 30, Murukku 50 pkts)?')) {
      db.resetToOpeningBenchmark();
      setBenchmarkFeedback('Factory Reset to Opening State.');
      setTimeout(() => setBenchmarkFeedback(null), 3000);
    }
  };

  const pageTitles: Record<string, string> = {
    'command-center': 'Command Center',
    'sales-orders': 'Sales & Order Queue',
    'production-studio': 'Production Studio (BOM & Batches)',
    'inventory-flow': 'Inventory Flow & Stock Ledger',
    'purchases': 'Purchases & Supplier Inflow',
    'deviation-monitor': 'Deviation & Variance Monitor',
    'billing-gst': 'Billing & GST Invoices',
    'collections': 'Collections & Receivables',
    'cost-intelligence': 'Cost Intelligence & Margins',
    'audit-room': 'Audit Room (Immutable Reports)',
    'people-access': 'People & Role-Based Access',
  };

  return (
    <header className="h-14 border-b border-[#282E37] bg-[#101318] px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-[#8993A1] hover:text-[#E8EBF0] p-1.5"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#E5AC58] tracking-widest uppercase">
              NOIR OS
            </span>
            <span className="text-xs text-[#8993A1]">/</span>
            <h1 className="text-sm font-semibold text-[#E8EBF0]">
              {pageTitles[currentTab] || currentTab}
            </h1>
          </div>
        </div>
      </div>

      {benchmarkFeedback && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#E5AC58]/10 border border-[#E5AC58]/40 text-[#E5AC58] text-xs font-mono rounded">
          <span>●</span> {benchmarkFeedback}
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-3">
        {/* Benchmark 1-Click Fast Actions */}
        <div className="flex items-center bg-[#15191F] border border-[#282E37] rounded p-0.5">
          <button
            onClick={handleRunBenchmark}
            title="Fast-forward and execute the exact 5-step benchmark scenario"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] font-semibold rounded-sm transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">1-Click Benchmark</span>
          </button>
          <button
            onClick={handleReset}
            title="Reset to Opening Inventory"
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#1C2129] rounded-sm transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-[#8993A1] hover:text-[#E8EBF0] rounded transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Quick Search...</span>
          <kbd className="hidden lg:inline text-[10px] bg-[#0B0D10] px-1.5 py-0.5 rounded border border-[#282E37]">
            ⌘K
          </kbd>
        </button>

        {/* Live Factory Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#15191F] border border-[#282E37] rounded text-[11px] font-mono text-[#8993A1]">
          <span className="w-2 h-2 rounded-full bg-[#63D39B] animate-pulse"></span>
          <span>UNIT-1 (TN)</span>
          <span className="text-[#363E4A]">|</span>
          <span>{timeStr}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#15191F] rounded border border-transparent hover:border-[#282E37] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F06B6B] ring-2 ring-[#101318]" />
          )}
        </button>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#282E37]">
          <div className="w-7 h-7 rounded bg-[#1C2129] border border-[#282E37] flex items-center justify-center font-mono text-xs font-bold text-[#E5AC58]">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-medium text-[#E8EBF0] leading-none">
              {currentUser.fullName}
            </div>
            <div className="text-[10px] font-mono text-[#8993A1] leading-tight mt-0.5 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-[#E5AC58]" />
              {currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
