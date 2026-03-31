import type {
  EvaluationResult,
  SemanticEvaluationInput,
} from "@/lib/p0/evaluation/types";

export interface SemanticEvaluator {
  evaluate(input: SemanticEvaluationInput): Promise<EvaluationResult>;
}

export const fallbackEvaluator: SemanticEvaluator = {
  async evaluate(_input) {
    return {
      score: 75,
      rationale: "fallback score",
    };
  },
};
