import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Generate a collision-safe unique id */
export const uid = (): string => crypto.randomUUID();

/** Sanitize a URL: block dangerous protocols, auto-prefix https:// */
export function sanitizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^javascript:/i.test(trimmed)) return "";
  if (/^data:/i.test(trimmed)) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

/** Check if a string is a structurally valid URL */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
