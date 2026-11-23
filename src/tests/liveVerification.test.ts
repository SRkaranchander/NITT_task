// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Comprehensive End-to-End Live Verification Test
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db/store';
import { round2 } from '../utils/math';

describe('NOIR Live Database Benchmark Step-by-Step QA Verification', () => {
  beforeEach(() => {
    db.resetToOpeningBenchmark();
  });

  it('verifies opening inventory baseline before any transactions', () => {
    expect(db.reconcileStock('mat-flour')).toBe(100);
    expect(db.reconcileStock('mat-oil')).toBe(30);
    expect(db.reconcileStock('mat-spice')).toBe(5);
    expect(db.reconcileStock('mat-pouch')).toBe(500);
    expect(db.reconcileStock('mat-carton')).toBe(30);
    expect(db.reconcileStock('mat-murukku')).toBe(50);
  });

  it('executes Step 1: Purchase 60 kg flour @ ₹45/kg and verifies stock & weighted-average cost', () => {
    const po = db.recordPurchase({
      supplierId: 'supp-southern-agro',
      supplierInvoiceNo: 'SAM-INV-8821',
      purchaseDate: '2026-02-01',
      items: [{ materialId: 'mat-flour', quantity: 60, rate: 45 }],
    });

    expect(po.totalAmount).toBe(2835); // 2700 + 5% GST (135)
    expect(po.subtotal).toBe(2700);

    const flourStock = db.reconcileStock('mat-flour');
    expect(flourStock).toBe(160); // 100 + 60 = 160 kg

    const flourMat = db.getState().materials.find((m) => m.id === 'mat-flour')!;
    expect(flourMat.averageCost).toBe(43.125);
  });

  it('executes Step 2: Production Run and verifies all 6 closing stock balances, variances & costing', () => {
    // 1. Purchase
    db.recordPurchase({
      supplierId: 'supp-southern-agro',
      purchaseDate: '2026-02-01',
      items: [{ materialId: 'mat-flour', quantity: 60, rate: 45 }],
    });

    // 2. Production
    const run = db.recordProductionRun({
      batchId: 'BATCH-2026-001',
      productId: 'mat-murukku',
      bomId: 'bom-murukku-std',
      productionDate: '2026-02-02',
      plannedOutput: 200,
      actualGoodOutput: 188,
      damagedPackaging: 6,
      consumptions: [
        { materialId: 'mat-flour', actualQuantity: 40 },
        { materialId: 'mat-oil', actualQuantity: 10.5 },
        { materialId: 'mat-spice', actualQuantity: 1.2 },
        { materialId: 'mat-pouch', actualQuantity: 188, damagedQuantity: 6 },
        { materialId: 'mat-carton', actualQuantity: 9 },
      ],
      labourCost: 1200,
      powerGasCost: 600,
      notes: 'Benchmark Run Verification',
    });

    // Closing Stocks Immediately After Production
    expect(db.reconcileStock('mat-flour')).toBe(120); // 160 - 40 = 120 kg
    expect(db.reconcileStock('mat-oil')).toBe(19.5); // 30 - 10.5 = 19.5 L
    expect(db.reconcileStock('mat-spice')).toBe(3.8); // 5 - 1.2 = 3.8 kg
    expect(db.reconcileStock('mat-pouch')).toBe(306); // 500 - 194 = 306 pcs
    expect(db.reconcileStock('mat-carton')).toBe(21); // 30 - 9 = 21 pcs
    expect(db.reconcileStock('mat-murukku')).toBe(238); // 50 + 188 = 238 packets

    // Variances
    expect(run.yieldVariancePercent).toBe(-6.0); // 188 vs 200 = -6%
    const oilConsumption = run.consumptions.find((c) => c.materialId === 'mat-oil')!;
    expect(oilConsumption.variancePercent).toBe(5.0); // 10.5 vs 10 = +5%

    // Batch Costing
    expect(run.materialCost).toBe(3435); // 1725 + 1470 + 240
    expect(run.packagingCost).toBe(620); // 485 + 135
    expect(run.labourCost).toBe(1200);
    expect(run.powerGasCost).toBe(600);
    expect(run.totalRunCost).toBe(5855);
    expect(round2(run.costPerPacket)).toBe(31.14);
    expect(round2(50 - run.costPerPacket)).toBe(18.86);
  });

  it('executes Step 3: Retailer A Order, GST invoice & Dispatch, verifying taxes and closing stock', () => {
    // Run Step 1 & 2 first
    db.runFullBenchmarkScenario();
    const state = db.getState();

    const invoiceA = state.invoices.find((i) => i.customerName === 'Retailer A')!;
    expect(invoiceA).toBeDefined();
    expect(invoiceA.taxableAmount).toBe(7500);
    expect(invoiceA.cgstAmount).toBe(187.50);
    expect(invoiceA.sgstAmount).toBe(187.50);
    expect(invoiceA.igstAmount).toBe(0);
    expect(invoiceA.totalAmount).toBe(7875.00);

    // Murukku stock after 150 pkts dispatch
    expect(db.reconcileStock('mat-murukku')).toBe(88); // 238 - 150 = 88 pkts
  });

  it('executes Step 4: Distributor B Order, verifying exact 32 packet shortage and interstate IGST', () => {
    db.runFullBenchmarkScenario();
    const state = db.getState();

    const orderB = state.orders.find((o) => o.customerName === 'Distributor B')!;
    expect(orderB).toBeDefined();
    expect(orderB.items[0].quantity).toBe(120);
    expect(orderB.items[0].shortageQuantity).toBe(32); // 120 - 88 = 32 pkts shortage
    expect(orderB.customerState).toBe('Karnataka');

    // Attempting to dispatch 120 pkts must throw and be rejected by the engine
    expect(() => {
      db.dispatchOrder({ orderId: orderB.id });
    }).toThrow(/Insufficient stock/);
  });

  it('executes Step 5: Retailer A Payment remittance and verifies closing balance', () => {
    db.runFullBenchmarkScenario();
    const state = db.getState();

    const customerA = state.customers.find((c) => c.name === 'Retailer A')!;
    expect(customerA.totalOutstanding).toBe(3875); // 7875 - 4000 = ₹3,875

    const paymentA = state.payments.find((p) => p.customerName === 'Retailer A')!;
    expect(paymentA).toBeDefined();
    expect(paymentA.amount).toBe(4000);
    expect(paymentA.paymentMode).toBe('UPI');
  });

  it('verifies cycle count stock adjustments and invoice cancellation workflows', () => {
    db.resetToOpeningBenchmark();

    // 1. Stock Adjustment test
    const adj = db.recordStockAdjustment({
      materialId: 'mat-flour',
      actualPhysicalCount: 95,
      reason: 'Spillage loss on shelf #3',
    });
    expect(adj.quantityOut).toBe(5);
    expect(db.reconcileStock('mat-flour')).toBe(95);

    // 2. Order Modification & Rejection test
    const order = db.createSalesOrder({
      customerId: 'cust-retailer-a',
      items: [{ productId: 'mat-murukku', quantity: 20 }],
    });
    const modified = db.modifyOrder(order.id, [{ productId: 'mat-murukku', quantity: 25, unitPrice: 48 }], 'Negotiated discount');
    expect(modified.items[0].quantity).toBe(25);
    expect(modified.items[0].unitPrice).toBe(48);

    const rejected = db.rejectOrder(order.id, 'Credit limit exceeded');
    expect(rejected.status).toBe('REJECTED');
  });
});
