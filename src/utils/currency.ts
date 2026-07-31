export type Currency = 'USD' | 'EUR' | 'INR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  INR: '₹',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  INR: 'Indian Rupee',
};

export const getCurrency = (): Currency => {
  return 'INR';
};

export const setCurrency = (currency: Currency) => {
  localStorage.setItem('currency', currency);
};

export const formatCurrency = (amount: number, currency?: Currency): string => {
  const curr = currency || getCurrency();
  const symbol = CURRENCY_SYMBOLS[curr];
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (curr === 'EUR') {
    return `${formatted}${symbol}`;
  }
  return `${symbol}${formatted}`;
};
