import { decodeServer } from "../utils/api";
import { Deferred } from "../utils/async";
import { fetcher } from "../utils/fetcher";
import { FrameReader } from "../utils/frameReader";
import { masterListServerData2ServerView } from "../utils/transformers";
import { IServerView } from "../utils/types";

const BASE_URL = "https://frontend.cfx-services.net/api/servers";
const ALL_SERVERS_URL = `${BASE_URL}/streamRedir/`;

export enum GameName {
  FiveM = "gta5",
  RedM = "rdr3",
  LibertyM = "ny",

  Launcher = "launcher",
}

async function readBodyToServers(
  gameName: GameName,
  onServer: (server: IServerView) => void,
  body: ReadableStream<Uint8Array>
): Promise<void> {
  const deferred = new Deferred<void>();

  let decodeTime = 0;
  let transformTime = 0;
  let onServerTime = 0;

  const frameReader = new FrameReader(
    body,
    (frame) => {
      let timestamp = performance.now();
      const srv = decodeServer(frame);
      decodeTime += performance.now() - timestamp;

      if (srv.EndPoint && srv.Data) {
        const serverGameName = srv.Data?.vars?.gamename || GameName.FiveM;

        if (gameName === serverGameName) {
          timestamp = performance.now();
          const serverView = masterListServerData2ServerView(
            srv.EndPoint,
            srv.Data
          );
          transformTime += performance.now() - timestamp;

          timestamp = performance.now();
          onServer(serverView);
          onServerTime += performance.now() - timestamp;
        }
      }

      decodeTime += performance.now() - timestamp;
    },
    deferred.resolve
  );

  frameReader.read();

  await deferred.promise;

  console.log(
    "Times: decode",
    decodeTime,
    "ms, transform",
    transformTime,
    "ms, onServer",
    onServerTime,
    "ms"
  );
}

