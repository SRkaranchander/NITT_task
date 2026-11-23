// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Persistent Left Navigation Sidebar & Role Switcher
// ==============================================================================

import React from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Boxes,
  AlertTriangle,
  Receipt,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Truck,
} from 'lucide-react';
import { useCurrentUser, useDeviations, useInventory } from '../../services/db/useDatabase';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, setRole, profiles } = useCurrentUser();
  const { alerts } = useDeviations();
  const { lowStockItems } = useInventory();

  const navItems = [
    {
      id: 'command-center',
      label: 'Command Center',
      icon: LayoutDashboard,
      allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR', 'SALESMAN'],
    },
    {
      id: 'sales-orders',
      label: 'Sales & Orders',
      icon: ShoppingCart,
      allowedRoles: ['OWNER', 'ADMIN', 'SALESMAN', 'AUDITOR'],
    },
    {
      id: 'production-studio',
      label: 'Production Studio',
      icon: Factory,
      badge: 'BOM',
      allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR'],
    },
    {
      id: 'inventory-flow',
      label: 'Inventory Flow',
      icon: Boxes,
      badge: lowStockItems.length > 0 ? `${lowStockItems.length}` : undefined,
      badgeVariant: 'warning',
      allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR'],
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: Truck,
      allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR'],
    },
    {
      id: 'deviation-monitor',
      label: 'Deviation Monitor',
      icon: AlertTriangle,
      badge: alerts.length > 0 ? `${alerts.length}` : undefined,
      badgeVariant: 'critical',
      allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR'],
    },
    {
      id: 'billing-gst',
      label: 'Billing & GST',
      icon: Receipt,
      allowedRoles: ['OWNER', 'ADMIN', 'AUDITOR'],
    },
    {
      id: 'collections',
      label: 'Collections',
      icon: CreditCard,
      allowedRoles: ['OWNER', 'ADMIN', 'AUDITOR'],
    },
    {
      id: 'cost-intelligence',
      label: 'Cost Intelligence',
      icon: TrendingUp,
      allowedRoles: ['OWNER', 'ADMIN', 'AUDITOR'],
    },
    {
      id: 'audit-room',
      label: 'Audit Room',
      icon: ShieldCheck,
      allowedRoles: ['OWNER', 'ADMIN', 'AUDITOR'],
    },
    {
      id: 'people-access',
      label: 'People & Access',
      icon: Users,
      allowedRoles: ['OWNER', 'ADMIN'],
    },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const rolesList: { role: UserRole; label: string }[] = [
    { role: 'OWNER', label: 'Owner' },
    { role: 'ADMIN', label: 'Admin' },
    { role: 'PRODUCTION', label: 'Production' },
    { role: 'SALESMAN', label: 'Salesman' },
    { role: 'AUDITOR', label: 'Auditor' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#101318] border-r border-[#282E37] transition-all duration-200 select-none',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-[#282E37] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* NOIR Monogram Logo */}
            <div className="w-8 h-8 rounded bg-[#0B0D10] border border-[#282E37] flex items-center justify-center font-mono font-bold text-sm tracking-wider text-[#E8EBF0] shrink-0">
              N<span className="text-[#E5AC58]">.</span>
            </div>
            {!isCollapsed && (
              <div className="leading-tight">
                <div className="font-bold tracking-wider font-mono text-sm text-[#E8EBF0]">
                  NOIR
                </div>
                <div className="text-[10px] font-mono text-[#8993A1] tracking-tight">
                  FACTORY INTEL OS
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-[#8993A1] hover:text-[#E8EBF0] p-1 rounded hover:bg-[#15191F]"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isPermitted = item.allowedRoles.includes(currentUser.role);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                disabled={!isPermitted}
                title={!isPermitted ? `Restricted to ${item.allowedRoles.join(', ')}` : item.label}
                className={clsx(
                  'w-full flex items-center gap-3 px-2.5 py-2 text-xs font-medium rounded transition-all duration-150 relative text-left',
                  isActive
                    ? 'bg-[#15191F] text-[#E8EBF0] border border-[#282E37] border-l-2 border-l-[#E5AC58]'
                    : isPermitted
                    ? 'text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#15191F]/60'
                    : 'text-[#5A6372] opacity-40 cursor-not-allowed hover:bg-transparent'
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-[#E5AC58]' : 'text-current'
                  )}
                />
                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-1.5 py-0.2 rounded border',
                      item.badgeVariant === 'critical' &&
                        'bg-[#F06B6B]/10 text-[#F06B6B] border-[#F06B6B]/30',
                      item.badgeVariant === 'warning' &&
                        'bg-[#F0B44D]/10 text-[#F0B44D] border-[#F0B44D]/30',
                      !item.badgeVariant &&
                        'bg-[#1C2129] text-[#8993A1] border-[#282E37]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Role Switcher Footer (Essential for evaluation & testing) */}
        <div className="p-3 border-t border-[#282E37] bg-[#0B0D10]/50">
          {!isCollapsed ? (
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8993A1] mb-1.5 uppercase">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#E5AC58]" /> Role Simulation
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setRole(r.role)}
                    className={clsx(
                      'px-2 py-1 text-[11px] font-mono rounded text-left transition-colors border',
                      currentUser.role === r.role
                        ? 'bg-[#E5AC58]/15 border-[#E5AC58]/60 text-[#E5AC58] font-semibold'
                        : 'bg-[#15191F] border-[#282E37] text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#1C2129]'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-[#5A6372] truncate">
                Logged as: <span className="text-[#8993A1]">{currentUser.fullName}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded bg-[#15191F] border border-[#282E37] flex items-center justify-center text-[#E5AC58] font-mono text-xs font-bold"
                title={`Current Role: ${currentUser.role}. Click to expand.`}
              >
                {currentUser.role.charAt(0)}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
