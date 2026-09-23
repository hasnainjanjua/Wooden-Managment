export function formatPKR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}

export function formatNumber(amount: number): string {
  return (amount || 0).toLocaleString('en-PK');
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
