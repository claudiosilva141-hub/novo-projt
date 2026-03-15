/**
 * Formats a Date object or ISO string into a localized date and time string.
 * @param dateInput The Date object or ISO string to format.
 * @returns A string representing the formatted date and time.
 */
export const formatDateTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formats a Date object or ISO string into a localized short date string.
 * @param dateInput The Date object or ISO string to format.
 * @returns A string representing the formatted date.
 */
export const formatDateShort = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
