import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats paise into an Indian Rupee string.
 * Example: 3251600 -> "₹32,516" or compact "₹32.52K"
 */
export function formatINR(paise: number | null | undefined, compact = false): string {
  if (paise === null || paise === undefined || isNaN(paise)) return "₹0";
  const rupees = paise / 100;

  if (compact && Math.abs(rupees) >= 1000) {
    if (Math.abs(rupees) >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)}Cr`;
    }
    if (Math.abs(rupees) >= 100000) {
      return `₹${(rupees / 100000).toFixed(2)}L`;
    }
    return `₹${(rupees / 1000).toFixed(2)}K`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Formats ISO date to readable string like "21 Sep 2027"
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

/**
 * Formats ISO date to "DD MMM YYYY, hh:mm A"
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export interface NormalizedError {
  status?: number;
  message: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function normalizeError(error: any): NormalizedError {
  if (!error) return { message: "An unexpected error occurred" };
  if (error.response?.data) {
    const data = error.response.data;
    return {
      status: error.response.status,
      message: data.title || data.message || "Request failed",
      detail: data.detail,
      errors: data.errors,
    };
  }
  if (error.message) {
    return { message: error.message };
  }
  return { message: String(error) };
}
