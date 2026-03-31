export interface InfluenceSummary {
  agentId: string;
  influence: number;
}

export function createInfluenceSummary(
  agentId: string,
  influence = 0
): InfluenceSummary {
  return { agentId, influence };
}
