import { REFERENCE_TODAY } from './constants';

export function formatCurrency(amount: number, symbol = 'Rs.'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol} ${safe.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrencyExact(amount: number, symbol = 'Rs.'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol} ${safe.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntilExpiry(expiryDate: string, referenceDate = REFERENCE_TODAY): number {
  const exp = new Date(expiryDate);
  const ref = new Date(referenceDate);
  const diffMs = exp.getTime() - ref.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDate: string): {
  label: 'Expired' | 'Critical (< 30d)' | 'Expiring (< 90d)' | 'Valid';
  daysLeft: number;
  severity: 'critical' | 'warning' | 'caution' | 'ok';
} {
  const daysLeft = daysUntilExpiry(expiryDate);
  if (daysLeft <= 0) {
    return { label: 'Expired', daysLeft, severity: 'critical' };
  }
  if (daysLeft <= 30) {
    return { label: 'Critical (< 30d)', daysLeft, severity: 'warning' };
  }
  if (daysLeft <= 90) {
    return { label: 'Expiring (< 90d)', daysLeft, severity: 'caution' };
  }
  return { label: 'Valid', daysLeft, severity: 'ok' };
}

export function getStockStatus(quantity: number, minLevel: number): {
  label: 'Out of Stock' | 'Low Stock' | 'In Stock';
  severity: 'critical' | 'warning' | 'ok';
} {
  if (quantity <= 0) return { label: 'Out of Stock', severity: 'critical' };
  if (quantity <= minLevel) return { label: 'Low Stock', severity: 'warning' };
  return { label: 'In Stock', severity: 'ok' };
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean)[][]): void {
  const escape = (cell: string | number | boolean) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
