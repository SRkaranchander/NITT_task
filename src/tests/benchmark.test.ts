// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Automated Benchmark Verification & Unit Tests
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateWeightedAverageCost, calculateProductionBatchCost } from '../utils/costing';
import { calculateGST } from '../utils/gst';
import { calculateYieldVariance, calculateConsumptionVariance } from '../utils/variance';
import { convertUnit } from '../utils/units';
import { db } from '../services/db/store';

describe('Benchmark Step 1: Purchasing & Weighted Average Costing', () => {
  it('correctly calculates weighted-average rate for flour: (100*42 + 60*45) / 160 = 43.125', () => {
    const avgRate = calculateWeightedAverageCost(100, 42, 60, 45);
    expect(avgRate).toBe(43.125);
  });
});

describe('Benchmark Step 2: Production Batch Costing & Variance', () => {
  it('calculates total batch cost of ₹5,855 and cost per packet of approx ₹31.14', () => {
    const costing = calculateProductionBatchCost({
      materialItems: [
        { materialName: 'Flour', actualQty: 40, weightedAvgRate: 43.125 }, // 1725
        { materialName: 'Oil', actualQty: 10.5, weightedAvgRate: 140 }, // 1470
        { materialName: 'Spice', actualQty: 1.2, weightedAvgRate: 200 }, // 240
      ],
      packagingItems: [
        { packagingName: 'Pouches', actualQtyUsed: 194, weightedAvgRate: 2.50 }, // 485
        { packagingName: 'Carton', actualQtyUsed: 9, weightedAvgRate: 15.00 }, // 135
      ],
      labourCost: 1200,
      powerGasCost: 600,
      actualGoodPackets: 188,
      sellingPricePerPacket: 50,
    });

    expect(costing.materialCost).toBe(3435);
    expect(costing.packagingCost).toBe(620);
    expect(costing.labourCost).toBe(1200);
    expect(costing.powerGasCost).toBe(600);
    expect(costing.totalRunCost).toBe(5855);
    expect(Math.round(costing.costPerPacket * 100) / 100).toBe(31.14);
    expect(costing.grossMarginPerPacket).toBe(18.86);
  });

  it('correctly flags yield variance: 188 vs 200 = -6% (> 3% tolerance)', () => {
    const yv = calculateYieldVariance(200, 188, 3.0);
    expect(yv.variancePercent).toBe(-6);
    expect(yv.exceedsTolerance).toBe(true);
    expect(yv.status).toBe('DEVIATION_ALERT');
  });

  it('correctly flags oil consumption variance: 10.5 vs 10 = +5% (> 3% tolerance)', () => {
    const cv = calculateConsumptionVariance(10, 10.5, 3.0);
    expect(cv.variancePercent).toBe(5);
    expect(cv.exceedsTolerance).toBe(true);
    expect(cv.status).toBe('DEVIATION_ALERT');
  });
});

describe('Benchmark Step 3: GST Calculation & Intra vs Inter State', () => {
  it('correctly calculates intra-state Tamil Nadu GST (CGST 2.5% + SGST 2.5% = 5%) for Retailer A', () => {
    const gst = calculateGST(7500, 'Tamil Nadu', 5.0);
    expect(gst.isInterstate).toBe(false);
    expect(gst.taxableAmount).toBe(7500);
    expect(gst.cgstAmount).toBe(187.50);
    expect(gst.sgstAmount).toBe(187.50);
    expect(gst.igstAmount).toBe(0);
    expect(gst.totalAmount).toBe(7875.00);
  });

  it('correctly calculates inter-state Karnataka GST (IGST 5%) for Distributor B', () => {
    const gst = calculateGST(6000, 'Karnataka', 5.0);
    expect(gst.isInterstate).toBe(true);
    expect(gst.taxableAmount).toBe(6000);
    expect(gst.cgstAmount).toBe(0);
    expect(gst.sgstAmount).toBe(0);
    expect(gst.igstAmount).toBe(300.00);
    expect(gst.totalAmount).toBe(6300.00);
  });
});

describe('Benchmark Dimensional Safety & Conversions', () => {
  it('converts weight units within dimension (1 kg = 1000 g)', () => {
    const conv = convertUnit(2.5, 'kg', 'g');
    expect(conv.success).toBe(true);
    expect(conv.result).toBe(2500);
  });

  it('converts cartons to packets (1 carton = 20 packets)', () => {
    const conv = convertUnit(5, 'ctn', 'pkt', 20);
    expect(conv.success).toBe(true);
    expect(conv.result).toBe(100);
  });

  it('rejects cross-dimensional conversion (kg to L) without density', () => {
    const conv = convertUnit(10, 'kg', 'L');
    expect(conv.success).toBe(false);
    expect(conv.error).toContain('Dimension mismatch');
  });
});

describe('Full End-to-End Benchmark Execution in Database Engine', () => {
  beforeEach(() => {
    db.resetToOpeningBenchmark();
  });

  it('runs the full benchmark scenario and matches all expected benchmark values exactly', () => {
    const { success, stepResults } = db.runFullBenchmarkScenario();

    expect(success).toBe(true);

    // Closing Stocks
    expect(stepResults.flourClosingStock).toBe(120);
    expect(stepResults.oilClosingStock).toBe(19.5);
    expect(stepResults.spiceClosingStock).toBe(3.8);
    expect(stepResults.pouchesClosingStock).toBe(306);
    expect(stepResults.cartonsClosingStock).toBe(21);
    expect(stepResults.murukkuStockAfterDispatch).toBe(88);

    // Variances
    expect(stepResults.yieldVariance).toBe(-6);
    expect(stepResults.oilVariance).toBe(5);

    // Financials
    expect(stepResults.retailerATaxable).toBe(7500);
    expect(stepResults.retailerACGST).toBe(187.5);
    expect(stepResults.retailerASGST).toBe(187.5);
    expect(stepResults.retailerATotal).toBe(7875);
    expect(stepResults.retailerAOutstanding).toBe(3875);

    // Shortage
    expect(stepResults.distributorBShortage).toBe(32);

    // Production Costing
    expect(stepResults.batchTotalCost).toBe(5855);
    expect(Math.round(stepResults.batchCostPerPacket * 100) / 100).toBe(31.14);
  });

  it('blocks dispatch that would cause negative inventory', () => {
    // Current Murukku finished goods stock is 50 pkts initially
    const order = db.createSalesOrder({
      customerId: 'cust-retailer-a',
      items: [{ productId: 'mat-murukku', quantity: 90 }], // 90 > 50 available
    });
    db.approveOrder(order.id);

    // Attempting to dispatch 90 pkts when only 50 exist should throw
    expect(() => {
      db.dispatchOrder({ orderId: order.id });
    }).toThrow(/Insufficient stock/);
  });
});
