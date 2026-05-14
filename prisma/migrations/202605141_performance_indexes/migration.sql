-- Run this migration outside a transaction because of CONCURRENTLY.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ServerHistory_server_id_timestamp_idx"
ON "ServerHistory" (server_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS "ServerStats" (
  server_id TEXT PRIMARY KEY,
  "currentPlayers" INTEGER NOT NULL DEFAULT 0,
  "maxPlayers30d" INTEGER NOT NULL DEFAULT 0,
  "lastSeen" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FK_server_stats_servers"
    FOREIGN KEY (server_id)
    REFERENCES "Server"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ServerStats_lastSeen_idx" ON "ServerStats" ("lastSeen");
CREATE INDEX IF NOT EXISTS "ServerStats_currentPlayers_idx" ON "ServerStats" ("currentPlayers");
CREATE INDEX IF NOT EXISTS "ServerStats_maxPlayers30d_idx" ON "ServerStats" ("maxPlayers30d");

INSERT INTO "ServerStats" (server_id, "currentPlayers", "maxPlayers30d", "lastSeen", "updatedAt")
SELECT
  s.id,
  COALESCE(s."playersCurrent", 0),
  COALESCE(s."playersCurrent", 0),
  s.updated_at,
  CURRENT_TIMESTAMP
FROM "Server" s
ON CONFLICT (server_id) DO UPDATE SET
  "currentPlayers" = EXCLUDED."currentPlayers",
  "maxPlayers30d" = GREATEST("ServerStats"."maxPlayers30d", EXCLUDED."maxPlayers30d"),
  "lastSeen" = GREATEST("ServerStats"."lastSeen", EXCLUDED."lastSeen"),
  "updatedAt" = CURRENT_TIMESTAMP;
