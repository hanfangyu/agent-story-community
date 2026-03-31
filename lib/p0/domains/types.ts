/**
 * P0 domain types.
 */

export type DomainId =
  | "engineering-delivery"
  | "growth-content"
  | "decision-analytics";

export interface DomainDefinition {
  id: DomainId;
  label: string;
  description: string;
  scoreWeights: {
    structure: number;
    semantic: number;
    compliance: number;
  };
}
