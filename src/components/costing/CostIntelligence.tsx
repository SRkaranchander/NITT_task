// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Cost Intelligence & Unit Margin Analysis Module
// ==============================================================================

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Scale,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useDatabase, useProduction } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/math';

export const CostIntelligence: React.FC = () => {
  const { productionRuns } = useProduction();
  const latestRun = productionRuns[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Cost Intelligence & Margin Engine
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Weighted-average inventory costing, direct consumption allocations & packet-level gross margins
          </p>
        </div>

        <Badge variant="success">WEIGHTED AVERAGE METHOD</Badge>
      </div>

      {/* Benchmark Costing Walkthrough Panel (Section 15 & 21.6) */}
      <div className="bg-[#15191F] border border-[#282E37] p-5 space-y-4">
        <div className="border-b border-[#282E37] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono text-[#E8EBF0]">
              Benchmark Production Run Costing Breakdown (Murukku 200g)
            </h2>
            <p className="text-xs text-[#8993A1]">
              Calculated on actual physical consumption & weighted-average material purchase rates
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#E5AC58]">
            Batch Output: 188 Good Packets
          </span>
        </div>

        {/* Costing Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
              <tr>
                <th className="py-2.5 px-3">Cost Component</th>
                <th className="py-2.5 px-3">Actual Consumed</th>
                <th className="py-2.5 px-3 text-right">Applicable Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Costing Method</th>
                <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282E37]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">Rice Flour Premium</td>
                <td className="py-2.5 px-3">40.0 kg</td>
                <td className="py-2.5 px-3 text-right text-[#E5AC58]">₹43.125</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Weighted Avg (100@42 + 60@45)</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹1,725.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">Cooking Oil Refined</td>
                <td className="py-2.5 px-3">10.5 L</td>
                <td className="py-2.5 px-3 text-right text-[#E5AC58]">₹140.00</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Weighted Avg Tank Rate</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹1,470.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">Salt & Spice Mix Formula</td>
                <td className="py-2.5 px-3">1.2 kg</td>
                <td className="py-2.5 px-3 text-right text-[#E5AC58]">₹200.00</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Standard Batch Inventory</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹240.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">200g Printed Pouches</td>
                <td className="py-2.5 px-3">194 pcs (188 good + 6 damaged)</td>
                <td className="py-2.5 px-3 text-right text-[#E5AC58]">₹2.50</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Total Pouches Drawn</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹485.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">Master Cartons</td>
                <td className="py-2.5 px-3">9 pcs</td>
                <td className="py-2.5 px-3 text-right text-[#E5AC58]">₹15.00</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Cartons Packed</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹135.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">Direct Factory Labour</td>
                <td className="py-2.5 px-3">1 Shift Team</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">-</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Direct Batch Entry</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹1,200.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#E8EBF0]">Gas & Electric Power</td>
                <td className="py-2.5 px-3">Batch Metering</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">-</td>
                <td className="py-2.5 px-3 text-right text-[#8993A1]">Direct Batch Entry</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#E8EBF0]">₹600.00</td>
              </tr>
              <tr className="bg-[#101318] text-sm font-bold">
                <td colSpan={4} className="py-3 px-3 text-[#E8EBF0]">
                  Total Batch Production Cost:
                </td>
                <td className="py-3 px-3 text-right text-[#E5AC58] text-base">
                  ₹5,855.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Packet Unit Economics Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-[#282E37] text-center font-mono">
          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#8993A1] uppercase">Good Packets Produced</div>
            <div className="text-xl font-bold text-[#63D39B]">188 pkts</div>
          </div>
          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#8993A1] uppercase">Cost Per Packet</div>
            <div className="text-xl font-bold text-[#E5AC58]">₹31.14</div>
            <div className="text-[10px] text-[#8993A1]">5,855 ÷ 188</div>
          </div>
          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#8993A1] uppercase">Selling Price (Pre-GST)</div>
            <div className="text-xl font-bold text-[#E8EBF0]">₹50.00</div>
          </div>
          <div className="p-3 bg-[#101318] border border-[#282E37]">
            <div className="text-[10px] text-[#8993A1] uppercase">Gross Margin</div>
            <div className="text-xl font-bold text-[#63D39B]">₹18.86 (37.7%)</div>
            <div className="text-[10px] text-[#8993A1]">50.00 − 31.14</div>
          </div>
        </div>
      </div>
    </div>
  );
};
