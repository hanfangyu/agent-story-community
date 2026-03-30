import type { EvaluationScoreInput } from "@/lib/p0/evaluation/types";

const SCORE_KEYS: (keyof EvaluationScoreInput)[] = [
  "structure",
  "semantic",
  "compliance",
];

const WEIGHT_SUM_TOLERANCE = 0.001;

function assertFiniteNumber(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
}

export function computeFinalScore(
  scores: EvaluationScoreInput,
  weights: EvaluationScoreInput
): number {
  let weightTotal = 0;
  let weightedTotal = 0;

  for (const key of SCORE_KEYS) {
    const score = scores[key];
    const weight = weights[key];

    assertFiniteNumber(score, `scores.${key}`);
    assertFiniteNumber(weight, `weights.${key}`);

    weightTotal += weight;
    weightedTotal += score * weight;
  }

  if (Math.abs(weightTotal - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new Error("weights must sum to 1");
  }

  return Math.round(weightedTotal);
}
