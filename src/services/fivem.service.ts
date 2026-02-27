import { decodeServer } from "../utils/api";
import { Deferred } from "../utils/async";
import { fetcher } from "../utils/fetcher";
import { FrameReader } from "../utils/frameReader";
import { masterListServerData2ServerView } from "../utils/transformers";
import { IServerView } from "../utils/types";

const BASE_URL = "https://servers-frontend.fivem.net/api/servers";
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

    await fetchServers(GameName.FiveM, async (server) => {
      try {
        if(server.locale !== "de-DE") return; // only german servers

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
    servers.sort((a, b) => b.playersCurrent - a.playersCurrent).slice(0, 10000);

    const ids = servers.map((server) => server.id);

    const existingServers = await prisma.server.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const existingIds = new Set(existingServers.map((s) => s.id));

    const toUpdate = servers.filter((server) => existingIds.has(server.id));
    const toCreate = servers.filter((server) => !existingIds.has(server.id));

    const batchSize = 5000;

    const createBatches = [];
    const updateBatches = [];
    const historyBatches = [];

    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);

      createBatches.push(
        prisma.server.createMany({ data: batch, skipDuplicates: true })
      );

      historyBatches.push(
        prisma.serverHistory.createMany({
          data: batch.map((server) => ({
            server_id: server.id,
            clients: server.playersCurrent ?? 0,
            timestamp,
          })),
          skipDuplicates: true,
        })
      );
    }

    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = toUpdate.slice(i, i + batchSize);

      // Avoid prisma.$transaction([...]) for better parallelization
      updateBatches.push(
        ...batch.map((server) =>
          prisma.server.update({
            where: { id: server.id },
            data: server,
          })
        )
      );

      historyBatches.push(
        prisma.serverHistory.createMany({
          data: batch.map((server) => ({
            server_id: server.id,
            clients: server.playersCurrent ?? 0,
            timestamp,
          })),
          skipDuplicates: true,
        })
      );
    }
    console.log(`To create: ${toCreate.length}, to update: ${toUpdate.length}`);
    await Promise.allSettled(createBatches);
    await Promise.allSettled(updateBatches);
    await Promise.allSettled(historyBatches);

    const time = performance.now() - perf;
    console.log(`Fetched and saved servers in ${time}ms`);
  } catch (error) {
    console.error("Failed to fetch servers:", error);
  }
}

export async function deleteOldServers() {
  const retentionCutoff = getRetentionHistoryCutoffDate();

  await prisma.serverHistory.deleteMany({
    where: {
      timestamp: {
        lt: retentionCutoff,
      },
    },
  });

  const serversToDelete = await prisma.server.findMany({
    where: {
      server_history: {
        none: {
          timestamp: {
            gte: retentionCutoff,
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
    serversToDelete.map((s) => s.id)
  );

  if (serversToDelete.length > 0) {
    const idsToDelete = serversToDelete.map((server) => server.id);

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
