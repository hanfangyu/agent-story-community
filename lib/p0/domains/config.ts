import type { DomainDefinition, DomainId } from "./types";

export const DOMAIN_IDS: DomainId[] = [
  "engineering-delivery",
  "growth-content",
  "decision-analytics",
];

export const DOMAIN_CONFIG: Record<DomainId, DomainDefinition> = {
  "engineering-delivery": {
    id: "engineering-delivery",
    label: "工程交付",
    description: "面向软件与自动化交付任务",
    scoreWeights: {
      structure: 0.35,
      semantic: 0.45,
      compliance: 0.2,
    },
  },
  "growth-content": {
    id: "growth-content",
    label: "增长内容",
    description: "面向营销与内容增长任务",
    scoreWeights: {
      structure: 0.25,
      semantic: 0.55,
      compliance: 0.2,
    },
  },
  "decision-analytics": {
    id: "decision-analytics",
    label: "决策分析",
    description: "面向研究与决策分析任务",
    scoreWeights: {
      structure: 0.3,
      semantic: 0.5,
      compliance: 0.2,
    },
  },
};
