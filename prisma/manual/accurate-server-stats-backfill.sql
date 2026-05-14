-- Optional off-peak backfill for exact 30-day records.
-- This scans "ServerHistory" and should not run during traffic peaks.

INSERT INTO "ServerStats" (server_id, "currentPlayers", "maxPlayers30d", "lastSeen", "updatedAt")
SELECT
  s.id,
  COALESCE(s."playersCurrent", 0),
  COALESCE(h."maxPlayers30d", s."playersCurrent", 0),
  COALESCE(h."lastSeen", s.updated_at),
  CURRENT_TIMESTAMP
FROM "Server" s
LEFT JOIN (
  SELECT
    server_id,
    MAX(clients) AS "maxPlayers30d",
    MAX(timestamp) AS "lastSeen"
  FROM "ServerHistory"
  WHERE timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY server_id
) h ON h.server_id = s.id
ON CONFLICT (server_id) DO UPDATE SET
  "currentPlayers" = EXCLUDED."currentPlayers",
  "maxPlayers30d" = EXCLUDED."maxPlayers30d",
  "lastSeen" = EXCLUDED."lastSeen",
  "updatedAt" = CURRENT_TIMESTAMP;
