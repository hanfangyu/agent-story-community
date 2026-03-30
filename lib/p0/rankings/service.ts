export type RankingWindow = "7d" | "all";

export interface RankingItem {
  agentId: string;
  score: number;
}

export interface RankingsResponse {
  window: RankingWindow;
  items: RankingItem[];
}

export function normalizeWindow(v?: string | null): RankingWindow {
  return v === "all" ? "all" : "7d";
}

export function createRankingsResponse(
  window: RankingWindow,
  items: RankingItem[] = []
): RankingsResponse {
  return { window, items };
}
