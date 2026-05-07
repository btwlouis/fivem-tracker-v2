export type SortOption = "players" | "upvotes" | "record";

export type ServerListItem = {
  id: string;
  projectName: string | null;
  projectDescription: string | null;
  playersCurrent: number | null;
  playersMax: number | null;
  localeCountry: string;
  iconVersion: number | null;
  rank: number;
  tags: string | null;
  upvotePower: number | null;
  record: number;
};

export type ServerListResponse = {
  servers: ServerListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
};