export async function fetchServers(
  gameName: GameName,
  onServer: (server: IServerView) => void
) {
  console.time("Total fetchServers");

  try {
    const { body } = await fetcher.fetch(new Request(ALL_SERVERS_URL));

    if (!body) {
      throw new Error("Empty body of all servers stream");
    }

    await readBodyToServers(gameName, onServer, body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching servers:", error);
    if (error instanceof fetcher.HttpError) {
      console.error(`HTTP error: ${error.status} ${error.statusText}`);
    } else if (error.code === "ECONNRESET") {
      console.error("Connection was reset. Please try again later.");
    }
  } finally {
    console.timeEnd("Total fetchServers");
  }
}

import { prisma } from "@/lib/prisma";
import { getRetentionHistoryCutoffDate } from "@/lib/server-freshness";
import { Prisma } from "@prisma/client";

const WRITE_BATCH_SIZE = 500;
const HISTORY_DELETE_BATCH_SIZE = 5000;

async function refreshServerStatsForServers(servers: ServerData[], timestamp: Date) {
  if (servers.length === 0) return;

  const values = Prisma.join(
    servers.map((server) =>
      Prisma.sql`(${server.id}, ${server.playersCurrent ?? 0}, ${timestamp})`
    )
  );

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "ServerStats" (server_id, "currentPlayers", "maxPlayers30d", "lastSeen", "updatedAt")
    SELECT
      incoming.server_id,
      incoming.current_players,
      incoming.current_players,
      incoming.last_seen,
      CURRENT_TIMESTAMP
    FROM (
      VALUES ${values}
    ) AS incoming(server_id, current_players, last_seen)
    ON CONFLICT (server_id) DO UPDATE SET
      "currentPlayers" = EXCLUDED."currentPlayers",
      "maxPlayers30d" = GREATEST("ServerStats"."maxPlayers30d", EXCLUDED."maxPlayers30d"),
      "lastSeen" = GREATEST("ServerStats"."lastSeen", EXCLUDED."lastSeen"),
      "updatedAt" = CURRENT_TIMESTAMP
  `);
}

async function upsertServers(servers: ServerData[], timestamp: Date) {
  if (servers.length === 0) return 0;

  const values = Prisma.join(
    servers.map((server) =>
      Prisma.sql`(
        ${server.id},
        ${server.detailsLevel},
        ${server.locale},
        ${server.localeCountry},
        ${server.hostname},
        ${server.joinId},
        ${server.historicalAddress},
        ${server.historicalIconURL},
        ${server.connectEndPoints},
        ${server.rawVariables},
        ${server.variables},
        ${server.projectName},
        ${server.projectDescription},
        ${server.upvotePower},
        ${server.burstPower},
        ${server.offline},
        ${server.mapname},
        ${server.gametype},
        ${server.gamename},
        ${server.licenseKeyToken},
        ${server.fallback},
        ${server.private},
        ${server.scriptHookAllowed},
        ${server.enforceGameBuild},
        ${server.pureLevel},
        ${server.premium},
        ${server.bannerConnecting},
        ${server.bannerDetail},
        ${server.canReview},
        ${server.ownerID},
        ${server.ownerName},
        ${server.ownerAvatar},
        ${server.ownerProfile},
        ${server.activitypubFeed},
        ${server.onesyncEnabled},
        ${server.server},
        ${server.supportStatus},
        ${server.playersMax},
        ${server.playersCurrent},
        ${server.iconVersion},
        ${server.tags},
        ${server.resources},
        ${server.players},
        ${timestamp},
        ${timestamp}
      )`
    )
  );

  return prisma.$executeRaw(Prisma.sql`
    INSERT INTO "Server" (
      "id",
      "detailsLevel",
      "locale",
      "localeCountry",
      "hostname",
      "joinId",
      "historicalAddress",
      "historicalIconURL",
      "connectEndPoints",
      "rawVariables",
      "variables",
      "projectName",
      "projectDescription",
      "upvotePower",
      "burstPower",
      "offline",
      "mapname",
      "gametype",
      "gamename",
      "licenseKeyToken",
      "fallback",
      "private",
      "scriptHookAllowed",
      "enforceGameBuild",
      "pureLevel",
      "premium",
      "bannerConnecting",
      "bannerDetail",
      "canReview",
      "ownerID",
      "ownerName",
      "ownerAvatar",
      "ownerProfile",
      "activitypubFeed",
      "onesyncEnabled",
      "server",
      "supportStatus",
      "playersMax",
      "playersCurrent",
      "iconVersion",
      "tags",
      "resources",
      "players",
      "created_at",
      "updated_at"
    )
    VALUES ${values}
    ON CONFLICT ("id") DO UPDATE SET
      "detailsLevel" = EXCLUDED."detailsLevel",
      "locale" = EXCLUDED."locale",
      "localeCountry" = EXCLUDED."localeCountry",
      "hostname" = EXCLUDED."hostname",
      "joinId" = EXCLUDED."joinId",
      "historicalAddress" = EXCLUDED."historicalAddress",
      "historicalIconURL" = EXCLUDED."historicalIconURL",
      "connectEndPoints" = EXCLUDED."connectEndPoints",
      "rawVariables" = EXCLUDED."rawVariables",
      "variables" = EXCLUDED."variables",
      "projectName" = EXCLUDED."projectName",
      "projectDescription" = EXCLUDED."projectDescription",
      "upvotePower" = EXCLUDED."upvotePower",
      "burstPower" = EXCLUDED."burstPower",
      "offline" = EXCLUDED."offline",
      "mapname" = EXCLUDED."mapname",
      "gametype" = EXCLUDED."gametype",
      "gamename" = EXCLUDED."gamename",
      "licenseKeyToken" = EXCLUDED."licenseKeyToken",
      "fallback" = EXCLUDED."fallback",
      "private" = EXCLUDED."private",
      "scriptHookAllowed" = EXCLUDED."scriptHookAllowed",
      "enforceGameBuild" = EXCLUDED."enforceGameBuild",
      "pureLevel" = EXCLUDED."pureLevel",
      "premium" = EXCLUDED."premium",
      "bannerConnecting" = EXCLUDED."bannerConnecting",
      "bannerDetail" = EXCLUDED."bannerDetail",
      "canReview" = EXCLUDED."canReview",
      "ownerID" = EXCLUDED."ownerID",
      "ownerName" = EXCLUDED."ownerName",
      "ownerAvatar" = EXCLUDED."ownerAvatar",
      "ownerProfile" = EXCLUDED."ownerProfile",
      "activitypubFeed" = EXCLUDED."activitypubFeed",
      "onesyncEnabled" = EXCLUDED."onesyncEnabled",
      "server" = EXCLUDED."server",
      "supportStatus" = EXCLUDED."supportStatus",
      "playersMax" = EXCLUDED."playersMax",
      "playersCurrent" = EXCLUDED."playersCurrent",
      "iconVersion" = EXCLUDED."iconVersion",
      "tags" = EXCLUDED."tags",
      "resources" = EXCLUDED."resources",
      "players" = EXCLUDED."players",
      "updated_at" = EXCLUDED."updated_at"
  `);
}

async function insertServerHistory(servers: ServerData[], timestamp: Date) {
  if (servers.length === 0) return 0;

  const values = Prisma.join(
    servers.map((server) =>
      Prisma.sql`(${server.id}, ${server.playersCurrent ?? 0}, ${timestamp})`
    )
  );

  return prisma.$executeRaw(Prisma.sql`
    INSERT INTO "ServerHistory" (server_id, clients, timestamp)
    VALUES ${values}
  `);
}

function sanitizeString(input: string): string {
  if (typeof input !== "string") return input;
  const sanitized = input.replace(/[^\x20-\x7E]/g, "").trim();
  return sanitized.length > 255 ? sanitized.slice(0, 255) : sanitized;
}

function sanitizeNullableString(input?: string | null) {
  if (!input) {
    return null;
  }

  return sanitizeString(input);
}

function serializeJson(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as Record<string, unknown>).length === 0)
  ) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

interface ServerData {
  detailsLevel: number;
  upvotePower: number;
  burstPower: number;
  private: boolean;
  scriptHookAllowed: boolean;
  offline: boolean;
  canReview: boolean;
  onesyncEnabled: boolean;
  playersMax: number;
  playersCurrent: number;
  iconVersion: number;

  id: string;
  locale: string;
  localeCountry: string;
  hostname: string;
  joinId: string;
  historicalAddress: string | null;
  historicalIconURL: string | null;
  connectEndPoints: string | null;
  rawVariables: string | null;
  variables: string | null;
  projectName: string;
  projectDescription: string;
  mapname: string;
  gametype: string;
  gamename: string;
  licenseKeyToken: string | null;
  fallback: string | null;
  enforceGameBuild: string;
  pureLevel: string | null;
  premium: string | null;
  bannerConnecting: string;
  bannerDetail: string;
  ownerID: string | null;
  ownerName: string | null;
  ownerAvatar: string | null;
  ownerProfile: string | null;
  activitypubFeed: string | null;
  server: string;
  supportStatus: string | null;
  tags: string | null;
  resources: string | null;
  players: string | null;
}

export async function getServers() {
  try {
    const perf = performance.now();
    const servers: ServerData[] = [];
    const timestamp = new Date();

    await fetchServers(GameName.FiveM, (server) => {
      try {
        const data = {
          detailsLevel: server.detailsLevel ?? 0,
          upvotePower: server.upvotePower ?? 0,
          burstPower: server.burstPower ?? 0,
          private: server.private ?? false,
          scriptHookAllowed: server.scriptHookAllowed ?? false,
          offline: server.offline ?? false,
          canReview: server.canReview ?? false,
          onesyncEnabled: server.onesyncEnabled ?? false,
          playersMax: server.playersMax ?? 0,
          playersCurrent: server.playersCurrent ?? 0,
          iconVersion: server.iconVersion ?? 0,

          id: sanitizeString(server.id),
          locale: sanitizeString(server.locale),
          localeCountry: sanitizeString(server.localeCountry),
          hostname: sanitizeString(server.hostname),
          joinId: sanitizeString(server.joinId ?? ""),
          historicalAddress: sanitizeNullableString(server.historicalAddress),
          historicalIconURL: sanitizeNullableString(server.historicalIconURL),
          connectEndPoints: serializeJson(server.connectEndPoints),
          rawVariables: serializeJson(server.rawVariables),
          variables: serializeJson(server.variables),
          projectName: sanitizeString(server.projectName),
          projectDescription: sanitizeString(server.projectDescription ?? ""),
          mapname: sanitizeString(server.mapname ?? ""),
          gametype: sanitizeString(server.gametype ?? ""),
          gamename: sanitizeString(server.gamename ?? ""),
          licenseKeyToken: sanitizeNullableString(server.licenseKeyToken),
          fallback: serializeJson(server.fallback),
          enforceGameBuild: sanitizeString(server.enforceGameBuild ?? ""),
          pureLevel: sanitizeNullableString(server.pureLevel),
          premium: sanitizeNullableString(server.premium),
          bannerConnecting: sanitizeString(server.bannerConnecting ?? ""),
          bannerDetail: sanitizeString(server.bannerDetail ?? ""),
          ownerID: sanitizeNullableString(server.ownerID),
          ownerName: sanitizeNullableString(server.ownerName),
          ownerAvatar: sanitizeNullableString(server.ownerAvatar),
          ownerProfile: sanitizeNullableString(server.ownerProfile),
          activitypubFeed: sanitizeNullableString(server.activitypubFeed),
          server: sanitizeString(server.server ?? ""),
          supportStatus: sanitizeNullableString(server.supportStatus),
          tags: serializeJson(server.tags),
          resources: serializeJson(server.resources),
          players: serializeJson(server.players),
        };

        servers.push(data);
      } catch (error) {
        console.error(`Error processing server ${server.id}:`, error);
      }
    });

    console.log(`Fetched ${servers.length} servers`);

    let writtenServers = 0;
    let writtenHistoryRows = 0;

    for (let i = 0; i < servers.length; i += WRITE_BATCH_SIZE) {
      const batch = servers.slice(i, i + WRITE_BATCH_SIZE);

      writtenServers += await upsertServers(batch, timestamp);
      writtenHistoryRows += await insertServerHistory(batch, timestamp);
      await refreshServerStatsForServers(batch, timestamp);
    }

    console.log(
      `Wrote ${writtenServers} server rows and ${writtenHistoryRows} history rows`
    );

    const time = performance.now() - perf;
    console.log(`Fetched and saved servers in ${time}ms`);
  } catch (error) {
    console.error("Failed to fetch servers:", error);
  }
}

export async function deleteOldServers() {
  const retentionCutoff = getRetentionHistoryCutoffDate();
  let deletedHistoryRows = 0;

  while (true) {
    const deleted = await prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
      WITH deleted_rows AS (
        DELETE FROM "ServerHistory"
        WHERE id IN (
          SELECT id
          FROM "ServerHistory"
          WHERE timestamp < ${retentionCutoff}
          ORDER BY timestamp ASC
          LIMIT ${HISTORY_DELETE_BATCH_SIZE}
        )
        RETURNING 1
      )
      SELECT COUNT(*) AS count FROM deleted_rows
    `);

    const deletedCount = Number(deleted[0]?.count ?? 0);
    deletedHistoryRows += deletedCount;

    if (deletedCount < HISTORY_DELETE_BATCH_SIZE) {
      break;
    }
  }

  console.log(`Deleted ${deletedHistoryRows} old history rows`);

  const serversToDelete = await prisma.server.findMany({
    where: {
      server_stats: {
        is: {
          lastSeen: {
            lt: retentionCutoff,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  console.log(
    "Servers to delete:",
    serversToDelete.map((server: { id: string }) => server.id)
  );

  if (serversToDelete.length > 0) {
    const idsToDelete = serversToDelete.map(
      (server: { id: string }) => server.id
    );

    // 3. Lösche die Server (server_history wird durch onDelete: Cascade mit gelöscht)
    await prisma.server.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });

    console.log(`Deleted ${idsToDelete.length} old servers`);
  } else {
    console.log("No old servers to delete");
  }
}
