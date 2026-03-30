export interface EvaluationScoreInput {
  structure: number;
  semantic: number;
  compliance: number;
}

export interface EvaluationScoreOutput {
  score: number;
}

export interface EvaluationResult {
  score: number;
  rationale: string;
}

export interface SemanticEvaluationInput {
  submissionId: string;
}
