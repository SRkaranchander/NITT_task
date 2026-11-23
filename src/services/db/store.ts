// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Enterprise In-Memory & LocalStorage Database Engine with Atomic Ledger Posting
// ==============================================================================

import {
  UserProfile,
  Customer,
  Supplier,
  Material,
  BOM,
  InventoryLedgerEntry,
  Purchase,
  ProductionRun,
  SalesOrder,
  Invoice,
  Dispatch,
  Payment,
  AuditLog,
  DeviationAlert,
  UserRole,
} from '../../types';
import {
  INITIAL_PROFILES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_MATERIALS,
  INITIAL_BOMS,
  INITIAL_LEDGER,
} from './initialData';
import { round2, round4 } from '../../utils/math';
import { calculateGST } from '../../utils/gst';
import { calculateWeightedAverageCost, calculateProductionBatchCost } from '../../utils/costing';
import { calculateYieldVariance, calculateConsumptionVariance } from '../../utils/variance';

const STORAGE_KEY = 'noir_factory_db_v1';

export interface NoirDatabaseState {
  currentUser: UserProfile;
  profiles: UserProfile[];
  customers: Customer[];
  suppliers: Supplier[];
  materials: Material[];
  boms: BOM[];
  ledger: InventoryLedgerEntry[];
  purchases: Purchase[];
  productionRuns: ProductionRun[];
  orders: SalesOrder[];
  invoices: Invoice[];
  dispatches: Dispatch[];
  payments: Payment[];
  auditLogs: AuditLog[];
}

type Listener = () => void;

