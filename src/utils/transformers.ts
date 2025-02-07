import { master } from './master';

export const DEFAULT_SERVER_LOCALE = 'root-AQ';
export const DEFAULT_SERVER_LOCALE_COUNTRY = 'AQ';

import {
  filterServerProjectDesc,
  filterServerProjectName,
  filterServerTag,
  hasPrivateConnectEndpoint,
  normalizeSearchString,
} from './serverUtils';

export function arrayAt<T>(array: T[], index: number): T | undefined {
    if (index < 0) {
      return array[array.length + index];
    }
  
    return array[index];
  }

import {
  IFullServerData,
  IHistoryServer,
  IServer,
  IServerView,
  ServerPureLevel,
  ServerViewDetailsLevel,
} from './types';

export function serverAddress2ServerView(address: string): IServerView {
  const fakeHostname = `⚠️ Server is loading or failed to load (${address}) ⚠️`;

  return {
    id: address,
    detailsLevel: ServerViewDetailsLevel.Address,
    hostname: fakeHostname,
    locale: DEFAULT_SERVER_LOCALE,
    localeCountry: DEFAULT_SERVER_LOCALE_COUNTRY,
    projectName: fakeHostname,
    rawVariables: {},
  };
}

export function masterListServerData2ServerView(joinId: string, data: master.IServerData): IServerView {
  const serverView = Object.assign(
    serverAddress2ServerView(joinId),
    {
      joinId,
      detailsLevel: ServerViewDetailsLevel.MasterList,
      enforceGameBuild: data.vars?.sv_enforceGameBuild,
      gametype: data.gametype,
      mapname: data.mapname,
      server: data.server,
      hostname: data.hostname || '',
      playersMax: data.svMaxclients || 0,
      playersCurrent: data.clients || 0,
      burstPower: data.burstPower || 0,
      upvotePower: data.upvotePower || 0,
      connectEndPoints: data.connectEndPoints,
      private: hasPrivateConnectEndpoint(data.connectEndPoints),
      rawVariables: data.vars || {},
    },
    processServerDataVariables(data.vars),
  );

  if (Object.prototype.hasOwnProperty.call(data, 'iconVersion')) {
    serverView.iconVersion = data.iconVersion;
  }

  if (!serverView.projectName) {
    serverView.upvotePower = 0;
  }

  return serverView;
}

export function masterListFullServerData2ServerView(joinId: string, data: IFullServerData['Data']): IServerView {
  const serverView = Object.assign(
    serverAddress2ServerView(joinId),
    {
      joinId,
      detailsLevel: ServerViewDetailsLevel.MasterListFull,
      enforceGameBuild: data.vars?.sv_enforceGameBuild,
      gametype: data.gametype,
      mapname: data.mapname,
      server: data.server,
      hostname: data.hostname || '',
      playersMax: data.svMaxclients || 0,
      playersCurrent: data.clients || 0,
      burstPower: data.burstPower || 0,
      upvotePower: data.upvotePower || 0,
      connectEndPoints: data.connectEndPoints,

      private: data.private || hasPrivateConnectEndpoint(data.connectEndPoints),

      ownerID: data.ownerID,
      ownerName: data.ownerName,
      ownerAvatar: data.ownerAvatar,
      ownerProfile: data.ownerProfile,

      supportStatus: (data.support_status as any) || 'supported',

      resources: data.resources as any,
      players: data.players as any,

      rawVariables: data.vars || {},
    },
    processServerDataVariables(data.vars),
  );

  if (Object.prototype.hasOwnProperty.call(data, 'iconVersion')) {
    serverView.iconVersion = data.iconVersion;
  }

  if (!serverView.projectName) {
    serverView.upvotePower = 0;
  }

  if (data.fallback) {
    serverView.offline = true;
  }

  return serverView;
}

