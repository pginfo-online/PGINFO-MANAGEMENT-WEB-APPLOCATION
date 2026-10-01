import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, formatDate, formatPhone, getStatusVariant } from '../src/lib/utils';

describe('Utility Functions', () => {
  describe('formatINR', () => {
    it('formats positive integers to INR currency string', () => {
      const result = formatINR(8500);
      assert.ok(result.includes('8,500'));
      assert.ok(result.includes('₹'));
    });

    it('handles zero gracefully', () => {
      const result = formatINR(0);
      assert.strictEqual(result, '₹0');
    });

    it('handles null and undefined', () => {
      assert.strictEqual(formatINR(null), '₹0');
      assert.strictEqual(formatINR(undefined), '₹0');
    });
  });

  describe('formatPhone', () => {
    it('formats a 10-digit phone number with +91 country prefix', () => {
      assert.strictEqual(formatPhone('9876543210'), '+91 98765 43210');
    });

    it('formats numbers with non-digit characters', () => {
      assert.strictEqual(formatPhone('98765-43210'), '+91 98765 43210');
    });

    it('handles null and undefined', () => {
      assert.strictEqual(formatPhone(null), '—');
      assert.strictEqual(formatPhone(undefined), '—');
    });
  });

  describe('getStatusVariant', () => {
    it('returns emerald variant for paid and active', () => {
      const active = getStatusVariant('active');
      assert.ok(active.bg.includes('emerald'));
      const paid = getStatusVariant('paid');
      assert.ok(paid.bg.includes('emerald'));
    });

    it('returns amber variant for pending and notice', () => {
      const pending = getStatusVariant('pending');
      assert.ok(pending.bg.includes('amber'));
      const notice = getStatusVariant('notice');
      assert.ok(notice.bg.includes('amber'));
    });

    it('returns rose variant for overdue and terminated', () => {
      const overdue = getStatusVariant('overdue');
      assert.ok(overdue.bg.includes('rose'));
      const terminated = getStatusVariant('terminated');
      assert.ok(terminated.bg.includes('rose'));
    });
  });

  describe('formatDate', () => {
    it('formats standard ISO date string', () => {
      const formatted = formatDate('2026-10-15T12:00:00.000Z', 'yyyy-MM-dd');
      assert.strictEqual(formatted, '2026-10-15');
    });

    it('returns fallback dash for invalid or null dates', () => {
      assert.strictEqual(formatDate(null), '—');
      assert.strictEqual(formatDate(undefined), '—');
      assert.strictEqual(formatDate('invalid-date'), '—');
    });
  });
});
