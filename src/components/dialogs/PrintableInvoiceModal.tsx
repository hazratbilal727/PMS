import React from 'react';
import { Printer } from 'lucide-react';
import { formatCurrencyExact, formatDateTime } from '../../lib/utils';
import { usePMS } from '../../services/pmsStore';
import type { Sale } from '../../types';
import { Modal } from '../ui/Modal';

interface PrintableInvoiceModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({ sale, onClose }) => {
  const { settings } = usePMS();

  if (!sale) return null;

  return (
    <Modal
      open={Boolean(sale)}
      onClose={onClose}
      title={`Invoice ${sale.invoiceNumber}`}
      subtitle={`Issued ${formatDateTime(sale.date)}`}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </>
      }
    >
      <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-bold">{settings.pharmacyName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.address}, {settings.city}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tel: {settings.phone} · License: {settings.licenseNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">{sale.invoiceNumber}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(sale.date)}</p>
            <p className="mt-1 text-xs font-medium">
              {sale.paymentMethod} · {sale.paymentStatus}
            </p>
          </div>
        </div>

        {/* Customer & Cashier */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-400">Patient / Customer</p>
            <p className="font-semibold">{sale.customerName}</p>
            {sale.customerPhone && <p className="text-slate-500">{sale.customerPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-slate-400">Dispensed By</p>
            <p className="font-semibold">{sale.cashierName}</p>
            {sale.prescriptionId && <p className="text-teal-700 dark:text-teal-400">Linked Rx Verified</p>}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-y border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 font-medium">Item / Batch</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {sale.items.map((item, idx) => (
              <tr key={`${item.medicineId}-${idx}`}>
                <td className="py-2.5 pr-2">
                  <p className="font-medium">{item.medicineName}</p>
                  <p className="font-mono text-[11px] text-slate-400">Batch: {item.batchNumber}</p>
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatCurrencyExact(item.unitPrice, settings.currencySymbol)}
                </td>
                <td className="py-2.5 text-right font-mono font-medium tabular-nums">
                  {formatCurrencyExact(item.lineTotal, settings.currencySymbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">
              {formatCurrencyExact(sale.subtotal, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Discount</span>
            <span className="font-mono tabular-nums">
              -{formatCurrencyExact(sale.discountAmount, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Tax ({settings.defaultTaxPercent}%)</span>
            <span className="font-mono tabular-nums">
              {formatCurrencyExact(sale.taxAmount, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold dark:border-slate-800">
            <span>Grand Total</span>
            <span className="font-mono tabular-nums text-teal-700 dark:text-teal-400">
              {formatCurrencyExact(sale.grandTotal, settings.currencySymbol)}
            </span>
          </div>
        </div>

        <p className="border-t border-dashed border-slate-200 pt-3 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {settings.receiptFooterNote}
        </p>
      </div>
    </Modal>
  );
};
