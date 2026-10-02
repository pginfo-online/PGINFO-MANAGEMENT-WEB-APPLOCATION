/**
 * whatsappHelper.ts — WhatsApp message templates, phone number normalization, and deep link sharing.
 */

export function sanitizeE164Phone(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return digits;
}

export const WHATSAPP_TEMPLATES = {
  rent_reminder:
    'Hello {name}, this is a friendly reminder that your rent of ₹{amount} for Room {room} at {pgName} is due on {dueDate}. Please make the payment on or before the due date. Thank you, {pgName} — Management Team.{paymentLinkSection}',

  rent_overdue:
    'Hello {name} 👋 Your rent payment of ₹{amount} for Room {room} at {pgName} was due on {dueDate} and is now overdue by {daysOverdue} days. Please clear the pending dues immediately to avoid late fees. Regards, {pgName} — Management Team.{paymentLinkSection}',

  payment_confirmation:
    'Hello {name}, we have received your payment of ₹{amount} for Room {room} at {pgName} via {method} on {date}. Receipt No: {receiptNo}. Thank you for your timely payment! — {pgName} Management Team.',
};

export interface WhatsAppMessageData {
  name?: string;
  tenantName?: string;
  amount?: number | string;
  room?: string;
  roomNumber?: string;
  pgName?: string;
  dueDate?: string;
  daysOverdue?: number | string;
  isOverdue?: boolean;
  method?: string;
  date?: string;
  receiptNo?: string;
  paymentUrl?: string | null;
}

export function buildWhatsAppMessage(
  templateKey: keyof typeof WHATSAPP_TEMPLATES = 'rent_reminder',
  data: WhatsAppMessageData = {}
): string {
  const template = WHATSAPP_TEMPLATES[templateKey] || WHATSAPP_TEMPLATES.rent_reminder;
  const paymentLinkSection = data.paymentUrl ? `\n\nPay online instantly: ${data.paymentUrl}` : '';

  const replacements: Record<string, string> = {
    '{name}': data.name || data.tenantName || 'Resident',
    '{amount}': data.amount ? Number(data.amount).toLocaleString('en-IN') : '0',
    '{room}': data.room || data.roomNumber || 'N/A',
    '{pgName}': data.pgName || 'PG',
    '{dueDate}': data.dueDate || 'due date',
    '{daysOverdue}': data.daysOverdue !== undefined ? String(data.daysOverdue) : '1',
    '{method}': data.method || 'Online',
    '{date}': data.date || new Date().toLocaleDateString('en-IN'),
    '{receiptNo}': data.receiptNo || 'RCP-PAID',
    '{paymentLinkSection}': paymentLinkSection,
    '{paymentUrl}': data.paymentUrl || '',
  };

  let message = template;
  Object.keys(replacements).forEach((key) => {
    message = message.split(key).join(replacements[key]);
  });

  return message.trim();
}

/**
 * Opens WhatsApp Web or native app with pre-filled message.
 */
export function openWhatsAppShare(phone: string | undefined | null, message: string): boolean {
  const cleanPhone = sanitizeE164Phone(phone);
  const encodedText = encodeURIComponent(message);

  let url: string;
  if (cleanPhone) {
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}

/**
 * Copies text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
