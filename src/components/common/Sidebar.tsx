// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Enterprise Navigation Sidebar (Expanded by default, Grouped Hierarchy)
// ==============================================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Boxes,
  Truck,
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
  ChevronDown,
  LogOut,
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
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onSignOut,
}) => {
  const { currentUser, setRole } = useCurrentUser();
  const { alerts } = useDeviations();
  const { lowStockItems } = useInventory();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Grouped Navigation Structure
  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'command-center',
          label: 'Command Center',
          icon: LayoutDashboard,
          allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR', 'SALESMAN'],
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
          id: 'deviation-monitor',
          label: 'Deviation Monitor',
          icon: AlertTriangle,
          badge: alerts.length > 0 ? `${alerts.length}` : undefined,
          badgeVariant: 'critical',
          allowedRoles: ['OWNER', 'ADMIN', 'PRODUCTION', 'AUDITOR'],
        },
      ],
    },
    {
      title: 'SUPPLY & COMMERCE',
      items: [
        {
          id: 'sales-orders',
          label: 'Sales & Orders',
          icon: ShoppingCart,
          allowedRoles: ['OWNER', 'ADMIN', 'SALESMAN', 'AUDITOR'],
        },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: Truck,
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
      ],
    },
    {
      title: 'INTELLIGENCE & AUDIT',
      items: [
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
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'OWNER', label: 'Owner', desc: 'Full business visibility & KPIs' },
    { role: 'ADMIN', label: 'Admin', desc: 'Order review, invoicing, dispatch' },
    { role: 'PRODUCTION', label: 'Production', desc: 'BOM recipe, batch execution' },
    { role: 'SALESMAN', label: 'Salesman', desc: 'Mobile order creation' },
    { role: 'AUDITOR', label: 'Auditor', desc: 'Read-only audit reports & ledger' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          'app-sidebar fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#101318] border-r border-[#282E37] transition-all duration-200 select-none shrink-0',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-[#282E37] px-4 flex items-center justify-between bg-[#0B0D10]/50">
          <div
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            onClick={() => handleNavClick('command-center')}
          >
            {/* NOIR Monogram Logo */}
            <div className="brand-mark w-9 h-9 rounded-xl bg-[#15191F] border border-[#282E37] flex items-center justify-center font-mono font-bold text-sm tracking-wider text-[#E8EBF0] shrink-0">
              N<span className="text-[#E5AC58]">.</span>
            </div>
            {!isCollapsed && (
              <div className="leading-tight">
                <div className="font-bold tracking-wider font-mono text-sm text-[#E8EBF0] flex items-center gap-1.5">
                  NOIR
                  <span className="text-[10px] px-1 py-0.2 bg-[#E5AC58]/10 text-[#E5AC58] border border-[#E5AC58]/30 font-normal rounded">
                    OS
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#8993A1] tracking-tight">
                  Factory Intelligence
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-[#8993A1] hover:text-[#E8EBF0] p-1.5 rounded hover:bg-[#15191F] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 py-4 px-2 space-y-5 overflow-y-auto overflow-x-hidden">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 mb-1.5 text-[10px] font-mono tracking-wider text-[#5A6372] uppercase font-semibold">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isPermitted = item.allowedRoles.includes(currentUser.role);

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      disabled={!isPermitted}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-all duration-150 text-left',
                        isActive
                          ? 'bg-[#15191F] text-[#E8EBF0] border border-[#282E37] border-l-2 border-l-[#E5AC58] font-semibold'
                          : isPermitted
                          ? 'text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#15191F]/70'
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
                            'text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0',
                            item.badgeVariant === 'critical' &&
                              'bg-[#F06B6B]/15 text-[#F06B6B] border-[#F06B6B]/30',
                            item.badgeVariant === 'warning' &&
                              'bg-[#F0B44D]/15 text-[#F0B44D] border-[#F0B44D]/30',
                            !item.badgeVariant &&
                              'bg-[#1C2129] text-[#8993A1] border-[#282E37]'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#E8EBF0] whitespace-nowrap rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        {item.label} {!isPermitted && '(Restricted)'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & Role Switcher Footer */}
        <div className="p-3 border-t border-[#282E37] bg-[#0B0D10]/60 relative">
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="min-w-0 flex-1 flex items-center justify-between p-2 rounded bg-[#15191F] border border-[#282E37] hover:border-[#363E4A] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#1C2129] border border-[#282E37] flex items-center justify-center font-mono text-xs font-bold text-[#E5AC58] shrink-0">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="leading-tight truncate">
                      <div className="text-xs font-semibold text-[#E8EBF0] truncate">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[10px] font-mono text-[#8993A1] flex items-center gap-1 mt-0.5">
                        <Shield className="w-2.5 h-2.5 text-[#E5AC58]" />
                        <span>{currentUser.role}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={clsx(
                      'w-3.5 h-3.5 text-[#8993A1] transition-transform shrink-0',
                      roleMenuOpen && 'rotate-180'
                    )}
                  />
                </button>
                <button
                  onClick={onSignOut}
                  className="sign-out-button w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-[#282E37] bg-[#15191F] text-[#8993A1] hover:text-[#F06B6B]"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Role Simulation Dropdown */}
              {roleMenuOpen && (
                <div className="absolute bottom-full left-3 right-3 mb-2 p-2 bg-[#15191F] border border-[#282E37] shadow-2xl rounded space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-mono uppercase text-[#8993A1] px-2 py-1 font-semibold flex items-center justify-between">
                    <span>Switch Role (Simulation)</span>
                  </div>
                  {rolesList.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={clsx(
                        'w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center justify-between',
                        currentUser.role === r.role
                          ? 'bg-[#E5AC58]/15 text-[#E5AC58] font-bold border border-[#E5AC58]/30'
                          : 'text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#1C2129]'
                      )}
                    >
                      <div>
                        <div>{r.label}</div>
                        <div className="text-[9px] text-[#5A6372]">{r.desc}</div>
                      </div>
                      {currentUser.role === r.role && (
                        <span className="text-[10px] text-[#E5AC58]">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="w-8 h-8 rounded bg-[#15191F] border border-[#282E37] flex items-center justify-center text-[#E5AC58] font-mono text-xs font-bold hover:border-[#E5AC58] transition-colors"
                title={`Current Role: ${currentUser.role}. Click to switch.`}
              >
                {currentUser.role.charAt(0)}
              </button>
              <button
                onClick={onSignOut}
                className="sign-out-button w-8 h-8 rounded-lg border border-[#282E37] bg-[#15191F] flex items-center justify-center text-[#8993A1] hover:text-[#F06B6B]"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
