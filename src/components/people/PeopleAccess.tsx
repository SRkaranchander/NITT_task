// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// People & Role-Based Access Control (RBAC) Module
// ==============================================================================

import React from 'react';
import {
  Users,
  Shield,
  Key,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { UserRole } from '../../types';

export const PeopleAccess: React.FC = () => {
  const { currentUser, setRole, profiles } = useCurrentUser();

  const permissionsMatrix = [
    {
      feature: 'Mobile Order Creation',
      SALESMAN: true,
      ADMIN: true,
      PRODUCTION: false,
      AUDITOR: false,
      OWNER: true,
    },
    {
      feature: 'Order Approval & Price Overrides',
      SALESMAN: false,
      ADMIN: true,
      PRODUCTION: false,
      AUDITOR: false,
      OWNER: true,
    },
    {
      feature: 'GST Invoicing & Dispatches',
      SALESMAN: false,
      ADMIN: true,
      PRODUCTION: false,
      AUDITOR: false,
      OWNER: true,
    },
    {
      feature: 'BOM Recipes & Production Batch Run',
      SALESMAN: false,
      ADMIN: true,
      PRODUCTION: true,
      AUDITOR: false,
      OWNER: true,
    },
    {
      feature: 'Raw Material Purchases & Inward',
      SALESMAN: false,
      ADMIN: true,
      PRODUCTION: true,
      AUDITOR: false,
      OWNER: true,
    },
    {
      feature: 'Collections & Payments Recording',
      SALESMAN: false,
      ADMIN: true,
      PRODUCTION: false,
      AUDITOR: false,
      OWNER: true,
    },
    {
      feature: 'Audit Room & Ledger Reports',
      SALESMAN: false,
      ADMIN: true,
      PRODUCTION: false,
      AUDITOR: true,
      OWNER: true,
    },
    {
      feature: 'Modify/Delete Posted Transactions',
      SALESMAN: false,
      ADMIN: false,
      PRODUCTION: false,
      AUDITOR: false,
      OWNER: false, // Immutable!
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              People & Role-Based Access Control
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            5 distinct factory roles, permission matrix & instant evaluator role simulation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="blue">ACTIVE USER: {currentUser.role}</Badge>
        </div>
      </div>

      {/* Profiles & Demo Logins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isCurrent = currentUser.id === p.id;

          return (
            <div
              key={p.id}
              className={`p-4 bg-[#15191F] border transition-colors ${
                isCurrent ? 'border-[#E5AC58] bg-[#1C2129]' : 'border-[#282E37] hover:border-[#363E4A]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#E8EBF0]">{p.fullName}</span>
                <Badge
                  variant={
                    p.role === 'OWNER'
                      ? 'success'
                      : p.role === 'ADMIN'
                      ? 'blue'
                      : p.role === 'PRODUCTION'
                      ? 'warning'
                      : p.role === 'AUDITOR'
                      ? 'critical'
                      : 'default'
                  }
                >
                  {p.role}
                </Badge>
              </div>

              <div className="text-xs text-[#8993A1] font-mono mb-3">
                {p.email} • {p.phone}
              </div>

              <button
                onClick={() => setRole(p.role)}
                className={`w-full py-1.5 text-xs font-mono rounded font-bold transition-colors ${
                  isCurrent
                    ? 'bg-[#E5AC58]/20 border border-[#E5AC58] text-[#E5AC58]'
                    : 'bg-[#101318] hover:bg-[#282E37] text-[#8993A1] hover:text-[#E8EBF0] border border-[#282E37]'
                }`}
              >
                {isCurrent ? '✓ Active Evaluator Role' : `Switch to ${p.role}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-[#15191F] border border-[#282E37] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-[#E5AC58]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
            Factory Permissions & Security Matrix
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
              <tr>
                <th className="py-2.5 px-3">System Capability</th>
                <th className="py-2.5 px-3 text-center">Salesman</th>
                <th className="py-2.5 px-3 text-center">Production</th>
                <th className="py-2.5 px-3 text-center">Admin</th>
                <th className="py-2.5 px-3 text-center">Auditor</th>
                <th className="py-2.5 px-3 text-center">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282E37]">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1C2129]">
                  <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">
                    {item.feature}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.SALESMAN ? (
                      <Check className="w-4 h-4 text-[#63D39B] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[#5A6372] mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.PRODUCTION ? (
                      <Check className="w-4 h-4 text-[#63D39B] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[#5A6372] mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.ADMIN ? (
                      <Check className="w-4 h-4 text-[#63D39B] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[#5A6372] mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.AUDITOR ? (
                      <Check className="w-4 h-4 text-[#63D39B] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[#5A6372] mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.OWNER ? (
                      <Check className="w-4 h-4 text-[#63D39B] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[#5A6372] mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
