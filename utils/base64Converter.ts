/**
 * Converts a File object to a Base64 encoded string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the Base64 string, or rejects if an error occurs.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Extracts the base64 data part from a data URL string.
 * @param dataUrl The data URL string (e.g., "data:image/png;base64,...").
 * @returns The base64 data string, or an empty string if not found.
 */
export const extractBase64Data = (dataUrl: string): string => {
  const parts = dataUrl.split(';base64,');
  return parts.length > 1 ? parts[1] : '';
};
