/** Format minor units without clamping — negatives stay visible (TL). */
export function formatMoney(balanceCents: number, currency: string): string {
  const value = balanceCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
    }).format(value);
  } catch {
    const sign = value < 0 ? '-' : '';
    return `${sign}${currency} ${Math.abs(value).toFixed(2)}`;
  }
}
