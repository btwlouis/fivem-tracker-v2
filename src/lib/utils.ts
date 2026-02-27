import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const colorMap: { [key: string]: string } = {
  "^0": "#FFFFF0", // White
  "^1": "#F44336", // Red
  "^2": "#4CAF50", // Green
  "^3": "#FFEB3B", // Yellow
  "^4": "#42A5F5", // Blue
  "^5": "#03A9F4", // Light blue
  "^6": "#9C27B0", // Purple
  "^7": "#FFFFF0", // White
  "^8": "#FF5722", // Orange
  "^9": "#9E9E9E", // Grey
};

export function stripFivemFormatting(value?: string | null) {
  return (value || "").replace(/\^\d/g, "").replace(/\s+/g, " ").trim();
}

export function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function formatRelativeDate(value?: Date | string | null) {
  if (!value) {
    return "unknown";
  }

  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();

  if (diff < 60 * 60 * 1000) {
    return "less than 1 hour ago";
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function parseServerTags(value?: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[,\s]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

export function parseStoredJson<T>(value?: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
