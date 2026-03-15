/**
 * Formats a number as a Brazilian Real (BRL) currency string.
 * @param value The number to format.
 * @returns A string representing the formatted currency.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};