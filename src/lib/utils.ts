import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  "^9": "#9E9E9E"  // Grey
};