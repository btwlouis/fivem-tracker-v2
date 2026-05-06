import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const colorMap: Record<string, string> = {
  "^0": "#FFFFF0",
  "^1": "#F44336",
  "^2": "#4CAF50",
  "^3": "#FFEB3B",
  "^4": "#42A5F5",
  "^5": "#03A9F4",
  "^6": "#9C27B0",
  "^7": "#FFFFF0",
  "^8": "#FF5722",
  "^9": "#9E9E9E",
}

export function stripFivemFormatting(value?: string | null) {
  return (value || "").replace(/\^\d/g, "").replace(/\s+/g, " ").trim()
}

export function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0)
}

export function formatRelativeDate(value?: Date | string | null) {
  if (!value) {
    return "unknown"
  }

  const date = value instanceof Date ? value : new Date(value)
  const diff = Date.now() - date.getTime()

  if (diff < 60 * 60 * 1000) {
    return "less than 1 hour ago"
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days} ${days === 1 ? "day" : "days"} ago`
}

export function parseServerTags(value?: string | null): string[] {
  if (!value) {
    return []
  }

  const parsed = parseNestedJson(value)

  if (Array.isArray(parsed)) {
    return Array.from(
      new Set(parsed.map((tag) => String(tag).trim()).filter(Boolean))
    ).slice(0, 12)
  }

  if (typeof parsed === "string" && parsed.trim() && parsed.trim() !== value.trim()) {
    return parseServerTags(parsed)
  }

  return Array.from(
    new Set(
      value
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((entry) => entry.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, ""))
        .filter(Boolean)
    )
  ).slice(0, 12)
}

export function parseStoredJson<T>(value?: string | null): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function parseNestedJson(value: string, maxDepth = 3): unknown {
  let current: unknown = value

  for (let depth = 0; depth < maxDepth && typeof current === "string"; depth += 1) {
    const next = parseStoredJson<unknown>(current)

    if (next === null) {
      break
    }

    current = next
  }

  return current
}
