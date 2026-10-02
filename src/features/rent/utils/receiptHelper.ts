/**
 * receiptHelper.ts — Web receipt URL normalization, previewing, and reliable download handling.
 *
 * Solves:
 * 1. Cloudinary PDF delivery ACL restrictions: Cloudinary denies direct .pdf delivery with
 *    401 deny / ACL failure on default accounts, but serves a high-resolution crisp image
 *    via .png transformation at HTTP 200.
 * 2. Attachment forcing: injects `fl_attachment:<receiptNumber>` into Cloudinary URLs so
 *    browsers automatically trigger file download instead of navigating away.
 * 3. Relative URL and localhost resolving against API URL.
 * 4. Cross-browser client-side download trigger with fallback.
 */

import { env } from '@/config/env';

export function getServerOrigin(): string {
  const base = env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
  try {
    const urlObj = new URL(base);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return base.split('/api')[0] || 'http://localhost:5001';
  }
}

/**
 * Normalizes any receipt URL to be previewable in the web browser.
 * - Resolves relative paths
 * - Converts Cloudinary .pdf to .png to bypass 401 ACL deny
 */
export function getReceiptPreviewUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();
  if (!url) return null;

  const serverOrigin = getServerOrigin();

  // If relative path like "/uploads/..." or "/api/..."
  if (url.startsWith('/')) {
    url = `${serverOrigin}${url}`;
  }

  // If localhost, ensure protocol and port match current origin if running remotely
  if (typeof window !== 'undefined' && (url.includes('://localhost') || url.includes('://127.0.0.1'))) {
    // Keep local if already on localhost
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, serverOrigin);
    }
  }

  // If Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    // Cloudinary blocks direct .pdf delivery with 401 ACL failure by default.
    // Changing .pdf extension to .png serves a crisp high-res render at HTTP 200.
    if (/\.pdf(\?.*)?$/i.test(url)) {
      url = url.replace(/\.pdf(\?.*)?$/i, '.png$1');
    }
  }

  return url;
}

/**
 * Generates a direct downloadable URL for the receipt.
 * Adds `fl_attachment:<filename>` if Cloudinary so the browser automatically downloads the file.
 */
export function getReceiptDownloadUrl(rawUrl?: string | null, receiptNumber: string = 'Receipt'): string | null {
  const previewUrl = getReceiptPreviewUrl(rawUrl);
  if (!previewUrl) return null;

  let url = previewUrl;

  if (url.includes('res.cloudinary.com')) {
    const cleanNumber = String(receiptNumber).replace(/[^a-zA-Z0-9_-]/g, '_');
    const attachmentTag = `fl_attachment:${cleanNumber}`;

    if (!url.includes('fl_attachment') && url.includes('/upload/')) {
      url = url.replace('/upload/', `/upload/${attachmentTag}/`);
    }
  }

  return url;
}

/**
 * Downloads a receipt file directly in the browser.
 * Uses programmatic anchor click with fallback to window.open.
 */
export async function downloadReceipt(rawUrl?: string | null, receiptNumber: string = 'Receipt'): Promise<boolean> {
  const downloadUrl = getReceiptDownloadUrl(rawUrl, receiptNumber);
  if (!downloadUrl) return false;

  try {
    const filename = `${receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;

    // Try fetching as blob to force download with clean filename
    const response = await fetch(downloadUrl, { mode: 'cors' }).catch(() => null);
    if (response && response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      return true;
    }

    // Fallback: direct anchor download trigger
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Download error:', err);
    // Ultimate fallback: open in new tab
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
}
