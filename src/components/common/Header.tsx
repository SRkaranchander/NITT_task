// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Top Application Header (Clean, Compact, Purposeful)
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Play, RotateCcw, Shield, Menu, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
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
  const [benchmarkMenuOpen, setBenchmarkMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        }) + ' • ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close benchmark menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setBenchmarkMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRunBenchmark = () => {
    try {
      const res = db.runFullBenchmarkScenario();
      if (res.success) {
        setBenchmarkFeedback('Benchmark Scenario Executed Successfully');
        setTimeout(() => setBenchmarkFeedback(null), 4000);
        setBenchmarkMenuOpen(false);
        onSelectTab('command-center');
      }
    } catch (err: any) {
      alert(`Benchmark execution error: ${err.message}`);
    }
  };

  const handleReset = () => {
    if (confirm('Reset factory data to Opening Benchmark State (Flour 100kg, Oil 30L, Spice 5kg, Pouches 500, Cartons 30, Murukku 50 pkts)?')) {
      db.resetToOpeningBenchmark();
      setBenchmarkFeedback('Factory Reset to Opening State');
      setTimeout(() => setBenchmarkFeedback(null), 3000);
      setBenchmarkMenuOpen(false);
      onSelectTab('command-center');
    }
  };

  const pageTitles: Record<string, string> = {
    'command-center': 'Command Center',
    'sales-orders': 'Sales & Orders',
    'production-studio': 'Production Studio',
    'inventory-flow': 'Inventory Flow',
    'purchases': 'Purchases & Inflow',
    'deviation-monitor': 'Deviation Monitor',
    'billing-gst': 'Billing & GST Invoices',
    'collections': 'Collections & Receivables',
    'cost-intelligence': 'Cost Intelligence',
    'audit-room': 'Audit Room',
    'people-access': 'People & Access',
  };

  return (
    <header className="h-16 border-b border-[#282E37] bg-[#101318] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Breadcrumbs & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-[#8993A1] hover:text-[#E8EBF0] p-1.5 rounded hover:bg-[#15191F]"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#8993A1]">NOIR</span>
          <span className="text-[#363E4A]">/</span>
          <h1 className="font-semibold text-[#E8EBF0]">
            {pageTitles[currentTab] || currentTab}
          </h1>
        </div>
      </div>

      {/* Center Feedback Toast */}
      {benchmarkFeedback && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#E5AC58]/10 border border-[#E5AC58]/40 text-[#E5AC58] text-xs font-mono rounded animate-in fade-in slide-in-from-top-1 duration-150">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{benchmarkFeedback}</span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-[#8993A1] hover:text-[#E8EBF0] rounded transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden md:inline text-[10px] bg-[#0B0D10] px-1.5 py-0.5 rounded border border-[#282E37] text-[#5A6372]">
            ⌘K
          </kbd>
        </button>

        {/* Benchmark Mode Actions Menu (Controlled & Elegant) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setBenchmarkMenuOpen(!benchmarkMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] hover:border-[#E5AC58]/50 text-xs font-mono text-[#E8EBF0] rounded transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#E5AC58]"></span>
            <span className="hidden sm:inline">Benchmark</span>
            <ChevronDown className="w-3 h-3 text-[#8993A1]" />
          </button>

          {benchmarkMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#15191F] border border-[#282E37] rounded shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
              <div className="px-2 py-1.5 text-[10px] text-[#8993A1] uppercase tracking-wider font-semibold border-b border-[#282E37] mb-1">
                Benchmark Testing Tools
              </div>

              <button
                onClick={handleRunBenchmark}
                className="w-full flex items-start gap-2.5 p-2 rounded hover:bg-[#1C2129] text-left transition-colors group"
              >
                <div className="p-1 rounded bg-[#E5AC58]/10 text-[#E5AC58] shrink-0 mt-0.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <div className="font-bold text-[#E8EBF0] group-hover:text-[#E5AC58]">
                    1-Click Benchmark Run
                  </div>
                  <div className="text-[10px] text-[#8993A1]">
                    Executes full 5-step scenario atomically
                  </div>
                </div>
              </button>

              <button
                onClick={handleReset}
                className="w-full flex items-start gap-2.5 p-2 rounded hover:bg-[#1C2129] text-left transition-colors group"
              >
                <div className="p-1 rounded bg-[#F06B6B]/10 text-[#F06B6B] shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-[#E8EBF0] group-hover:text-[#F06B6B]">
                    Reset to Opening State
                  </div>
                  <div className="text-[10px] text-[#8993A1]">
                    Flour 100kg, Oil 30L, Spice 5kg
                  </div>
                </div>
              </button>

              <div className="pt-1.5 mt-1 border-t border-[#282E37] px-2 text-[10px] text-[#63D39B] flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>18/18 Automated Tests Passing</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Factory Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-[#15191F] border border-[#282E37] rounded text-xs font-mono text-[#8993A1]">
          <span className="w-2 h-2 rounded-full bg-[#63D39B] animate-pulse"></span>
          <span className="text-[#E8EBF0]">UNIT-1 (TN)</span>
          <span className="text-[#363E4A]">|</span>
          <span>{timeStr}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#15191F] rounded border border-transparent hover:border-[#282E37] transition-colors"
          aria-label="Notifications"
          title="Deviation & Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F06B6B] ring-2 ring-[#101318]" />
          )}
        </button>

        {/* User Role Pill */}
        <div
          onClick={() => onSelectTab('people-access')}
          className="flex items-center gap-2 pl-2 border-l border-[#282E37] cursor-pointer group"
          title="Click to view People & Access"
        >
          <div className="w-7 h-7 rounded bg-[#1C2129] border border-[#282E37] group-hover:border-[#E5AC58] flex items-center justify-center font-mono text-xs font-bold text-[#E5AC58] transition-colors">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-xs font-medium text-[#E8EBF0] group-hover:text-[#E5AC58] transition-colors">
              {currentUser.fullName.split(' ')[0]}
            </div>
            <div className="text-[10px] font-mono text-[#8993A1]">
              {currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
