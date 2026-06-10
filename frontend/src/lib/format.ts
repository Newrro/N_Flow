export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '\u20B90';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonth(monthStr: string): string {
  // Input: "2026-01" or "January 2026"
  if (monthStr.includes('-')) {
    const [year, month] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  return monthStr;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