class DatabaseEngine {
  private state: NoirDatabaseState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadState();
    this.reconcileAllMaterials();
  }

  private loadState(): NoirDatabaseState {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.materials && parsed.ledger && parsed.profiles) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read existing state from localStorage, initializing fresh', e);
    }

    return this.getInitialState();
  }

  private getInitialState(): NoirDatabaseState {
    const materials = JSON.parse(JSON.stringify(INITIAL_MATERIALS)) as Material[];
    const ledger = JSON.parse(JSON.stringify(INITIAL_LEDGER)) as InventoryLedgerEntry[];
    const profiles = JSON.parse(JSON.stringify(INITIAL_PROFILES)) as UserProfile[];
    const customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)) as Customer[];
    const suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS)) as Supplier[];
    const boms = JSON.parse(JSON.stringify(INITIAL_BOMS)) as BOM[];

    return {
      currentUser: profiles[0], // Default to OWNER
      profiles,
      customers,
      suppliers,
      materials,
      boms,
      ledger,
      purchases: [],
      productionRuns: [],
      orders: [],
      invoices: [],
      dispatches: [],
      payments: [],
      auditLogs: [
        {
          id: 'log-init',
          userId: profiles[0].id,
          userName: profiles[0].fullName,
          action: 'SYSTEM_INITIALIZATION',
          entity: 'FACTORY_OS',
          recordId: 'INIT-001',
          reason: 'Initial opening benchmark state loaded',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  private persistState() {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error('Failed to persist state to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getState(): Readonly<NoirDatabaseState> {
    return this.state;
  }

  // Role switching for demonstration and testing
  public setCurrentUser(user: UserProfile) {
    this.state.currentUser = user;
    this.persistState();
  }

  public setCurrentUserByRole(role: UserRole) {
    const user = this.state.profiles.find((p) => p.role === role);
    if (user) {
      this.state.currentUser = user;
      this.persistState();
    }
  }

  // ============================================================================
  // RECONCILIATION & STOCK DERIVATION
  // ============================================================================
  public reconcileStock(materialId: string): number {
    const entries = this.state.ledger.filter((l) => l.materialId === materialId);
    let totalIn = 0;
    let totalOut = 0;
    for (const e of entries) {
      totalIn += Number(e.quantityIn || 0);
      totalOut += Number(e.quantityOut || 0);
    }
    const balance = round4(totalIn - totalOut);
    return balance;
  }

  public reconcileAllMaterials() {
    for (const mat of this.state.materials) {
      mat.currentStock = this.reconcileStock(mat.id);
    }
  }

  // Post entry to ledger with calculated running balance
  private postLedgerEntry(entry: Omit<InventoryLedgerEntry, 'id' | 'runningBalance' | 'createdAt'>): InventoryLedgerEntry {
    const currentStock = this.reconcileStock(entry.materialId);
    const newBalance = round4(currentStock + (entry.quantityIn || 0) - (entry.quantityOut || 0));

    const newLedgerEntry: InventoryLedgerEntry = {
      ...entry,
      id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      runningBalance: newBalance,
      performedBy: this.state.currentUser.id,
      performerName: this.state.currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    this.state.ledger.push(newLedgerEntry);

    // Update material currentStock cache
    const mat = this.state.materials.find((m) => m.id === entry.materialId);
    if (mat) {
      mat.currentStock = newBalance;
    }

    return newLedgerEntry;
  }

  // Audit Log Entry
  public logAudit(action: string, entity: string, recordId: string, previous?: any, current?: any, reason?: string) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: this.state.currentUser.id,
      userName: this.state.currentUser.fullName,
      action,
      entity,
      recordId,
      previousValues: previous,
      newValues: current,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
  }

  // ============================================================================
  // 1. PURCHASES MODULE
  // ============================================================================
  public recordPurchase(params: {
    supplierId: string;
    supplierInvoiceNo?: string;
    purchaseDate: string;
    items: {
      materialId: string;
      quantity: number;
      rate: number;
    }[];
  }): Purchase {
    const supplier = this.state.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    let subtotal = 0;
    let taxAmount = 0;
    const purchaseId = `po-${Date.now()}`;
    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(this.state.purchases.length + 1).padStart(3, '0')}`;

    const purchaseItems = params.items.map((item, idx) => {
      const mat = this.state.materials.find((m) => m.id === item.materialId);
      if (!mat) throw new Error(`Material with ID ${item.materialId} not found`);

      const itemTotal = round2(item.quantity * item.rate);
      const itemTax = round2((itemTotal * (mat.gstRate || 0)) / 100);
      subtotal += itemTotal;
      taxAmount += itemTax;

      // Update weighted-average cost
      const newAvgCost = calculateWeightedAverageCost(
        mat.currentStock,
        mat.averageCost,
        item.quantity,
        item.rate
      );
      mat.averageCost = newAvgCost;

      // Post to inventory ledger immediately as PURCHASE_RECEIPT
      this.postLedgerEntry({
        materialId: mat.id,
        materialName: mat.name,
        materialCategory: mat.category,
        transactionType: 'PURCHASE_RECEIPT',
        quantityIn: item.quantity,
        quantityOut: 0,
        unit: mat.unit,
        unitCost: item.rate,
        sourceDocument: 'PURCHASE_ORDER',
        referenceId: purchaseId,
        referenceNumber: purchaseNumber,
        notes: `Purchase Receipt from ${supplier.name} (${params.supplierInvoiceNo || 'Direct'})`,
      });

      return {
        id: `poi-${purchaseId}-${idx + 1}`,
        purchaseId,
        materialId: mat.id,
        materialName: mat.name,
        quantity: item.quantity,
        unit: mat.unit,
        rate: item.rate,
        taxRate: mat.gstRate || 0,
        taxAmount: itemTax,
        totalAmount: itemTotal + itemTax,
        quantityReceived: item.quantity,
      };
    });

    const purchase: Purchase = {
      id: purchaseId,
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierInvoiceNo: params.supplierInvoiceNo,
      purchaseDate: params.purchaseDate || new Date().toISOString().split('T')[0],
      status: 'RECEIVED',
      subtotal: round2(subtotal),
      taxAmount: round2(taxAmount),
      totalAmount: round2(subtotal + taxAmount),
      items: purchaseItems,
      createdBy: this.state.currentUser.id,
      createdAt: new Date().toISOString(),
    };

    this.state.purchases.unshift(purchase);
    this.logAudit('PURCHASE_RECEIPT', 'PURCHASE', purchase.purchaseNumber, null, purchase, 'Purchase recorded and stock ledger updated');
    this.persistState();
    return purchase;
  }

  // ============================================================================
  // 2. PRODUCTION STUDIO MODULE
  // ============================================================================
  public recordProductionRun(params: {
    batchId?: string;
    productId: string;
    bomId: string;
    productionDate: string;
    plannedOutput: number;
    actualGoodOutput: number;
    rejectedOutput?: number;
    damagedPackaging?: number;
    consumptions: {
      materialId: string;
      actualQuantity: number;
      damagedQuantity?: number;
    }[];
    labourCost: number;
    powerGasCost: number;
    otherCost?: number;
    notes?: string;
  }): ProductionRun {
    const product = this.state.materials.find((m) => m.id === params.productId);
    if (!product) throw new Error('Finished product not found');

    const bom = this.state.boms.find((b) => b.id === params.bomId);
    if (!bom) throw new Error('BOM not found');

    const batchId = params.batchId || `BATCH-${new Date().getFullYear()}-${String(this.state.productionRuns.length + 1).padStart(3, '0')}`;
    const runId = `prod-${Date.now()}`;

    // Verify stock availability
    for (const item of params.consumptions) {
      const mat = this.state.materials.find((m) => m.id === item.materialId);
      if (!mat) throw new Error(`Material ${item.materialId} not found`);
      const needed = item.actualQuantity + (item.damagedQuantity || 0);
      if (mat.currentStock < needed) {
        throw new Error(`Insufficient stock for ${mat.name}. Required: ${needed} ${mat.unit}, Available: ${mat.currentStock} ${mat.unit}`);
      }
    }

    // Process consumptions and prepare costing inputs
    const materialCostItems: { materialName: string; actualQty: number; weightedAvgRate: number }[] = [];
    const packagingCostItems: { packagingName: string; actualQtyUsed: number; weightedAvgRate: number }[] = [];

    const processedConsumptions = params.consumptions.map((item) => {
      const mat = this.state.materials.find((m) => m.id === item.materialId)!;
      const bomItem = bom.items.find((bi) => bi.materialId === item.materialId);
      const plannedQuantity = bomItem ? bomItem.quantity * (params.plannedOutput / bom.expectedYieldPackets) : item.actualQuantity;

      const variance = calculateConsumptionVariance(plannedQuantity, item.actualQuantity);
      const itemTotalCost = round2(item.actualQuantity * mat.averageCost);

      if (mat.category === 'RAW_MATERIAL') {
        materialCostItems.push({
          materialName: mat.name,
          actualQty: item.actualQuantity,
          weightedAvgRate: mat.averageCost,
        });

        // Deduct raw material via ledger
        this.postLedgerEntry({
          materialId: mat.id,
          materialName: mat.name,
          materialCategory: mat.category,
          transactionType: 'PRODUCTION_ISSUE',
          quantityIn: 0,
          quantityOut: item.actualQuantity,
          unit: mat.unit,
          unitCost: mat.averageCost,
          sourceDocument: 'PRODUCTION_RUN',
          referenceId: runId,
          referenceNumber: batchId,
          notes: `Batch ${batchId} raw material consumption (${item.actualQuantity} ${mat.unit})`,
        });
      } else if (mat.category === 'PACKAGING') {
        const damaged = item.damagedQuantity || 0;
        const totalPackagingUsed = item.actualQuantity + damaged;

        packagingCostItems.push({
          packagingName: mat.name,
          actualQtyUsed: totalPackagingUsed,
          weightedAvgRate: mat.averageCost,
        });

        // Deduct packaging used for good output
        this.postLedgerEntry({
          materialId: mat.id,
          materialName: mat.name,
          materialCategory: mat.category,
          transactionType: 'PRODUCTION_ISSUE',
          quantityIn: 0,
          quantityOut: item.actualQuantity,
          unit: mat.unit,
          unitCost: mat.averageCost,
          sourceDocument: 'PRODUCTION_RUN',
          referenceId: runId,
          referenceNumber: batchId,
          notes: `Batch ${batchId} packaging used for finished goods`,
        });

        // Deduct damaged packaging if any
        if (damaged > 0) {
          this.postLedgerEntry({
            materialId: mat.id,
            materialName: mat.name,
            materialCategory: mat.category,
            transactionType: 'DAMAGE',
            quantityIn: 0,
            quantityOut: damaged,
            unit: mat.unit,
            unitCost: mat.averageCost,
            sourceDocument: 'PRODUCTION_RUN',
            referenceId: runId,
            referenceNumber: batchId,
            notes: `Batch ${batchId} packaging damage (${damaged} ${mat.unit}) during packing`,
          });
        }
      }

      return {
        id: `con-${runId}-${item.materialId}`,
        materialId: mat.id,
        materialName: mat.name,
        plannedQuantity: round4(plannedQuantity),
        actualQuantity: item.actualQuantity,
        damagedQuantity: item.damagedQuantity || 0,
        unit: mat.unit,
        unitCost: mat.averageCost,
        totalCost: itemTotalCost,
        variancePercent: variance.variancePercent,
      };
    });

    // Add finished goods to inventory ledger
    this.postLedgerEntry({
      materialId: product.id,
      materialName: product.name,
      materialCategory: 'FINISHED_GOODS',
      transactionType: 'PRODUCTION_OUTPUT',
      quantityIn: params.actualGoodOutput,
      quantityOut: 0,
      unit: product.unit,
      unitCost: product.averageCost,
      sourceDocument: 'PRODUCTION_RUN',
      referenceId: runId,
      referenceNumber: batchId,
      notes: `Batch ${batchId} finished goods produced (${params.actualGoodOutput} ${product.unit})`,
    });

    // Costing calculations
    const costing = calculateProductionBatchCost({
      materialItems: materialCostItems,
      packagingItems: packagingCostItems,
      labourCost: params.labourCost,
      powerGasCost: params.powerGasCost,
      otherOverheads: params.otherCost,
      actualGoodPackets: params.actualGoodOutput,
      sellingPricePerPacket: product.defaultSellingPrice || 50,
    });

    // Yield variance calculation
    const yieldVar = calculateYieldVariance(params.plannedOutput, params.actualGoodOutput);

    const productionRun: ProductionRun = {
      id: runId,
      batchId,
      productId: product.id,
      productName: product.name,
      bomId: bom.id,
      bomVersion: bom.version,
      productionDate: params.productionDate || new Date().toISOString().split('T')[0],
      supervisorId: this.state.currentUser.id,
      supervisorName: this.state.currentUser.fullName,
      plannedOutput: params.plannedOutput,
      actualGoodOutput: params.actualGoodOutput,
      rejectedOutput: params.rejectedOutput || 0,
      damagedPackaging: params.damagedPackaging || 0,
      yieldVariancePercent: yieldVar.variancePercent,
      consumptions: processedConsumptions,
      labourCost: costing.labourCost,
      powerGasCost: costing.powerGasCost,
      otherCost: costing.otherCost,
      materialCost: costing.materialCost,
      packagingCost: costing.packagingCost,
      totalRunCost: costing.totalRunCost,
      costPerPacket: costing.costPerPacket,
      status: 'COMPLETED',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.state.productionRuns.unshift(productionRun);
    this.logAudit(
      'PRODUCTION_RUN_COMPLETED',
      'PRODUCTION_RUN',
      batchId,
      null,
      productionRun,
      `Produced ${params.actualGoodOutput} pkts at ₹${costing.costPerPacket}/pkt. Total cost: ₹${costing.totalRunCost}`
    );

    this.persistState();
    return productionRun;
  }

  // ============================================================================
  // 3. SALES & ORDERS MODULE
  // ============================================================================
  public createSalesOrder(params: {
    customerId: string;
    salesmanId?: string;
    orderDate?: string;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice?: number;
    }[];
  }): SalesOrder {
    const customer = this.state.customers.find((c) => c.id === params.customerId);
    if (!customer) throw new Error('Customer not found');

    const salesmanId = params.salesmanId || customer.salesmanId || this.state.currentUser.id;
    const salesman = this.state.profiles.find((p) => p.id === salesmanId) || this.state.currentUser;

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `SO-${new Date().getFullYear()}-${String(this.state.orders.length + 1).padStart(3, '0')}`;

    let subtotal = 0;
    let estimatedGst = 0;
    let shortageCount = 0;

    const items = params.items.map((item, idx) => {
      const prod = this.state.materials.find((m) => m.id === item.productId);
      if (!prod) throw new Error(`Product ${item.productId} not found`);

      const price = item.unitPrice ?? prod.defaultSellingPrice ?? 50;
      const itemSubtotal = round2(item.quantity * price);

      const gst = calculateGST(itemSubtotal, customer.state, prod.gstRate || 5);
      subtotal += itemSubtotal;
      estimatedGst += gst.totalGst;

      const currentAvailable = prod.currentStock;
      const shortage = item.quantity > currentAvailable ? item.quantity - currentAvailable : 0;
      if (shortage > 0) shortageCount++;

      return {
        id: `soi-${orderId}-${idx + 1}`,
        orderId,
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unit: prod.unit,
        unitPrice: price,
        standardPrice: prod.defaultSellingPrice || 50,
        subtotal: itemSubtotal,
        gstRate: prod.gstRate || 5,
        gstAmount: gst.totalGst,
        totalAmount: gst.totalAmount,
        availableStockAtOrder: currentAvailable,
        shortageQuantity: shortage,
        dispatchedQuantity: 0,
      };
    });

    const order: SalesOrder = {
      id: orderId,
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerState: customer.state,
      salesmanId: salesman.id,
      salesmanName: salesman.fullName,
      orderDate: params.orderDate || new Date().toISOString().split('T')[0],
      subtotal: round2(subtotal),
      estimatedGst: round2(estimatedGst),
      totalAmount: round2(subtotal + estimatedGst),
      status: 'SUBMITTED',
      notes: params.notes,
      stockShortageCount: shortageCount,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.orders.unshift(order);
    this.logAudit('ORDER_CREATED', 'SALES_ORDER', orderNumber, null, order, `Order submitted by ${salesman.fullName}`);
    this.persistState();
    return order;
  }

  public approveOrder(orderId: string, priceOverrideReason?: string): SalesOrder {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'APPROVED';
    if (priceOverrideReason) {
      order.priceOverrideReason = priceOverrideReason;
    }
    order.updatedAt = new Date().toISOString();

    this.logAudit('ORDER_APPROVED', 'SALES_ORDER', order.orderNumber, null, order, priceOverrideReason || 'Admin approved');
    this.persistState();
    return order;
  }

  public modifyOrder(orderId: string, items: { productId: string; quantity: number; unitPrice: number }[], reason: string): SalesOrder {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'SUBMITTED' && order.status !== 'UNDER_REVIEW') {
      throw new Error('Only submitted orders can be modified before approval');
    }
    const previous = JSON.parse(JSON.stringify(order));

    let subtotal = 0;
    let estimatedGst = 0;
    let shortageCount = 0;

    order.items = items.map((item, idx) => {
      const prod = this.state.materials.find((m) => m.id === item.productId);
      const itemSubtotal = round2(item.quantity * item.unitPrice);
      const gst = calculateGST(itemSubtotal, order.customerState, prod?.gstRate || 5);
      subtotal += itemSubtotal;
      estimatedGst += gst.totalGst;
      const currentAvailable = prod?.currentStock || 0;
      const shortage = item.quantity > currentAvailable ? item.quantity - currentAvailable : 0;
      if (shortage > 0) shortageCount++;

      return {
        id: `soi-${order.id}-${idx + 1}`,
        orderId: order.id,
        productId: item.productId,
        productName: prod?.name || '',
        quantity: item.quantity,
        unit: prod?.unit || 'pkt',
        unitPrice: item.unitPrice,
        standardPrice: prod?.defaultSellingPrice || 50,
        subtotal: itemSubtotal,
        gstRate: prod?.gstRate || 5,
        gstAmount: gst.totalGst,
        totalAmount: gst.totalAmount,
        availableStockAtOrder: currentAvailable,
        shortageQuantity: shortage,
        dispatchedQuantity: 0,
      };
    });

    order.subtotal = round2(subtotal);
    order.estimatedGst = round2(estimatedGst);
    order.totalAmount = round2(subtotal + estimatedGst);
    order.stockShortageCount = shortageCount;
    order.priceOverrideReason = reason;
    order.updatedAt = new Date().toISOString();

    this.logAudit('ORDER_MODIFIED', 'SALES_ORDER', order.orderNumber, previous, order, reason);
    this.persistState();
    return order;
  }

  public rejectOrder(orderId: string, reason: string): SalesOrder {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    order.status = 'REJECTED';
    order.notes = (order.notes ? order.notes + ' | ' : '') + `Rejected: ${reason}`;
    order.updatedAt = new Date().toISOString();
    this.logAudit('ORDER_REJECTED', 'SALES_ORDER', order.orderNumber, null, order, reason);
    this.persistState();
    return order;
  }

  // ============================================================================
  // 4. BILLING & GST INVOICES MODULE
  // ============================================================================
  public createInvoiceFromOrder(orderId: string): Invoice {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'APPROVED') {
      throw new Error(`Order ${order.orderNumber} must be in APPROVED state to invoice (current: ${order.status})`);
    }

    const customer = this.state.customers.find((c) => c.id === order.customerId);
    if (!customer) throw new Error('Customer not found');

    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-2026-${String(this.state.invoices.length + 1).padStart(3, '0')}`;
    const isInterstate = customer.state.trim().toLowerCase() !== 'tamil nadu';

    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const items = order.items.map((oi, idx) => {
      const prod = this.state.materials.find((m) => m.id === oi.productId);
      const gst = calculateGST(oi.subtotal, customer.state, oi.gstRate);

      taxableAmount += gst.taxableAmount;
      cgstAmount += gst.cgstAmount;
      sgstAmount += gst.sgstAmount;
      igstAmount += gst.igstAmount;

      return {
        id: `ii-${invoiceId}-${idx + 1}`,
        invoiceId,
        productId: oi.productId,
        productName: oi.productName,
        hsnCode: prod?.hsnCode || '19059040',
        quantity: oi.quantity,
        unit: oi.unit,
        rate: oi.unitPrice,
        taxableValue: gst.taxableAmount,
        gstRate: gst.gstRate,
        cgstRate: gst.cgstRate,
        cgstAmount: gst.cgstAmount,
        sgstRate: gst.sgstRate,
        sgstAmount: gst.sgstAmount,
        igstRate: gst.igstRate,
        igstAmount: gst.igstAmount,
        totalItemAmount: gst.totalAmount,
      };
    });

    const totalGst = round2(cgstAmount + sgstAmount + igstAmount);
    const totalAmount = round2(taxableAmount + totalGst);

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      financialYear: '2025-2026',
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin,
      customerAddress: customer.address,
      customerState: customer.state,
      placeOfSupply: `${customer.state} (${customer.stateCode})`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + customer.creditPeriodDays * 86400000).toISOString().split('T')[0],
      isInterstate,
      taxableAmount: round2(taxableAmount),
      cgstAmount: round2(cgstAmount),
      sgstAmount: round2(sgstAmount),
      igstAmount: round2(igstAmount),
      totalGstAmount: totalGst,
      totalAmount,
      paidAmount: 0,
      outstandingAmount: totalAmount,
      status: 'ISSUED',
      items,
      createdBy: this.state.currentUser.id,
      createdAt: new Date().toISOString(),
    };

    this.state.invoices.unshift(invoice);
    order.status = 'INVOICED';
    order.updatedAt = new Date().toISOString();

    // Update customer outstanding
    customer.totalOutstanding = round2((customer.totalOutstanding || 0) + totalAmount);

    this.logAudit('INVOICE_GENERATED', 'INVOICE', invoiceNumber, null, invoice, `Generated GST invoice for ${order.orderNumber}`);
    this.persistState();
    return invoice;
  }

  public cancelInvoice(invoiceId: string, reason: string): Invoice {
    const invoice = this.state.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.paidAmount > 0) {
      throw new Error(`Cannot cancel invoice ${invoice.invoiceNumber}: payments of ₹${invoice.paidAmount} have already been collected against it.`);
    }
    const previous = JSON.parse(JSON.stringify(invoice));
    invoice.status = 'CANCELLED';
    invoice.cancellationReason = reason;
    invoice.outstandingAmount = 0;

    // Adjust customer total outstanding
    const customer = this.state.customers.find((c) => c.id === invoice.customerId);
    if (customer) {
      const customerInvoices = this.state.invoices.filter((i) => i.customerId === customer.id && i.status !== 'CANCELLED');
      customer.totalOutstanding = round2(customerInvoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0));
    }

    this.logAudit('INVOICE_CANCELLED', 'INVOICE', invoice.invoiceNumber, previous, invoice, reason);
    this.persistState();
    return invoice;
  }

  // ============================================================================
  // 5. DISPATCH MODULE
  // ============================================================================
  public dispatchOrder(params: {
    orderId: string;
    vehicleNumber?: string;
    deliveryNotes?: string;
    items?: { productId: string; quantity: number }[];
  }): Dispatch {
    const order = this.state.orders.find((o) => o.id === params.orderId);
    if (!order) throw new Error('Order not found');

    const customer = this.state.customers.find((c) => c.id === order.customerId);
    const invoice = this.state.invoices.find((i) => i.orderId === order.id);

    const itemsToDispatch = params.items || order.items.map((oi) => ({
      productId: oi.productId,
      quantity: oi.quantity - (oi.dispatchedQuantity || 0),
    }));

    // Stock verification before dispatch
    for (const item of itemsToDispatch) {
      const prod = this.state.materials.find((m) => m.id === item.productId);
      if (!prod) throw new Error(`Product ${item.productId} not found`);
      if (prod.currentStock < item.quantity) {
        throw new Error(
          `Cannot dispatch: Insufficient stock for ${prod.name}. Required: ${item.quantity} ${prod.unit}, Available: ${prod.currentStock} ${prod.unit}. Shortage: ${item.quantity - prod.currentStock} ${prod.unit}`
        );
      }
    }

    const dispatchId = `disp-${Date.now()}`;
    const dispatchNumber = `DSP-${new Date().getFullYear()}-${String(this.state.dispatches.length + 1).padStart(3, '0')}`;

    const dispatchItems = itemsToDispatch.map((item) => {
      const prod = this.state.materials.find((m) => m.id === item.productId)!;

      // Post inventory ledger movement 'SALES_DISPATCH' atomically
      this.postLedgerEntry({
        materialId: prod.id,
        materialName: prod.name,
        materialCategory: 'FINISHED_GOODS',
        transactionType: 'SALES_DISPATCH',
        quantityIn: 0,
        quantityOut: item.quantity,
        unit: prod.unit,
        unitCost: prod.averageCost,
        sourceDocument: 'SALES_DISPATCH',
        referenceId: dispatchId,
        referenceNumber: dispatchNumber,
        notes: `Sales dispatch to ${order.customerName} (Order: ${order.orderNumber})`,
      });

      // Update order item dispatched quantity
      const orderItem = order.items.find((oi) => oi.productId === item.productId);
      if (orderItem) {
        orderItem.dispatchedQuantity = (orderItem.dispatchedQuantity || 0) + item.quantity;
      }

      return {
        id: `dspi-${dispatchId}-${item.productId}`,
        dispatchId,
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unit: prod.unit,
      };
    });

    // Check if fully dispatched
    const allDispatched = order.items.every((oi) => (oi.dispatchedQuantity || 0) >= oi.quantity);
    order.status = allDispatched ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED';
    order.updatedAt = new Date().toISOString();

    const dispatch: Dispatch = {
      id: dispatchId,
      dispatchNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoiceNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      dispatchDate: new Date().toISOString().split('T')[0],
      vehicleNumber: params.vehicleNumber,
      deliveryNotes: params.deliveryNotes,
      items: dispatchItems,
      createdBy: this.state.currentUser.id,
      createdAt: new Date().toISOString(),
    };

    this.state.dispatches.unshift(dispatch);
    this.logAudit('ORDER_DISPATCHED', 'DISPATCH', dispatchNumber, null, dispatch, `Dispatched items for order ${order.orderNumber}`);
    this.persistState();
    return dispatch;
  }

  // ============================================================================
  // 6. COLLECTIONS & PAYMENTS MODULE
  // ============================================================================
  public recordPayment(params: {
    customerId: string;
    invoiceId?: string;
    amount: number;
    paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
  }): Payment {
    const customer = this.state.customers.find((c) => c.id === params.customerId);
    if (!customer) throw new Error('Customer not found');

    const paymentId = `pay-${Date.now()}`;
    const paymentNumber = `RCP-${new Date().getFullYear()}-${String(this.state.payments.length + 1).padStart(3, '0')}`;

    let remainingToAllocate = params.amount;
    const allocations: { id: string; paymentId: string; invoiceId: string; invoiceNumber: string; allocatedAmount: number; createdAt: string }[] = [];

    // If specific invoice provided, allocate to it first
    if (params.invoiceId) {
      const inv = this.state.invoices.find((i) => i.id === params.invoiceId);
      if (inv) {
        const allocate = Math.min(remainingToAllocate, inv.outstandingAmount);
        inv.paidAmount = round2(inv.paidAmount + allocate);
        inv.outstandingAmount = round2(inv.totalAmount - inv.paidAmount);
        inv.status = inv.outstandingAmount <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';
        remainingToAllocate = round2(remainingToAllocate - allocate);

        allocations.push({
          id: `alloc-${paymentId}-${inv.id}`,
          paymentId,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          allocatedAmount: allocate,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Auto-allocate any remainder against oldest unpaid invoices of customer (FIFO)
    if (remainingToAllocate > 0) {
      const unpaidInvoices = this.state.invoices
        .filter((i) => i.customerId === customer.id && i.outstandingAmount > 0.01 && i.id !== params.invoiceId)
        .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());

      for (const inv of unpaidInvoices) {
        if (remainingToAllocate <= 0) break;
        const allocate = Math.min(remainingToAllocate, inv.outstandingAmount);
        inv.paidAmount = round2(inv.paidAmount + allocate);
        inv.outstandingAmount = round2(inv.totalAmount - inv.paidAmount);
        inv.status = inv.outstandingAmount <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';
        remainingToAllocate = round2(remainingToAllocate - allocate);

        allocations.push({
          id: `alloc-${paymentId}-${inv.id}`,
          paymentId,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          allocatedAmount: allocate,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Recalculate customer total outstanding
    const customerInvoices = this.state.invoices.filter((i) => i.customerId === customer.id && i.status !== 'CANCELLED');
    customer.totalOutstanding = round2(customerInvoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0));

    const payment: Payment = {
      id: paymentId,
      paymentNumber,
      customerId: customer.id,
      customerName: customer.name,
      paymentDate: params.paymentDate || new Date().toISOString().split('T')[0],
      amount: round2(params.amount),
      paymentMode: params.paymentMode,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      allocations,
      createdBy: this.state.currentUser.id,
      createdAt: new Date().toISOString(),
    };

    this.state.payments.unshift(payment);
    this.logAudit('PAYMENT_RECEIVED', 'PAYMENT', paymentNumber, null, payment, `Payment of ₹${params.amount} received from ${customer.name}`);
    this.persistState();
    return payment;
  }

  // Stock Adjustment for Physical Cycle Count
  public recordStockAdjustment(params: {
    materialId: string;
    actualPhysicalCount: number;
    reason: string;
  }): InventoryLedgerEntry {
    const mat = this.state.materials.find((m) => m.id === params.materialId);
    if (!mat) throw new Error('Material not found');

    const currentStock = this.reconcileStock(mat.id);
    const diff = round4(params.actualPhysicalCount - currentStock);

    if (Math.abs(diff) < 0.0001) {
      throw new Error('Physical count matches current ledger balance. No adjustment needed.');
    }

    const refNumber = `ADJ-${new Date().getFullYear()}-${String(this.state.ledger.length + 1).padStart(3, '0')}`;
    const entry = this.postLedgerEntry({
      materialId: mat.id,
      materialName: mat.name,
      materialCategory: mat.category,
      transactionType: diff > 0 ? 'ADJUSTMENT' : 'DAMAGE',
      quantityIn: diff > 0 ? diff : 0,
      quantityOut: diff < 0 ? Math.abs(diff) : 0,
      unit: mat.unit,
      unitCost: mat.averageCost,
      sourceDocument: 'STOCK_ADJUSTMENT',
      referenceNumber: refNumber,
      notes: `Cycle Count Adjustment: ${params.reason} (Variance: ${diff > 0 ? '+' : ''}${diff} ${mat.unit})`,
    });

    this.logAudit('STOCK_ADJUSTMENT', 'MATERIAL', mat.sku, { currentStock }, { newStock: params.actualPhysicalCount }, params.reason);
    this.persistState();
    return entry;
  }

  // ============================================================================
  // 7. DEVIATION MONITOR CALCULATIONS
  // ============================================================================
  public getDeviationAlerts(): DeviationAlert[] {
    const alerts: DeviationAlert[] = [];

    // 1. Yield Deviations from completed production runs
    for (const run of this.state.productionRuns) {
      if (Math.abs(run.yieldVariancePercent) > 3.0) {
        alerts.push({
          id: `dev-yield-${run.id}`,
          batchId: run.batchId,
          productId: run.productId,
          productName: run.productName,
          type: 'YIELD_LOSS',
          date: run.productionDate,
          plannedValue: run.plannedOutput,
          actualValue: run.actualGoodOutput,
          variancePercent: run.yieldVariancePercent,
          severity: Math.abs(run.yieldVariancePercent) > 5.0 ? 'CRITICAL' : 'WARNING',
          reason: `Actual output (${run.actualGoodOutput} pkts) deviates by ${run.yieldVariancePercent}% from expected recipe (${run.plannedOutput} pkts). Tolerance: 3%.`,
          unit: 'pkts',
        });
      }

      // 2. Material consumption deviations
      for (const c of run.consumptions) {
        if (Math.abs(c.variancePercent) > 3.0) {
          alerts.push({
            id: `dev-con-${run.id}-${c.materialId}`,
            batchId: run.batchId,
            productId: run.productId,
            productName: `${run.productName} (${c.materialName})`,
            type: 'EXCESS_CONSUMPTION',
            date: run.productionDate,
            plannedValue: c.plannedQuantity,
            actualValue: c.actualQuantity,
            variancePercent: c.variancePercent,
            severity: Math.abs(c.variancePercent) > 5.0 ? 'CRITICAL' : 'WARNING',
            reason: `Consumption of ${c.materialName} (${c.actualQuantity} ${c.unit}) exceeds standard recipe formula by ${c.variancePercent > 0 ? '+' : ''}${c.variancePercent}%.`,
            unit: c.unit,
          });
        }

        // 3. Packaging damage alerts
        if (c.damagedQuantity > 0) {
          alerts.push({
            id: `dev-pkg-${run.id}-${c.materialId}`,
            batchId: run.batchId,
            productId: run.productId,
            productName: `${run.productName} (${c.materialName})`,
            type: 'PACKAGING_DAMAGE',
            date: run.productionDate,
            plannedValue: 0,
            actualValue: c.damagedQuantity,
            variancePercent: 100,
            severity: c.damagedQuantity >= 5 ? 'WARNING' : 'INFO',
            reason: `${c.damagedQuantity} ${c.unit} of packaging material damaged/wasted during pouch sealing/packaging.`,
            unit: c.unit,
          });
        }
      }
    }

    // 4. Stock Shortage Alerts from Orders
    for (const ord of this.state.orders) {
      if (ord.status !== 'DISPATCHED' && ord.status !== 'CANCELLED') {
        for (const item of ord.items) {
          const mat = this.state.materials.find((m) => m.id === item.productId);
          if (mat && mat.currentStock < item.quantity) {
            const shortage = item.quantity - mat.currentStock;
            alerts.push({
              id: `dev-short-${ord.id}-${item.productId}`,
              batchId: ord.orderNumber,
              productId: mat.id,
              productName: mat.name,
              type: 'STOCK_MISMATCH',
              date: ord.orderDate,
              plannedValue: item.quantity,
              actualValue: mat.currentStock,
              variancePercent: round2((-shortage / item.quantity) * 100),
              severity: 'CRITICAL',
              reason: `Order ${ord.orderNumber} for ${ord.customerName} requires ${item.quantity} ${mat.unit}, but factory stock is ${mat.currentStock} ${mat.unit}. Shortage: ${shortage} ${mat.unit}.`,
              unit: mat.unit,
            });
          }
        }
      }
    }

    return alerts;
  }

  // ============================================================================
  // 8. RESET BENCHMARK & FAST-FORWARD RUNNER
  // ============================================================================
  public resetToOpeningBenchmark() {
    this.state = this.getInitialState();
    this.reconcileAllMaterials();
    this.persistState();
  }

  public runFullBenchmarkScenario(): {
    success: boolean;
    stepResults: Record<string, any>;
  } {
    // 1. Reset first to clean opening state
    this.resetToOpeningBenchmark();

    // STEP 1 — PURCHASE
    // Record 60 kg flour @ ₹45/kg
    const purchase = this.recordPurchase({
      supplierId: 'supp-southern-agro',
      supplierInvoiceNo: 'SAM-INV-8821',
      purchaseDate: '2026-02-01',
      items: [
        {
          materialId: 'mat-flour',
          quantity: 60,
          rate: 45,
        },
      ],
    });

    // STEP 2 — PRODUCTION
    // Create Murukku 200g run:
    // Actuals: Flour 40kg, Oil 10.5L, Spice 1.2kg, Pouches 194 (188 good + 6 damaged), Cartons 9
    // Output: 188 good packets, Labour ₹1,200, Gas/Power ₹600
    const prodRun = this.recordProductionRun({
      batchId: 'BATCH-2026-001',
      productId: 'mat-murukku',
      bomId: 'bom-murukku-std',
      productionDate: '2026-02-02',
      plannedOutput: 200,
      actualGoodOutput: 188,
      rejectedOutput: 0,
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
      notes: 'Benchmark Run 1: High crispness trial with extra oil absorption',
    });

    // STEP 3 — RETAILER A ORDER
    // Customer: Retailer A, TN. 150 packets @ ₹50
    // Admin approves, invoices, dispatches 150 packets
    const orderA = this.createSalesOrder({
      customerId: 'cust-retailer-a',
      salesmanId: 'user-sales-a',
      orderDate: '2026-02-03',
      items: [
        {
          productId: 'mat-murukku',
          quantity: 150,
          unitPrice: 50,
        },
      ],
    });

    this.approveOrder(orderA.id);
    const invoiceA = this.createInvoiceFromOrder(orderA.id);
    const dispatchA = this.dispatchOrder({
      orderId: orderA.id,
      vehicleNumber: 'TN-45-AZ-1124',
      deliveryNotes: 'Standard morning dispatch van',
    });

    // STEP 4 — DISTRIBUTOR B ORDER
    // Customer: Distributor B (Karnataka). 120 packets.
    // Stock available: 88 pkts -> Shortage: 32 pkts!
    const orderB = this.createSalesOrder({
      customerId: 'cust-distributor-b',
      salesmanId: 'user-sales-b',
      orderDate: '2026-02-04',
      items: [
        {
          productId: 'mat-murukku',
          quantity: 120,
          unitPrice: 50,
        },
      ],
    });

    // STEP 5 — PAYMENT
    // Retailer A pays ₹4,000 against invoice
    const paymentA = this.recordPayment({
      customerId: 'cust-retailer-a',
      invoiceId: invoiceA.id,
      amount: 4000,
      paymentMode: 'UPI',
      referenceNumber: 'UPI-77401122889',
      notes: 'Part payment via UPI GPay',
      paymentDate: '2026-02-05',
    });

    // Reconcile and gather verified results
    this.reconcileAllMaterials();
    const flourStock = this.reconcileStock('mat-flour');
    const oilStock = this.reconcileStock('mat-oil');
    const spiceStock = this.reconcileStock('mat-spice');
    const pouchStock = this.reconcileStock('mat-pouch');
    const cartonStock = this.reconcileStock('mat-carton');
    const murukkuStock = this.reconcileStock('mat-murukku');

    const customerA = this.state.customers.find((c) => c.id === 'cust-retailer-a')!;
    const orderBItem = orderB.items[0];

    const stepResults = {
      flourClosingStock: flourStock, // Expected: 120
      oilClosingStock: oilStock, // Expected: 19.5
      spiceClosingStock: spiceStock, // Expected: 3.8
      pouchesClosingStock: pouchStock, // Expected: 306
      cartonsClosingStock: cartonStock, // Expected: 21
      murukkuStockAfterDispatch: murukkuStock, // Expected: 88
      yieldVariance: prodRun.yieldVariancePercent, // Expected: -6%
      oilVariance: prodRun.consumptions.find((c) => c.materialId === 'mat-oil')?.variancePercent, // Expected: +5%
      retailerATaxable: invoiceA.taxableAmount, // Expected: ₹7,500
      retailerACGST: invoiceA.cgstAmount, // Expected: ₹187.50
      retailerASGST: invoiceA.sgstAmount, // Expected: ₹187.50
      retailerATotal: invoiceA.totalAmount, // Expected: ₹7,875
      retailerAOutstanding: customerA.totalOutstanding, // Expected: ₹3,875
      distributorBShortage: orderBItem.shortageQuantity, // Expected: 32
      batchTotalCost: prodRun.totalRunCost, // Expected: ₹5,855
      batchCostPerPacket: prodRun.costPerPacket, // Expected: ₹31.14
    };

    return {
      success: true,
      stepResults,
    };
  }
}

export const db = new DatabaseEngine();
