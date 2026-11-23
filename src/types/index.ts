// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Core Domain Types & Interfaces
// ==============================================================================

export type UserRole = 'SALESMAN' | 'ADMIN' | 'PRODUCTION' | 'AUDITOR' | 'OWNER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export type UnitType = 'kg' | 'g' | 'L' | 'ml' | 'pkt' | 'pcs' | 'ctn';

export interface UnitDefinition {
  id: UnitType;
  name: string;
  symbol: string;
  category: 'weight' | 'volume' | 'count';
}

export type MaterialCategory = 'RAW_MATERIAL' | 'PACKAGING' | 'FINISHED_GOODS';

export interface Material {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: UnitType;
  openingStock: number;
  openingRate: number; // Cost per unit
  currentStock: number; // Reconciled from ledger
  averageCost: number; // Weighted average cost
  reorderLevel: number;
  hsnCode: string;
  gstRate: number; // e.g. 5 for 5%
  defaultSellingPrice?: number;
  isActive: boolean;
  supplierId?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  businessName?: string;
  gstin?: string;
  state: string; // e.g. "Tamil Nadu" or "Karnataka"
  stateCode: string; // e.g. "33" or "29"
  address: string;
  phone?: string;
  email?: string;
  creditPeriodDays: number;
  creditLimit: number;
  salesmanId?: string;
  totalOutstanding?: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  gstin?: string;
  state: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface BOMItem {
  id: string;
  bomId: string;
  materialId: string;
  materialName?: string;
  itemType: 'INGREDIENT' | 'PACKAGING';
  quantity: number; // per batch
  unit: UnitType;
  notes?: string;
}

export interface BOM {
  id: string;
  productId: string;
  productName?: string;
  version: number;
  name: string;
  batchSize: number;
  expectedYieldPackets: number;
  standardCostEstimate: number;
  isActive: boolean;
  items: BOMItem[];
  createdAt: string;
  updatedAt?: string;
}

export type LedgerTransactionType =
  | 'OPENING_BALANCE'
  | 'PURCHASE_RECEIPT'
  | 'PRODUCTION_ISSUE'
  | 'PRODUCTION_OUTPUT'
  | 'SALES_DISPATCH'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'DAMAGE'
  | 'ADJUSTMENT'
  | 'CORRECTION';

export interface InventoryLedgerEntry {
  id: string;
  materialId: string;
  materialName?: string;
  materialCategory?: MaterialCategory;
  transactionType: LedgerTransactionType;
  quantityIn: number;
  quantityOut: number;
  unit: UnitType;
  unitCost: number;
  runningBalance: number;
  sourceDocument: string;
  referenceId?: string;
  referenceNumber: string;
  performedBy?: string;
  performerName?: string;
  notes?: string;
  createdAt: string;
}

export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  materialId: string;
  materialName?: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  quantityReceived: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName?: string;
  supplierInvoiceNo?: string;
  purchaseDate: string;
  status: PurchaseStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: PurchaseItem[];
  createdBy?: string;
  createdAt: string;
}

export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProductionConsumption {
  id: string;
  materialId: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number;
  damagedQuantity: number;
  unit: UnitType;
  unitCost: number;
  totalCost: number;
  variancePercent: number; // ((actual - planned) / planned) * 100
}

export interface ProductionRun {
  id: string;
  batchId: string;
  productId: string;
  productName: string;
  bomId: string;
  bomVersion: number;
  productionDate: string;
  supervisorId?: string;
  supervisorName?: string;
  plannedOutput: number;
  actualGoodOutput: number;
  rejectedOutput: number;
  damagedPackaging: number;
  yieldVariancePercent: number; // ((actualGoodOutput - plannedOutput) / plannedOutput) * 100
  consumptions: ProductionConsumption[];
  labourCost: number;
  powerGasCost: number;
  otherCost: number;
  materialCost: number;
  packagingCost: number;
  totalRunCost: number;
  costPerPacket: number;
  status: ProductionStatus;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'INVOICED'
  | 'PARTIALLY_DISPATCHED'
  | 'DISPATCHED'
  | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  standardPrice: number;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  availableStockAtOrder: number;
  shortageQuantity: number;
  dispatchedQuantity: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerState: string;
  salesmanId: string;
  salesmanName: string;
  orderDate: string;
  subtotal: number;
  estimatedGst: number;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  priceOverrideReason?: string;
  stockShortageCount: number;
  items: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalItemAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  financialYear: string;
  orderId?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerAddress: string;
  customerState: string;
  placeOfSupply: string;
  invoiceDate: string;
  dueDate: string;
  isInterstate: boolean;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  cancellationReason?: string;
  items: InvoiceItem[];
  createdBy?: string;
  createdAt: string;
}

export interface DispatchItem {
  id: string;
  dispatchId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
}

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  dispatchDate: string;
  vehicleNumber?: string;
  deliveryNotes?: string;
  items: DispatchItem[];
  createdBy?: string;
  createdAt: string;
}

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  allocations: PaymentAllocation[];
  createdBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  recordId: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  createdAt: string;
}

export interface DeviationAlert {
  id: string;
  batchId: string;
  productId: string;
  productName: string;
  type: 'YIELD_LOSS' | 'EXCESS_CONSUMPTION' | 'PACKAGING_DAMAGE' | 'COST_VARIANCE' | 'STOCK_MISMATCH';
  date: string;
  plannedValue: number;
  actualValue: number;
  variancePercent: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reason: string;
  unit: string;
}

export interface AgeingBucket {
  range: '0-30' | '31-60' | '61-90' | '90+';
  label: string;
  amount: number;
  invoiceCount: number;
}
