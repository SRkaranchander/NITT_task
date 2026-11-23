// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Cost Intelligence & Weighted Average Costing Engine
// ==============================================================================

import { round2, round4 } from './math';

/**
 * Computes Weighted Average Cost after a new purchase receipt.
 * Example:
 * Opening: 100 kg @ ₹42 = ₹4,200
 * Purchase: 60 kg @ ₹45 = ₹2,700
 * Weighted Average Rate = (4,200 + 2,700) / (100 + 60) = 6,900 / 160 = ₹43.125 / kg
 */
export function calculateWeightedAverageCost(
  currentStock: number,
  currentAvgCost: number,
  newQuantity: number,
  newPurchaseRate: number
): number {
  if (currentStock + newQuantity <= 0) return currentAvgCost;
  const currentTotalVal = currentStock * currentAvgCost;
  const newTotalVal = newQuantity * newPurchaseRate;
  const totalStock = currentStock + newQuantity;
  return round4((currentTotalVal + newTotalVal) / totalStock);
}

export interface ProductionCostingInput {
  materialItems: {
    materialName: string;
    actualQty: number;
    weightedAvgRate: number;
  }[];
  packagingItems: {
    packagingName: string;
    actualQtyUsed: number;
    weightedAvgRate: number;
  }[];
  labourCost: number;
  powerGasCost: number;
  otherOverheads?: number;
  actualGoodPackets: number;
  sellingPricePerPacket?: number;
}

export interface ProductionCostingResult {
  materialCost: number;
  packagingCost: number;
  labourCost: number;
  powerGasCost: number;
  otherCost: number;
  totalRunCost: number;
  costPerPacket: number;
  sellingPrice: number;
  grossMarginPerPacket: number;
  grossMarginPercent: number;
}

/**
 * Computes batch production cost based on actual consumption and weighted-average rates.
 * Exact Benchmark:
 * Flour: 40 kg * 43.125 = 1,725.00
 * Oil: 10.5 L * 140 = 1,470.00
 * Spice: 1.2 kg * 200 = 240.00
 * Material Total = 3,435.00
 * Pouches: 194 * 2.50 = 485.00
 * Cartons: 9 * 15.00 = 135.00
 * Packaging Total = 620.00
 * Labour: 1,200.00
 * Gas/Power: 600.00
 * Total Batch Cost = 3435 + 620 + 1200 + 600 = 5,855.00
 * Good Packets: 188
 * Cost per packet: 5855 / 188 = 31.1436... (approx ₹31.14)
 * Selling Price: ₹50.00
 * Gross Margin: ₹18.86 (37.71%)
 */
export function calculateProductionBatchCost(
  input: ProductionCostingInput
): ProductionCostingResult {
  const materialCost = round2(
    input.materialItems.reduce(
      (sum, item) => sum + item.actualQty * item.weightedAvgRate,
      0
    )
  );

  const packagingCost = round2(
    input.packagingItems.reduce(
      (sum, item) => sum + item.actualQtyUsed * item.weightedAvgRate,
      0
    )
  );

  const labourCost = round2(input.labourCost);
  const powerGasCost = round2(input.powerGasCost);
  const otherCost = round2(input.otherOverheads || 0);

  const totalRunCost = round2(
    materialCost + packagingCost + labourCost + powerGasCost + otherCost
  );

  const actualGoodPackets = input.actualGoodPackets > 0 ? input.actualGoodPackets : 1;
  const costPerPacket = round4(totalRunCost / actualGoodPackets);

  const sellingPrice = input.sellingPricePerPacket || 50;
  const grossMarginPerPacket = round2(sellingPrice - costPerPacket);
  const grossMarginPercent = round2((grossMarginPerPacket / sellingPrice) * 100);

  return {
    materialCost,
    packagingCost,
    labourCost,
    powerGasCost,
    otherCost,
    totalRunCost,
    costPerPacket,
    sellingPrice,
    grossMarginPerPacket,
    grossMarginPercent,
  };
}
