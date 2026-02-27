const fallbackBaseUrl = "http://localhost:3000";

export const siteConfig = {
  name: "FiveM Tracker",
  shortName: "FiveM Tracker",
  description:
    "Find active FiveM servers with fresh history, live player stats, and indexable server detail pages.",
  keywords: [
    "FiveM server tracker",
    "FiveM servers",
    "FiveM server list",
    "FiveM player history",
    "GTA 5 roleplay server",
    "FiveM server stats",
  ],
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || fallbackBaseUrl,
};
