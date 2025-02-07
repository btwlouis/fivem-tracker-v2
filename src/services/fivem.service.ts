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

import prisma from "@/lib/prisma";

export async function getServers() {
    const perf = performance.now();

  await fetchServers(GameName.FiveM, async (server) => {
    try {
        await prisma.servers.upsert({
            where: { id: server.id },
            update: {
                locale: server.locale,
                localeCountry: server.localeCountry,
                hostname: server.hostname,
                joinId: server.joinId ?? "",
                projectName: server.projectName,
                projectDescription: server.projectDescription ?? "",
                upvotePower: server.upvotePower ?? 0,
                burstPower: server.burstPower ?? 0,
                mapname: server.mapname ?? "",
                gametype: server.gametype ?? "",
                gamename: server.gamename ?? "",
                private: server.private ?? false,
                scriptHookAllowed: server.scriptHookAllowed ?? false,
                enforceGameBuild: server.enforceGameBuild ?? "",
                bannerConnecting: server.bannerConnecting ?? "",
                bannerDetail: server.bannerDetail ?? "",
                server: server.server ?? "",
                playersMax: server.playersMax ?? 0,
                playersCurrent: server.playersCurrent ?? 0,
                iconVersion: server.iconVersion ?? 0,
                server_history: {
                    create: {
                        id: server.id,
                        clients: server.playersCurrent ?? 0, // Example: number of clients
                    },
                },
            },
            create: {
                id: server.id,
                locale: server.locale,
                localeCountry: server.localeCountry,
                hostname: server.hostname,
                joinId: server.joinId ?? "",
                projectName: server.projectName,
                projectDescription: server.projectDescription ?? "",
                upvotePower: server.upvotePower ?? 0,
                burstPower: server.burstPower ?? 0,
                mapname: server.mapname ?? "",
                gametype: server.gametype ?? "",
                gamename: server.gamename ?? "",
                private: server.private ?? false,
                scriptHookAllowed: server.scriptHookAllowed ?? false,
                enforceGameBuild: server.enforceGameBuild ?? "",
                bannerConnecting: server.bannerConnecting ?? "",
                bannerDetail: server.bannerDetail ?? "",
                server: server.server ?? "",
                playersMax: server.playersMax ?? 0,
                playersCurrent: server.playersCurrent ?? 0,
                iconVersion: server.iconVersion ?? 0,
                    
                server_history: {
                    create: {
                        id: server.id,
                        clients: server.playersCurrent ?? 0, // Example: number of clients
                    },
                },

            },          
        });

    } catch (err) {
        
    }
  });

  const time = performance.now() - perf;

  console.log(`Fetched and saved servers in ${time}ms`);

  deleteOldServers();
}

// delete old servers where servers.updated_at < now - 30 day
export async function deleteOldServers() {
//   const result: any = await serverRepository.deleteOldServers();

//   console.log(`Deleted ${result?.affectedRows} old servers`);
}
