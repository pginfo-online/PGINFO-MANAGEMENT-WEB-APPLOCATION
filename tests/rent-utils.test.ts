import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getReceiptPreviewUrl, getReceiptDownloadUrl } from '../src/features/rent/utils/receiptHelper';
import { sanitizeE164Phone, buildWhatsAppMessage } from '../src/features/rent/utils/whatsappHelper';

describe('Rent Utilities', () => {
  describe('receiptHelper', () => {
    it('returns null for empty or null url', () => {
      assert.strictEqual(getReceiptPreviewUrl(null), null);
      assert.strictEqual(getReceiptPreviewUrl(''), null);
      assert.strictEqual(getReceiptDownloadUrl(null), null);
    });

    it('converts Cloudinary .pdf to .png to bypass 401 ACL deny', () => {
      const rawPdf = 'https://res.cloudinary.com/demo/image/upload/v12345/receipt_123.pdf';
      const preview = getReceiptPreviewUrl(rawPdf);
      assert.strictEqual(preview, 'https://res.cloudinary.com/demo/image/upload/v12345/receipt_123.png');
    });

    it('injects fl_attachment into Cloudinary download URL', () => {
      const rawPdf = 'https://res.cloudinary.com/demo/image/upload/v12345/receipt_123.pdf';
      const download = getReceiptDownloadUrl(rawPdf, 'RCP-2026-001');
      assert.ok(download?.includes('fl_attachment:RCP-2026-001'));
      assert.ok(download?.endsWith('.png'));
    });

  });

  describe('whatsappHelper', () => {
    it('sanitizes Indian mobile numbers to 91XXXXXXXXXX', () => {
      assert.strictEqual(sanitizeE164Phone('9876543210'), '919876543210');
      assert.strictEqual(sanitizeE164Phone('+91 98765-43210'), '919876543210');
      assert.strictEqual(sanitizeE164Phone('09876543210'), '919876543210');
    });

    it('builds formatted reminder with payment link', () => {
      const msg = buildWhatsAppMessage('rent_reminder', {
        name: 'Rahul Sharma',
        amount: 8500,
        room: '101',
        pgName: 'Sunrise PG',
        dueDate: '05 Aug 2026',
        paymentUrl: 'https://rzp.io/i/test123',
      });

      assert.ok(msg.includes('Rahul Sharma'));
      assert.ok(msg.includes('8,500'));
      assert.ok(msg.includes('Room 101'));
      assert.ok(msg.includes('Sunrise PG'));
      assert.ok(msg.includes('05 Aug 2026'));
      assert.ok(msg.includes('https://rzp.io/i/test123'));
    });
  });
});
