// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Sales & Orders Module (Mobile Salesman <60s + Admin Review Queue)
// ==============================================================================

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Truck,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Info,
} from 'lucide-react';
import { useDatabase, useSales, useCurrentUser, useInventory } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR, formatQty } from '../../utils/math';
import { calculateGST } from '../../utils/gst';

interface SalesOrdersProps {
  onNavigate: (tabId: string, referenceId?: string) => void;
}

export const SalesOrders: React.FC<SalesOrdersProps> = ({ onNavigate }) => {
  const dbState = useDatabase();
  const { orders, customers, createOrder, approveOrder, modifyOrder, rejectOrder, createInvoice, dispatchOrder } = useSales();
  const { currentUser } = useCurrentUser();
  const { finishedGoods } = useInventory();

  const [activeTab, setActiveTab] = useState<'queue' | 'new_order'>('queue');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // New Order Form State (Mobile-First <60s Flow)
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(finishedGoods[0]?.id || 'mat-murukku');
  const [orderQuantity, setOrderQuantity] = useState(150);
  const [unitPrice, setUnitPrice] = useState(50);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Price Override Modal State for Admin
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overridePrice, setOverridePrice] = useState(50);
  const [overrideQty, setOverrideQty] = useState(150);
  const [priceOverrideReason, setPriceOverrideReason] = useState('Bulk volume customer price adjustment');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const selectedProduct = finishedGoods.find((f) => f.id === selectedProductId) || finishedGoods[0];

  const subtotal = orderQuantity * unitPrice;
  const gstBreakdown = calculateGST(subtotal, selectedCustomer?.state || 'Tamil Nadu', selectedProduct?.gstRate || 5);
  const currentAvailableStock = selectedProduct?.currentStock || 0;
  const hasShortage = orderQuantity > currentAvailableStock;
  const shortageAmount = hasShortage ? orderQuantity - currentAvailableStock : 0;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submission
    setIsSubmitting(true);

    try {
      const order = createOrder({
        customerId: selectedCustomerId,
        salesmanId: currentUser.id,
        items: [
          {
            productId: selectedProductId,
            quantity: orderQuantity,
            unitPrice: unitPrice,
          },
        ],
        notes,
      });

      alert(`Sales Order ${order.orderNumber} successfully created!`);
      setActiveTab('queue');
      setSelectedOrderId(order.id);
    } catch (err: any) {
      alert(`Error submitting order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = (orderId: string) => {
    try {
      approveOrder(orderId, priceOverrideReason || undefined);
      setOverrideModalOpen(false);
      setPriceOverrideReason('');
      alert('Order approved by Admin!');
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleCreateInvoice = (orderId: string) => {
    try {
      const inv = createInvoice(orderId);
      alert(`GST Invoice ${inv.invoiceNumber} generated!`);
      onNavigate('billing-gst', inv.id);
    } catch (err: any) {
      alert(`Invoice generation failed: ${err.message}`);
    }
  };

  const handleDispatch = (orderId: string) => {
    try {
      const dsp = dispatchOrder({
        orderId,
        vehicleNumber: 'TN-45-AZ-1124',
        deliveryNotes: 'Standard delivery van',
      });
      alert(`Dispatch ${dsp.dispatchNumber} logged and stock deducted from finished goods!`);
    } catch (err: any) {
      alert(`Dispatch failed: ${err.message}`);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Sales & Order Processing
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Mobile order creation, stock availability verification, GST invoicing & dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#15191F] border border-[#282E37] rounded p-0.5 flex text-xs font-mono">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'queue'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-semibold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              Order Queue ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('new_order')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                activeTab === 'new_order'
                  ? 'bg-[#1C2129] text-[#E8EBF0] font-semibold border border-[#363E4A]'
                  : 'text-[#8993A1] hover:text-[#E8EBF0]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#E5AC58]" />
              <span>Mobile Order Entry (&lt;60s)</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'new_order' ? (
        /* FAST MOBILE ORDER ENTRY (<60 SECONDS) */
        <div className="max-w-xl mx-auto bg-[#15191F] border border-[#282E37] p-5 space-y-4">
          <div className="border-b border-[#282E37] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#E5AC58]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                Fast Mobile Salesman Order Flow
              </h2>
            </div>
            <Badge variant="blue">Under 60s Target</Badge>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Step 1: Customer */}
            <div>
              <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                1. Select Assigned Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none focus:border-[#E5AC58]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.businessName || c.code}) — {c.state}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="text-[11px] text-[#8993A1] mt-1 pl-1">
                  Location: <span className="text-[#E8EBF0]">{selectedCustomer.address}</span> • State:{' '}
                  <span className="text-[#E5AC58]">{selectedCustomer.state}</span>
                </div>
              )}
            </div>

            {/* Step 2: Product & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  2. Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-xs font-mono text-[#E8EBF0] outline-none focus:border-[#E5AC58]"
                >
                  {finishedGoods.map((fg) => (
                    <option key={fg.id} value={fg.id}>
                      {fg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                  3. Quantity (Packets)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 10))}
                    className="px-2.5 py-2 bg-[#101318] border border-[#282E37] text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0]"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#101318] border border-[#282E37] px-3 py-2 text-center text-xs font-mono font-bold text-[#E8EBF0] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(orderQuantity + 10)}
                    className="px-2.5 py-2 bg-[#101318] border border-[#282E37] text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0]"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: Stock Health Feedback */}
            <div className="p-3 bg-[#101318] border border-[#282E37] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8993A1]">Available Finished Goods Stock:</span>
              <span className={hasShortage ? 'text-[#F06B6B] font-bold' : 'text-[#63D39B] font-bold'}>
                {currentAvailableStock} pkts
              </span>
            </div>

            {hasShortage && (
              <div className="p-3 bg-[#F06B6B]/10 border border-[#F06B6B]/40 text-[#F06B6B] text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Stock Shortage Alert: {shortageAmount} pkts Deficit</div>
                  <div className="text-[11px] text-[#8993A1] mt-0.5">
                    Order can still be submitted for admin review, but dispatch will require a new production batch.
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Cart Summary & GST Calculation */}
            <div className="p-3 bg-[#101318] border border-[#282E37] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[#8993A1]">
                <span>Price per Packet (Pre-Tax):</span>
                <span className="text-[#E8EBF0]">₹{unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#8993A1]">
                <span>Subtotal ({orderQuantity} pkts × ₹{unitPrice}):</span>
                <span className="text-[#E8EBF0]">₹{formatINR(subtotal, false)}</span>
              </div>
              <div className="flex justify-between text-[#8993A1]">
                <span>
                  Estimated GST ({gstBreakdown.isInterstate ? 'IGST 5%' : 'CGST 2.5% + SGST 2.5%'}):
                </span>
                <span className="text-[#E5AC58]">₹{formatINR(gstBreakdown.totalGst, false)}</span>
              </div>
              <div className="pt-2 border-t border-[#282E37] flex justify-between font-bold text-sm">
                <span className="text-[#E8EBF0]">Total Order Amount:</span>
                <span className="text-[#E5AC58]">₹{formatINR(gstBreakdown.totalAmount, false)}</span>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-[11px] font-mono text-[#8993A1] mb-1">
                Optional Delivery Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Urgent morning dispatch requested"
                className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-xs font-mono text-[#E8EBF0] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors"
            >
              {isSubmitting ? 'Submitting Order...' : 'Submit Sales Order →'}
            </button>
          </form>
        </div>
      ) : (
        /* ADMIN ORDER REVIEW QUEUE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#15191F] border border-[#282E37]">
              <div className="p-3 border-b border-[#282E37] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                  Active Order Review Queue
                </span>
                <span className="text-[11px] font-mono text-[#8993A1]">
                  Sorted by status
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[#8993A1]">
                  No sales orders in queue. Use "Mobile Order Entry" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37]">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Packets</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282E37]">
                      {orders.map((ord) => {
                        const isSelected = selectedOrder?.id === ord.id;
                        const totalPkts = ord.items.reduce((s, i) => s + i.quantity, 0);

                        return (
                          <tr
                            key={ord.id}
                            onClick={() => setSelectedOrderId(ord.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#1C2129] border-l-2 border-l-[#E5AC58]'
                                : 'hover:bg-[#1C2129]/60'
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-[#E8EBF0]">
                              {ord.orderNumber}
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#E8EBF0]">
                              {ord.customerName}
                            </td>
                            <td className="py-3 px-3 text-[#8993A1]">
                              {ord.customerState}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-[#E8EBF0]">
                              {totalPkts} pkts
                            </td>
                            <td className="py-3 px-3 text-right text-[#E5AC58] font-bold">
                              ₹{formatINR(ord.totalAmount, false)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge
                                variant={
                                  ord.status === 'DISPATCHED'
                                    ? 'success'
                                    : ord.status === 'APPROVED'
                                    ? 'blue'
                                    : ord.status === 'SUBMITTED'
                                    ? 'warning'
                                    : 'default'
                                }
                              >
                                {ord.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Selected Order Actions & Approval Card (1 Col) */}
          <div className="space-y-4">
            {selectedOrder ? (
              <div className="bg-[#15191F] border border-[#282E37] p-4 space-y-4">
                <div className="border-b border-[#282E37] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-[#E8EBF0]">
                      {selectedOrder.orderNumber}
                    </span>
                    <Badge variant={selectedOrder.status === 'DISPATCHED' ? 'success' : 'default'}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#8993A1] mt-1">
                    Customer: <span className="text-[#E8EBF0] font-semibold">{selectedOrder.customerName}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8993A1] mt-0.5">
                    State: {selectedOrder.customerState} • Salesman: {selectedOrder.salesmanName}
                  </div>
                </div>

                {/* Items & Stock Shortage Check */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase text-[#8993A1]">
                    Ordered Items & Stock Availability
                  </div>
                  {selectedOrder.items.map((item) => {
                    const prod = finishedGoods.find((f) => f.id === item.productId);
                    const available = prod?.currentStock || 0;
                    const shortage = item.quantity > available ? item.quantity - available : 0;

                    return (
                      <div key={item.id} className="p-2.5 bg-[#101318] border border-[#282E37] text-xs font-mono space-y-1">
                        <div className="flex justify-between font-semibold text-[#E8EBF0]">
                          <span>{item.productName}</span>
                          <span>{item.quantity} pkts</span>
                        </div>
                        <div className="flex justify-between text-[#8993A1] text-[11px]">
                          <span>Unit Price: ₹{item.unitPrice}</span>
                          <span>Subtotal: ₹{formatINR(item.subtotal, false)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-[#282E37]">
                          <span className="text-[#8993A1]">Available in Warehouse:</span>
                          <span className={shortage > 0 ? 'text-[#F06B6B] font-bold' : 'text-[#63D39B]'}>
                            {available} pkts {shortage > 0 && `(Deficit: ${shortage})`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Totals */}
                <div className="p-3 bg-[#101318] border border-[#282E37] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[#8993A1]">
                    <span>Taxable Subtotal:</span>
                    <span className="text-[#E8EBF0]">₹{formatINR(selectedOrder.subtotal, false)}</span>
                  </div>
                  <div className="flex justify-between text-[#8993A1]">
                    <span>Estimated GST:</span>
                    <span className="text-[#E5AC58]">₹{formatINR(selectedOrder.estimatedGst, false)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#282E37] flex justify-between font-bold text-sm">
                    <span className="text-[#E8EBF0]">Order Total:</span>
                    <span className="text-[#E5AC58]">₹{formatINR(selectedOrder.totalAmount, false)}</span>
                  </div>
                </div>

                {/* Admin Workflow Action Buttons */}
                {currentUser.role !== 'AUDITOR' && (
                  <div className="space-y-2 pt-2 border-t border-[#282E37]">
                    {selectedOrder.stockShortageCount > 0 && selectedOrder.status !== 'DISPATCHED' && (
                      <div className="p-2.5 bg-[#F06B6B]/10 border border-[#F06B6B]/30 space-y-1.5">
                        <div className="text-[11px] font-mono text-[#F06B6B] font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Stock Shortage Detected ({selectedOrder.items.find(i => i.shortageQuantity > 0)?.shortageQuantity} pkts)</span>
                        </div>
                        <p className="text-[10px] text-[#8993A1]">
                          Dispatch is blocked until stock is produced. Launch 1 batch to replenish finished goods.
                        </p>
                        <button
                          type="button"
                          onClick={() => onNavigate('production-studio')}
                          className="w-full py-1 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-[#E5AC58] text-[11px] font-mono font-bold rounded"
                        >
                          Launch Production Run →
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'SUBMITTED' && (
                      <div className="space-y-1.5">
                        <button
                          onClick={() => handleApprove(selectedOrder.id)}
                          className="w-full py-2 bg-[#63D39B] hover:bg-[#72e1a9] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Order</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const item = selectedOrder.items[0];
                              setOverrideQty(item?.quantity || 150);
                              setOverridePrice(item?.unitPrice || 50);
                              setOverrideModalOpen(true);
                            }}
                            className="py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#E5AC58] rounded"
                          >
                            Modify Price/Qty
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) {
                                rejectOrder(selectedOrder.id, reason);
                                alert('Order rejected.');
                              }
                            }}
                            className="py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#F06B6B] rounded"
                          >
                            Reject Order
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedOrder.status === 'APPROVED' && (
                      <button
                        onClick={() => handleCreateInvoice(selectedOrder.id)}
                        className="w-full py-2 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Generate GST Invoice</span>
                      </button>
                    )}

                    {selectedOrder.status === 'INVOICED' && (
                      <button
                        onClick={() => handleDispatch(selectedOrder.id)}
                        className="w-full py-2 bg-[#72A9E8] hover:bg-[#85baf7] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Dispatch & Deduct Stock</span>
                      </button>
                    )}

                    {selectedOrder.status === 'DISPATCHED' && (
                      <div className="p-2 bg-[#63D39B]/10 border border-[#63D39B]/30 text-[#63D39B] text-center text-xs font-mono font-bold rounded">
                        ✓ Dispatched & Stock Reconciled
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ADMIN PRICE & QUANTITY OVERRIDE MODAL */}
      {overrideModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#15191F] border border-[#282E37] p-5 shadow-2xl">
            <h3 className="text-sm font-bold font-mono text-[#E8EBF0] uppercase tracking-wider mb-3">
              Modify Order: {selectedOrder.orderNumber}
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#8993A1] mb-1">Quantity (Packets):</label>
                <input
                  type="number"
                  min="1"
                  value={overrideQty}
                  onChange={(e) => setOverrideQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8993A1] mb-1">Unit Selling Price (₹):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8993A1] mb-1">Mandatory Override Reason:</label>
                <input
                  type="text"
                  value={priceOverrideReason}
                  onChange={(e) => setPriceOverrideReason(e.target.value)}
                  placeholder="e.g. Promotional volume discount"
                  className="w-full bg-[#101318] border border-[#282E37] px-3 py-1.5 text-[#E8EBF0] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#282E37] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-1.5 bg-[#101318] border border-[#282E37] text-[#8993A1] hover:text-[#E8EBF0]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      modifyOrder(
                        selectedOrder.id,
                        [
                          {
                            productId: selectedOrder.items[0]?.productId || 'mat-murukku',
                            quantity: overrideQty,
                            unitPrice: overridePrice,
                          },
                        ],
                        priceOverrideReason
                      );
                      setOverrideModalOpen(false);
                      alert('Order quantities and prices updated with audit trail!');
                    } catch (err: any) {
                      alert(`Error: ${err.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] font-bold"
                >
                  Save Modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
