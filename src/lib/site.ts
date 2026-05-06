const fallbackBaseUrl = "http://localhost:3000";

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const resolvedBaseUrl =
  normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
  normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  normalizeBaseUrl(process.env.VERCEL_URL) ||
  fallbackBaseUrl;

export const siteConfig = {
  name: "FiveM Tracker",
  shortName: "FiveM Tracker",
  description:
    "FiveM Tracker zeigt aktive FiveM Server mit Live-Spielerzahlen, Server-Historie und indexierbaren Detailseiten für serverbezogene Suchanfragen.",
  keywords: [
    "FiveM Tracker",
    "FiveM server tracker",
    "FiveM Server",
    "FiveM Serverliste",
    "FiveM servers",
    "FiveM server list",
    "deutsche FiveM Server",
    "FiveM Roleplay Server",
    "FiveM RP Server",
    "FiveM City Server",
    "FiveM Server Deutschland",
    "FiveM player history",
    "FiveM Spielerzahlen",
    "FiveM Server Statistik",
    "GTA 5 roleplay server",
    "FiveM server stats",
  ],
  baseUrl: resolvedBaseUrl,
};
