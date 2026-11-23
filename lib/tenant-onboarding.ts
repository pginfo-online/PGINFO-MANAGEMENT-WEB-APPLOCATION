export const rentFrequencies = [1, 3, 6, 10, 11, 12] as const;
export const maxPaise = 2_147_483_647;

export function toPaise(value: string) {
  const [whole, fraction = ""] = value.trim().split(".");
  if (!/^\d*(?:\.\d{1,2})?$/.test(value.trim()) || !value.trim()) return NaN;
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount <= maxPaise ? amount : NaN;
}

export function openingRentDueDate(start: string, dueDay: number) {
  if (!start || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) return "";
  const day = Math.max(Number(start.slice(8, 10)), dueDay);
  return `${start.slice(0, 8)}${String(day).padStart(2, "0")}`;
}

export function addCalendarMonths(start: string, months: number) {
  const date = new Date(start);
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.toISOString().slice(0, 10);
}
