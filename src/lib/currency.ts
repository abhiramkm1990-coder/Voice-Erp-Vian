export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromINR: number; // Conversion multiplier from INR base
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', rateFromINR: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar (USD)', rateFromINR: 1 / 83.5 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', rateFromINR: 1 / 91.0 },
};

/**
 * Formats a base INR amount into the target currency representation
 */
export function formatCurrency(amountInINR: number, currency: CurrencyCode = 'INR'): string {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const converted = amountInINR * config.rateFromINR;

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(converted);
  } else if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(converted);
  } else {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(converted);
  }
}
