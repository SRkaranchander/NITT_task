// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Variance & Deviation Monitoring Engine
// ==============================================================================

import { round2 } from './math';

export const DEFAULT_VARIANCE_TOLERANCE_PERCENT = 3.0; // 3%

export interface VarianceCalculation {
  planned: number;
  actual: number;
  diff: number;
  variancePercent: number; // ((actual - planned) / planned) * 100
  exceedsTolerance: boolean;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'DEVIATION_ALERT';
}

/**
 * Calculates yield variance:
 * Expected: 200 packets, Actual: 188 packets
 * Diff: 188 - 200 = -12
 * Variance %: -12 / 200 * 100 = -6.0% (Exceeds 3% tolerance)
 */
export function calculateYieldVariance(
  plannedOutput: number,
  actualGoodOutput: number,
  tolerancePercent: number = DEFAULT_VARIANCE_TOLERANCE_PERCENT
): VarianceCalculation {
  const diff = actualGoodOutput - plannedOutput;
  const variancePercent = plannedOutput > 0 ? round2((diff / plannedOutput) * 100) : 0;
  const exceedsTolerance = Math.abs(variancePercent) > tolerancePercent;

  return {
    planned: plannedOutput,
    actual: actualGoodOutput,
    diff,
    variancePercent,
    exceedsTolerance,
    status: exceedsTolerance ? 'DEVIATION_ALERT' : Math.abs(variancePercent) > 1.5 ? 'ACCEPTABLE' : 'OPTIMAL',
  };
}

/**
 * Calculates material consumption variance:
 * Oil planned: 10 L, Actual: 10.5 L
 * Diff: 10.5 - 10 = +0.5
 * Variance %: +0.5 / 10 * 100 = +5.0% (Exceeds 3% tolerance)
 */
export function calculateConsumptionVariance(
  plannedQty: number,
  actualQty: number,
  tolerancePercent: number = DEFAULT_VARIANCE_TOLERANCE_PERCENT
): VarianceCalculation {
  const diff = actualQty - plannedQty;
  const variancePercent = plannedQty > 0 ? round2((diff / plannedQty) * 100) : 0;
  const exceedsTolerance = Math.abs(variancePercent) > tolerancePercent;

  return {
    planned: plannedQty,
    actual: actualQty,
    diff,
    variancePercent,
    exceedsTolerance,
    status: exceedsTolerance ? 'DEVIATION_ALERT' : Math.abs(variancePercent) > 1.5 ? 'ACCEPTABLE' : 'OPTIMAL',
  };
}
