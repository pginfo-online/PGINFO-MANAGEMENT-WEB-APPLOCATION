import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  formatDate,
  formatPhone,
  getStatusVariant,
  getDaysOverdue,
  formatMonthYear,
} from '../src/lib/utils';

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

  describe('getDaysOverdue', () => {
    it('returns 0 for null or future dates', () => {
      assert.strictEqual(getDaysOverdue(null), 0);
      assert.strictEqual(getDaysOverdue(undefined), 0);
      const future = new Date(Date.now() + 86400000 * 5).toISOString();
      assert.strictEqual(getDaysOverdue(future), 0);
    });

    it('returns positive days for past dates', () => {
      const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toISOString();
      const days = getDaysOverdue(threeDaysAgo);
      assert.ok(days >= 2 && days <= 4);
    });
  });

  describe('formatMonthYear', () => {
    it('formats month and year nicely', () => {
      assert.strictEqual(formatMonthYear(8, 2026), 'Aug 2026');
      assert.strictEqual(formatMonthYear(10, 2026), 'Oct 2026');
    });
  });
});
