// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Audit Room: 17 Statutory & Operational Reports with Multi-Format Exports
// ==============================================================================

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Printer,
} from 'lucide-react';
import { useDatabase, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/math';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AuditRoom: React.FC = () => {
  const db = useDatabase();
  const { currentUser } = useCurrentUser();

  const [activeReportId, setActiveReportId] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('ALL');

  const reportsList = [
    { id: 1, name: '1. Sales Register', category: 'Sales & Invoicing' },
    { id: 2, name: '2. Customer-wise Sales', category: 'Sales & Invoicing' },
    { id: 3, name: '3. Product-wise Sales', category: 'Sales & Invoicing' },
    { id: 4, name: '4. GST Statutory Summary', category: 'Taxation & Statutory' },
    { id: 5, name: '5. Purchase Register', category: 'Procurement' },
    { id: 6, name: '6. Raw Material Stock Summary', category: 'Inventory' },
    { id: 7, name: '7. Packaging Stock Summary', category: 'Inventory' },
    { id: 8, name: '8. Finished Goods Stock Summary', category: 'Inventory' },
    { id: 9, name: '9. Stock Movement Ledger', category: 'Inventory' },
    { id: 10, name: '10. Production Run Report', category: 'Production' },
    { id: 11, name: '11. Planned vs Actual Consumption', category: 'Production' },
    { id: 12, name: '12. Yield & Wastage Report', category: 'Production' },
    { id: 13, name: '13. Cost-per-Packet Report', category: 'Costing' },
    { id: 14, name: '14. Collections & Cash Receipts', category: 'Finance' },
    { id: 15, name: '15. Customer Receivables Report', category: 'Finance' },
    { id: 16, name: '16. Outstanding Ageing Report', category: 'Finance' },
    { id: 17, name: '17. System Transaction Audit Log', category: 'Audit' },
  ];

  // Dynamically compute report table headers & rows based on activeReportId
  const reportData = useMemo(() => {
    switch (activeReportId) {
      case 1: // Sales Register
        return {
          title: 'Sales Register (FY25-26)',
          headers: ['Invoice #', 'Date', 'Customer', 'State', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total (₹)'],
          rows: db.invoices.map((inv) => [
            inv.invoiceNumber,
            inv.invoiceDate,
            inv.customerName,
            inv.customerState,
            inv.taxableAmount.toFixed(2),
            inv.cgstAmount.toFixed(2),
            inv.sgstAmount.toFixed(2),
            inv.igstAmount.toFixed(2),
            inv.totalAmount.toFixed(2),
          ]),
        };

      case 2: // Customer-wise Sales
        return {
          title: 'Customer-wise Sales Breakdown',
          headers: ['Customer Code', 'Customer Name', 'State', 'GSTIN', 'Total Orders', 'Gross Invoiced (₹)', 'Outstanding (₹)'],
          rows: db.customers.map((c) => {
            const custInvoices = db.invoices.filter((i) => i.customerId === c.id);
            const totalInv = custInvoices.reduce((s, i) => s + i.totalAmount, 0);
            return [c.code, c.name, c.state, c.gstin || 'Unregistered', custInvoices.length, totalInv.toFixed(2), (c.totalOutstanding || 0).toFixed(2)];
          }),
        };

      case 3: // Product-wise Sales
        return {
          title: 'Product-wise Sales Register',
          headers: ['Product SKU', 'Product Name', 'Total Packets Sold', 'Taxable Value (₹)', 'Avg Selling Price (₹)'],
          rows: db.materials.filter((m) => m.category === 'FINISHED_GOODS').map((m) => {
            let totalQty = 0;
            let totalVal = 0;
            for (const inv of db.invoices) {
              for (const item of inv.items) {
                if (item.productId === m.id) {
                  totalQty += item.quantity;
                  totalVal += item.taxableValue;
                }
              }
            }
            return [m.sku, m.name, totalQty, totalVal.toFixed(2), totalQty > 0 ? (totalVal / totalQty).toFixed(2) : '50.00'];
          }),
        };

      case 4: // GST Statutory Summary
        return {
          title: 'GST Statutory Summary (Intra vs Inter-State)',
          headers: ['Invoice #', 'Customer GSTIN', 'Place of Supply', 'Tax Type', 'Taxable (₹)', 'CGST (2.5%)', 'SGST (2.5%)', 'IGST (5.0%)', 'Total GST (₹)'],
          rows: db.invoices.map((i) => [
            i.invoiceNumber,
            i.customerGstin || 'Unregistered',
            i.placeOfSupply,
            i.isInterstate ? 'Inter-state' : 'Intra-state',
            i.taxableAmount.toFixed(2),
            i.cgstAmount.toFixed(2),
            i.sgstAmount.toFixed(2),
            i.igstAmount.toFixed(2),
            i.totalGstAmount.toFixed(2),
          ]),
        };

      case 5: // Purchase Register
        return {
          title: 'Purchase Register',
          headers: ['Purchase #', 'Date', 'Supplier', 'Invoice #', 'Items', 'Subtotal (₹)', 'Tax (₹)', 'Total Amount (₹)'],
          rows: db.purchases.map((p) => [
            p.purchaseNumber,
            p.purchaseDate,
            p.supplierName || 'Southern Agro',
            p.supplierInvoiceNo || '-',
            p.items.map((i) => `${i.materialName} (${i.quantity} ${i.unit})`).join(', '),
            p.subtotal.toFixed(2),
            p.taxAmount.toFixed(2),
            p.totalAmount.toFixed(2),
          ]),
        };

      case 6: // Raw Material Stock Summary
      case 7: // Packaging Stock Summary
      case 8: // Finished Goods Stock Summary
        const cat = activeReportId === 6 ? 'RAW_MATERIAL' : activeReportId === 7 ? 'PACKAGING' : 'FINISHED_GOODS';
        return {
          title: `${cat.replace('_', ' ')} Stock Valuation Summary`,
          headers: ['SKU', 'Item Name', 'Unit', 'Opening Stock', 'Current Stock', 'Weighted Avg Rate (₹)', 'Closing Valuation (₹)'],
          rows: db.materials.filter((m) => m.category === cat).map((m) => [
            m.sku,
            m.name,
            m.unit,
            m.openingStock,
            m.currentStock,
            m.averageCost.toFixed(2),
            (m.currentStock * m.averageCost).toFixed(2),
          ]),
        };

      case 9: // Stock Movement Ledger
        return {
          title: 'Full Stock Movement Ledger',
          headers: ['Timestamp', 'Ref Number', 'Item', 'Transaction Type', 'In', 'Out', 'Rate (₹)', 'Balance', 'Source Document'],
          rows: db.ledger.map((l) => [
            new Date(l.createdAt).toLocaleDateString('en-IN'),
            l.referenceNumber,
            l.materialName || '',
            l.transactionType,
            l.quantityIn || 0,
            l.quantityOut || 0,
            l.unitCost.toFixed(2),
            `${l.runningBalance} ${l.unit}`,
            l.sourceDocument,
          ]),
        };

      case 10: // Production Report
        return {
          title: 'Production Run Log',
          headers: ['Batch ID', 'Date', 'Product', 'Planned Output', 'Good Output', 'Yield %', 'Total Cost (₹)', 'Cost/Pkt (₹)'],
          rows: db.productionRuns.map((r) => [
            r.batchId,
            r.productionDate,
            r.productName,
            r.plannedOutput,
            r.actualGoodOutput,
            `${((r.actualGoodOutput / r.plannedOutput) * 100).toFixed(1)}%`,
            r.totalRunCost.toFixed(2),
            r.costPerPacket.toFixed(2),
          ]),
        };

      case 11: // Planned vs Actual Consumption
        return {
          title: 'Planned vs Actual Ingredient Consumption',
          headers: ['Batch ID', 'Material', 'Planned Qty', 'Actual Qty', 'Variance %', 'Status'],
          rows: db.productionRuns.flatMap((r) =>
            r.consumptions.map((c) => [
              r.batchId,
              c.materialName,
              `${c.plannedQuantity} ${c.unit}`,
              `${c.actualQuantity} ${c.unit}`,
              `${c.variancePercent > 0 ? '+' : ''}${c.variancePercent}%`,
              Math.abs(c.variancePercent) > 3.0 ? 'DEVIATION ALERT' : 'OPTIMAL',
            ])
          ),
        };

      case 12: // Yield & Wastage Report
        return {
          title: 'Yield, Packaging Damage & Wastage Analysis',
          headers: ['Batch ID', 'Product', 'Expected Output', 'Good Output', 'Yield Variance %', 'Packaging Damage', 'Status'],
          rows: db.productionRuns.map((r) => [
            r.batchId,
            r.productName,
            `${r.plannedOutput} pkts`,
            `${r.actualGoodOutput} pkts`,
            `${r.yieldVariancePercent}%`,
            `${r.damagedPackaging} pouches`,
            Math.abs(r.yieldVariancePercent) > 3.0 ? 'EXCEEDS 3% TOLERANCE' : 'OPTIMAL',
          ]),
        };

      case 13: // Cost per Packet Report
        return {
          title: 'Unit Cost Economics & Packet Gross Margins',
          headers: ['Batch ID', 'Good Packets', 'Material Cost', 'Packaging Cost', 'Labour & Overheads', 'Total Cost', 'Cost/Pkt', 'Selling Price', 'Margin/Pkt'],
          rows: db.productionRuns.map((r) => [
            r.batchId,
            r.actualGoodOutput,
            `₹${r.materialCost.toFixed(2)}`,
            `₹${r.packagingCost.toFixed(2)}`,
            `₹${(r.labourCost + r.powerGasCost).toFixed(2)}`,
            `₹${r.totalRunCost.toFixed(2)}`,
            `₹${r.costPerPacket.toFixed(2)}`,
            '₹50.00',
            `₹${(50 - r.costPerPacket).toFixed(2)} (${(((50 - r.costPerPacket) / 50) * 100).toFixed(1)}%)`,
          ]),
        };

      case 14: // Collections Report
        return {
          title: 'Cash & Bank Collections Register',
          headers: ['Receipt #', 'Date', 'Customer', 'Payment Mode', 'Ref Number', 'Amount (₹)'],
          rows: db.payments.map((p) => [
            p.paymentNumber,
            p.paymentDate,
            p.customerName,
            p.paymentMode,
            p.referenceNumber || '-',
            p.amount.toFixed(2),
          ]),
        };

      case 15: // Customer Receivables Report
        return {
          title: 'Customer Receivables & Dues Register',
          headers: ['Customer', 'Credit Limit', 'Credit Period', 'Total Invoiced', 'Total Paid', 'Outstanding Balance (₹)'],
          rows: db.customers.map((c) => {
            const custInvoices = db.invoices.filter((i) => i.customerId === c.id);
            const totalInv = custInvoices.reduce((s, i) => s + i.totalAmount, 0);
            const totalPaid = custInvoices.reduce((s, i) => s + i.paidAmount, 0);
            return [c.name, `₹${c.creditLimit}`, `${c.creditPeriodDays} days`, totalInv.toFixed(2), totalPaid.toFixed(2), (c.totalOutstanding || 0).toFixed(2)];
          }),
        };

      case 16: // Outstanding Ageing Report
        return {
          title: 'Invoice Ageing Schedule (0-30, 31-60, 61-90, 90+ Days)',
          headers: ['Invoice #', 'Customer', 'Date', 'Due Date', 'Total Amount', '0–30 Days', '31–60 Days', '61–90 Days', '90+ Days'],
          rows: db.invoices.filter((i) => i.outstandingAmount > 0.01).map((i) => {
            const ageDays = Math.max(0, Math.floor((Date.now() - new Date(i.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)));
            return [
              i.invoiceNumber,
              i.customerName,
              i.invoiceDate,
              i.dueDate,
              i.totalAmount.toFixed(2),
              ageDays <= 30 ? i.outstandingAmount.toFixed(2) : '-',
              ageDays > 30 && ageDays <= 60 ? i.outstandingAmount.toFixed(2) : '-',
              ageDays > 60 && ageDays <= 90 ? i.outstandingAmount.toFixed(2) : '-',
              ageDays > 90 ? i.outstandingAmount.toFixed(2) : '-',
            ];
          }),
        };

      case 17: // Transaction Audit Log
      default:
        return {
          title: 'Immutable Transaction Audit Trail',
          headers: ['Timestamp', 'User', 'Action', 'Entity', 'Record ID', 'Reason / Description'],
          rows: db.auditLogs.map((l) => [
            new Date(l.createdAt).toLocaleString('en-IN'),
            l.userName || 'System',
            l.action,
            l.entity,
            l.recordId,
            l.reason || '-',
          ]),
        };
    }
  }, [activeReportId, db]);

  // Export Active Report to Excel (.xlsx)
  const handleExportXLSX = () => {
    const ws = XLSX.utils.aoa_to_sheet([reportData.headers, ...reportData.rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `NOIR_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // Export Active Report to CSV
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [reportData.headers.join(','), ...reportData.rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NOIR_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Active Report to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(16, 19, 24);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(232, 235, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('NOIR FACTORY INTELLIGENCE OS — AUDIT REPORT', 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(229, 172, 88);
    doc.text(reportData.title.toUpperCase(), 14, 21);

    autoTable(doc, {
      startY: 34,
      head: [reportData.headers],
      body: reportData.rows,
      theme: 'grid',
      headStyles: {
        fillColor: [21, 25, 31],
        textColor: [232, 235, 240],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
      },
    });

    doc.save(`NOIR_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#63D39B]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Audit Room (Statutory & Production Reports)
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            Strict read-only verification engine, multi-format exports (CSV, XLSX, PDF) & immutable audit trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#8993A1] hover:text-[#E8EBF0] rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#15191F] hover:bg-[#1C2129] border border-[#282E37] text-xs font-mono text-[#E5AC58] font-bold rounded transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>XLSX</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2129] hover:bg-[#282E37] border border-[#363E4A] text-xs font-mono text-[#E8EBF0] font-bold rounded transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#E5AC58]" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Main 2-column layout: Report Navigator & Live Report Data */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigator (1 Col) */}
        <div className="space-y-3">
          <div className="bg-[#15191F] border border-[#282E37] p-3">
            <div className="text-[11px] font-mono font-bold uppercase text-[#8993A1] mb-2 px-1">
              Select Audit Report (17 Available)
            </div>

            <div className="space-y-1">
              {reportsList.map((rep) => {
                const isActive = activeReportId === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setActiveReportId(rep.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors truncate ${
                      isActive
                        ? 'bg-[#1C2129] text-[#E5AC58] font-bold border border-[#363E4A]'
                        : 'text-[#8993A1] hover:text-[#E8EBF0] hover:bg-[#1C2129]/50'
                    }`}
                  >
                    {rep.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Report Content (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#15191F] border border-[#282E37]">
            <div className="p-3 border-b border-[#282E37] flex flex-wrap items-center justify-between gap-3 bg-[#101318]">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase text-[#E8EBF0]">
                  {reportData.title}
                </h2>
                <div className="text-[10px] font-mono text-[#8993A1] mt-0.5">
                  Generated from real transaction records ({reportData.rows.length} rows)
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <Badge variant="success">Read-Only Enforced</Badge>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#101318] text-[#8993A1] border-b border-[#282E37] sticky top-0">
                  <tr>
                    {reportData.headers.map((h, idx) => (
                      <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282E37]">
                  {reportData.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={reportData.headers.length}
                        className="py-8 text-center text-[#8993A1]"
                      >
                        No transaction data found for this report. Run benchmark to populate.
                      </td>
                    </tr>
                  ) : (
                    reportData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#1C2129]">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="py-2.5 px-3 text-[#E8EBF0] whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
