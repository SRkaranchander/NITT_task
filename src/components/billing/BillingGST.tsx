// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Billing & GST Invoices with PDF Generation & Financial Year Numbering
// ==============================================================================

import React, { useState } from 'react';
import {
  Receipt,
  Download,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
} from 'lucide-react';
import { useDatabase, useSales, useCurrentUser } from '../../services/db/useDatabase';
import { Badge } from '../common/Badge';
import { formatINR, numberToIndianWords } from '../../utils/math';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingGSTProps {
  onNavigate?: (tabId: string, referenceId?: string) => void;
}

export const BillingGST: React.FC<BillingGSTProps> = () => {
  const { invoices } = useSales();
  const { currentUser } = useCurrentUser();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];

  // Professional PDF Invoice Generation using jsPDF
  const handleDownloadPDF = (inv: typeof selectedInvoice) => {
    if (!inv) return;

    const doc = new jsPDF();

    // Dark Header Bar
    doc.setFillColor(16, 19, 24); // #101318
    doc.rect(0, 0, 210, 38, 'F');

    // Title & Brand
    doc.setTextColor(232, 235, 240); // #E8EBF0
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NOIR SNACKS MANUFACTURING', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(229, 172, 88); // #E5AC58
    doc.text('FACTORY INTELLIGENCE OS • TAX INVOICE', 14, 22);

    doc.setTextColor(137, 147, 161); // #8993A1
    doc.text('SIDCO Industrial Estate, Tiruchirappalli, Tamil Nadu 620015', 14, 28);
    doc.text('GSTIN: 33AAAAA0000A1Z5 | State: Tamil Nadu (Code: 33)', 14, 33);

    // Invoice Meta Right-aligned
    doc.setTextColor(232, 235, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(inv.invoiceNumber, 196, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(137, 147, 161);
    doc.text(`Date: ${inv.invoiceDate}`, 196, 22, { align: 'right' });
    doc.text(`Due Date: ${inv.dueDate}`, 196, 28, { align: 'right' });
    doc.text(`Order Ref: ${inv.orderNumber || '-'}`, 196, 33, { align: 'right' });

    // Customer Billing Box
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 44, 182, 26, 'F');
    doc.setDrawColor(200, 205, 212);
    doc.rect(14, 44, 182, 26, 'D');

    doc.setTextColor(30, 35, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BILL TO / RECIPIENT:', 18, 51);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(inv.customerName, 18, 57);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(inv.customerAddress, 18, 62);
    doc.text(`Place of Supply: ${inv.placeOfSupply} | Customer GSTIN: ${inv.customerGstin || 'Unregistered'}`, 18, 66);

    // Item Table
    const tableBody = inv.items.map((item, idx) => [
      idx + 1,
      item.productName,
      item.hsnCode,
      `${item.quantity} ${item.unit}`,
      `Rs. ${item.rate.toFixed(2)}`,
      `Rs. ${item.taxableValue.toFixed(2)}`,
      inv.isInterstate
        ? `Rs. ${item.igstAmount.toFixed(2)} (${item.igstRate}%)`
        : `Rs. ${item.cgstAmount.toFixed(2)} (2.5%) + Rs. ${item.sgstAmount.toFixed(2)} (2.5%)`,
      `Rs. ${item.totalItemAmount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 75,
      head: [
        [
          '#',
          'Item Description',
          'HSN',
          'Qty',
          'Rate',
          'Taxable Value',
          inv.isInterstate ? 'IGST (5%)' : 'CGST + SGST (5%)',
          'Total Amount',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 19, 24],
        textColor: [232, 235, 240],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 46 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
      },
    });

    // Summary Box
    const finalY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 95);
    doc.text('Taxable Amount:', 130, finalY);
    doc.text(`Rs. ${inv.taxableAmount.toFixed(2)}`, 196, finalY, { align: 'right' });

    if (inv.isInterstate) {
      doc.text('IGST (5.0%):', 130, finalY + 5);
      doc.text(`Rs. ${inv.igstAmount.toFixed(2)}`, 196, finalY + 5, { align: 'right' });
    } else {
      doc.text('CGST (2.5%):', 130, finalY + 5);
      doc.text(`Rs. ${inv.cgstAmount.toFixed(2)}`, 196, finalY + 5, { align: 'right' });

      doc.text('SGST (2.5%):', 130, finalY + 10);
      doc.text(`Rs. ${inv.sgstAmount.toFixed(2)}`, 196, finalY + 10, { align: 'right' });
    }

    doc.setDrawColor(200, 205, 212);
    doc.line(130, finalY + 13, 196, finalY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(16, 19, 24);
    doc.text('Invoice Total:', 130, finalY + 18);
    doc.text(`Rs. ${inv.totalAmount.toFixed(2)}`, 196, finalY + 18, { align: 'right' });

    // Amount in Words
    const words = numberToIndianWords(inv.totalAmount);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 95);
    doc.text(`Amount in Words: ${words}`, 14, finalY + 28);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 135, 145);
    doc.text('This is an electronically generated and cryptographically tracked invoice under NOIR Factory OS.', 14, 280);

    doc.save(`${inv.invoiceNumber}_NOIR_INVOICE.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E5AC58]" />
            <h1 className="text-lg font-bold font-mono text-[#E8EBF0] uppercase tracking-wider">
              Billing & GST Invoices
            </h1>
          </div>
          <p className="text-xs text-[#8993A1] mt-0.5">
            FY25-26 statutory GST invoices, intra-state CGST/SGST vs inter-state IGST, and PDF generation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List (1 Col) */}
        <div className="space-y-4">
          <div className="bg-[#15191F] border border-[#282E37]">
            <div className="p-3 border-b border-[#282E37] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EBF0]">
                Issued Invoices ({invoices.length})
              </span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#8993A1]">
                No GST invoices generated yet. Approve an order in Sales to create one.
              </div>
            ) : (
              <div className="divide-y divide-[#282E37]">
                {invoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#1C2129] border-l-2 border-l-[#E5AC58]'
                          : 'hover:bg-[#1C2129]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-[#E8EBF0]">
                          {inv.invoiceNumber}
                        </span>
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'blue'}>
                          {inv.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#E8EBF0] font-medium truncate">
                        {inv.customerName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#8993A1] mt-1">
                        <span>{inv.invoiceDate}</span>
                        <span className="text-[#E5AC58] font-bold">
                          ₹{formatINR(inv.totalAmount, false)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Invoice Full Preview (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedInvoice ? (
            <div className="bg-[#15191F] border border-[#282E37] p-5 space-y-5">
              {/* Top Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E37] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-[#E8EBF0]">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <Badge variant={selectedInvoice.isInterstate ? 'blue' : 'success'}>
                    {selectedInvoice.isInterstate ? 'INTER-STATE (IGST 5%)' : 'INTRA-STATE (CGST 2.5% + SGST 2.5%)'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5AC58] hover:bg-[#F0B969] text-[#0B0D10] text-xs font-mono font-bold rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Invoice</span>
                  </button>
                </div>
              </div>

              {/* Invoice Printable Preview Container */}
              <div className="p-4 bg-[#101318] border border-[#282E37] space-y-4 font-mono text-xs">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#282E37]">
                  <div>
                    <div className="text-sm font-bold text-[#E8EBF0]">
                      NOIR SNACKS MANUFACTURING
                    </div>
                    <div className="text-[#8993A1] text-[11px] mt-0.5">
                      SIDCO Industrial Estate, Tiruchirappalli, Tamil Nadu
                    </div>
                    <div className="text-[#8993A1] text-[11px]">
                      GSTIN: <span className="text-[#E8EBF0]">33AAAAA0000A1Z5</span> (State Code: 33)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#8993A1]">Tax Invoice #:</div>
                    <div className="text-sm font-bold text-[#E5AC58]">
                      {selectedInvoice.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-[#8993A1] mt-0.5">
                      Date: {selectedInvoice.invoiceDate} • FY: {selectedInvoice.financialYear}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="p-3 bg-[#15191F] border border-[#282E37]">
                  <div className="text-[10px] uppercase text-[#8993A1] font-bold mb-1">
                    Bill To Customer:
                  </div>
                  <div className="text-xs font-bold text-[#E8EBF0]">
                    {selectedInvoice.customerName}
                  </div>
                  <div className="text-[#8993A1] text-[11px]">
                    {selectedInvoice.customerAddress}
                  </div>
                  <div className="text-[#8993A1] text-[11px]">
                    GSTIN: <span className="text-[#E8EBF0]">{selectedInvoice.customerGstin || 'Unregistered'}</span> • Place of Supply:{' '}
                    <span className="text-[#E5AC58]">{selectedInvoice.placeOfSupply}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#15191F] text-[#8993A1] border-b border-[#282E37]">
                      <tr>
                        <th className="py-2 px-2">Item</th>
                        <th className="py-2 px-2">HSN</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-right">Rate</th>
                        <th className="py-2 px-2 text-right">Taxable</th>
                        <th className="py-2 px-2 text-right">
                          {selectedInvoice.isInterstate ? 'IGST (5%)' : 'CGST (2.5%) + SGST (2.5%)'}
                        </th>
                        <th className="py-2 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282E37]">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-2 font-semibold text-[#E8EBF0]">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-2 text-[#8993A1]">{item.hsnCode}</td>
                          <td className="py-2.5 px-2 text-right text-[#E8EBF0]">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2.5 px-2 text-right text-[#8993A1]">
                            ₹{item.rate.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-[#E8EBF0]">
                            ₹{formatINR(item.taxableValue, false)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-[#E5AC58]">
                            {selectedInvoice.isInterstate
                              ? `₹${formatINR(item.igstAmount, false)}`
                              : `₹${formatINR(item.cgstAmount, false)} + ₹${formatINR(item.sgstAmount, false)}`}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-[#E8EBF0]">
                            ₹{formatINR(item.totalItemAmount, false)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Tax Breakup */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 space-y-1.5 p-3 bg-[#15191F] border border-[#282E37] text-xs">
                    <div className="flex justify-between text-[#8993A1]">
                      <span>Taxable Value:</span>
                      <span className="text-[#E8EBF0]">₹{formatINR(selectedInvoice.taxableAmount, false)}</span>
                    </div>

                    {!selectedInvoice.isInterstate ? (
                      <>
                        <div className="flex justify-between text-[#8993A1]">
                          <span>CGST (2.5%):</span>
                          <span className="text-[#E5AC58]">₹{formatINR(selectedInvoice.cgstAmount, false)}</span>
                        </div>
                        <div className="flex justify-between text-[#8993A1]">
                          <span>SGST (2.5%):</span>
                          <span className="text-[#E5AC58]">₹{formatINR(selectedInvoice.sgstAmount, false)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[#8993A1]">
                        <span>IGST (5.0%):</span>
                        <span className="text-[#E5AC58]">₹{formatINR(selectedInvoice.igstAmount, false)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#282E37] flex justify-between font-bold text-sm">
                      <span className="text-[#E8EBF0]">Total Due:</span>
                      <span className="text-[#E5AC58]">₹{formatINR(selectedInvoice.totalAmount, false)}</span>
                    </div>

                    <div className="pt-1 border-t border-[#282E37] flex justify-between text-[11px]">
                      <span className="text-[#8993A1]">Paid Amount:</span>
                      <span className="text-[#63D39B]">₹{formatINR(selectedInvoice.paidAmount, false)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-[#8993A1]">Outstanding:</span>
                      <span className="text-[#F0B44D]">₹{formatINR(selectedInvoice.outstandingAmount, false)}</span>
                    </div>
                  </div>
                </div>

                {/* Amount in words */}
                <div className="p-2.5 bg-[#15191F] border border-[#282E37] text-[11px] text-[#8993A1]">
                  Amount in Words: <span className="text-[#E8EBF0] font-semibold">{numberToIndianWords(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
