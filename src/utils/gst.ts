// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// GST Calculation Engine (Intra-state CGST+SGST vs Inter-state IGST)
// ==============================================================================

import { round2 } from './math';

export const FACTORY_STATE = 'Tamil Nadu';
export const FACTORY_STATE_CODE = '33';

export interface GSTBreakdown {
  taxableAmount: number;
  isInterstate: boolean;
  gstRate: number; // e.g. 5
  cgstRate: number; // 2.5
  cgstAmount: number; // ₹187.50
  sgstRate: number; // 2.5
  sgstAmount: number; // ₹187.50
  igstRate: number; // 5.0 (for inter-state)
  igstAmount: number;
  totalGst: number;
  totalAmount: number;
}

/**
 * Computes GST breakdown decimal-safely for intra-state (TN) vs inter-state (e.g. KA).
 * For 150 packets of Murukku @ ₹50 in Tamil Nadu (5% rate):
 * Taxable = 7500.00
 * CGST = 2.5% of 7500 = 187.50
 * SGST = 2.5% of 7500 = 187.50
 * Total = 7875.00
 */
export function calculateGST(
  taxableAmount: number,
  customerState: string,
  gstRate: number = 5.0
): GSTBreakdown {
  const roundedTaxable = round2(taxableAmount);
  const isInterstate = customerState.trim().toLowerCase() !== FACTORY_STATE.toLowerCase();

  if (isInterstate) {
    const igstRate = gstRate;
    const igstAmount = round2((roundedTaxable * igstRate) / 100);
    const totalGst = igstAmount;
    const totalAmount = round2(roundedTaxable + totalGst);

    return {
      taxableAmount: roundedTaxable,
      isInterstate: true,
      gstRate,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate,
      igstAmount,
      totalGst,
      totalAmount,
    };
  } else {
    const halfRate = gstRate / 2;
    const cgstAmount = round2((roundedTaxable * halfRate) / 100);
    const sgstAmount = round2((roundedTaxable * halfRate) / 100);
    const totalGst = round2(cgstAmount + sgstAmount);
    const totalAmount = round2(roundedTaxable + totalGst);

    return {
      taxableAmount: roundedTaxable,
      isInterstate: false,
      gstRate,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalGst,
      totalAmount,
    };
  }
}