export function historyServer2ServerView(historyServer: IHistoryServer): IServerView {
  const server: IServerView = {
    id: historyServer.address,
    detailsLevel: ServerViewDetailsLevel.Historical,
    locale: DEFAULT_SERVER_LOCALE,
    localeCountry: DEFAULT_SERVER_LOCALE_COUNTRY,
    hostname: historyServer.hostname,
    projectName: historyServer.hostname,
    rawVariables: historyServer.vars,
    historicalIconURL: historyServer.rawIcon,
  };

  return Object.assign(server, processServerDataVariables(historyServer.vars));
}

function getSearchableName(server: IServerView): string {
  const name = server.projectDescription
    ? `${server.projectName} ${server.projectDescription}`
    : server.projectName;

  return normalizeSearchString(name.replace(/\^[0-9]/g, ''));
}

function getSortableName(searchableName: string): string {
  return searchableName
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[0-9]+/g, '')
    .toLowerCase();
}

type VarsView = Partial<
  Pick<
    IServerView,
    | 'tags'
    | 'locale'
    | 'premium'
    | 'gamename'
    | 'canReview'
    | 'variables'
    | 'pureLevel'
    | 'projectName'
    | 'bannerDetail'
    | 'rawVariables'
    | 'localeCountry'
    | 'onesyncEnabled'
    | 'activitypubFeed'
    | 'licenseKeyToken'
    | 'bannerConnecting'
    | 'enforceGameBuild'
    | 'scriptHookAllowed'
    | 'projectDescription'
  >
>;

export function processServerDataVariables(vars?: IServer['data']['vars']): VarsView {
  const view: VarsView = {
    projectName: '',
  };

  if (!vars) {
    return view;
  }

  view.variables = {};

  for (const [key, value] of Object.entries(vars)) {
    const lckey = key.toLowerCase();

    switch (true) {
      case key === 'sv_projectName': {
        view.projectName = filterServerProjectName(value);
        continue;
      }
      case key === 'sv_projectDesc': {
        view.projectDescription = filterServerProjectDesc(value);
        continue;
      }
      case key === 'sv_licenseKeyToken': {
        view.licenseKeyToken = value;
        continue;
      }
      case key === 'sv_scriptHookAllowed': {
        view.scriptHookAllowed = value === 'true';
        continue;
      }
      case key === 'gamename': {
        view.gamename = value;
        continue;
      }
      case key === 'activitypubFeed': {
        view.activitypubFeed = value;
        continue;
      }
      case key === 'premium': {
        view.premium = value;
        continue;
      }
      case key === 'locale': {
        view.locale = getCanonicalLocale(value);
        view.localeCountry = arrayAt(view.locale.split('-'), -1) || '??';
        continue;
      }
      case key === 'tags': {
        view.tags = [
          ...new Set(
            value
              .split(',')
              .map((tag) => tag.trim().toLowerCase())
              .filter(filterServerTag),
          ),
        ];
        continue;
      }
      case key === 'banner_connecting': {
        view.bannerConnecting = value;
        continue;
      }
      case key === 'banner_detail': {
        view.bannerDetail = value;
        continue;
      }
      case key === 'can_review': {
        view.canReview = Boolean(value);
        continue;
      }
      case key === 'onesync_enabled': {
        view.onesyncEnabled = value === 'true';
        continue;
      }
      case key === 'sv_enforceGameBuild': {
        if (value) {
          view.enforceGameBuild = value;
        }
        continue;
      }
      case key === 'sv_pureLevel': {
        view.pureLevel = value as ServerPureLevel;

        continue;
      }

      case key === 'sv_disableClientReplays':
      case key === 'onesync':
      case key === 'gametype':
      case key === 'mapname':
      case key === 'sv_enhancedHostSupport':
      case key === 'sv_lan':
      case key === 'sv_maxClients': {
        continue;
      }

      case lckey.includes('banner_'):
      case lckey.includes('sv_project'):
      case lckey.includes('version'):
      case lckey.includes('uuid'): {
        continue;
      }
    }

    view.variables![key] = value;
  }

  return view;
}


function getCanonicalLocale(locale: string): string {
  try {
    return Intl.getCanonicalLocales(locale.replace(/_/g, '-'))[0];
  } catch {
    return DEFAULT_SERVER_LOCALE;
  }
}