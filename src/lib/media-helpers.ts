/**
 * Media Helpers Module
 * 
 * This is a custom "internal module." It stores shared logic that we use
 * across different pages of the app to keep things clean and organized.
 */

/** 
 * Converts a brand name into a URL-friendly "slug" 
 * Example: "CJC Eco Bag" -> "cjc-eco-bag"
 */
export function createSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

/** 
 * Formats large numbers into human-readable file sizes 
 * Useful for tracking storage usage in media production.
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generates a standard production reference code
 * Example: "VID-2023-001"
 */
export function generateReference(type: string, id: string): string {
  const year = new Date().getFullYear();
  const shortType = type.substring(0, 3).toUpperCase();
  const shortId = id.substring(0, 3).toUpperCase();
  return `${shortType}-${year}-${shortId}`;
}
