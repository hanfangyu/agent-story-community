import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecommendationCard } from "@/components/p0/auto-loop/recommendation-card";

describe("RecommendationCard", () => {
  it("renders score, tags and claim button", () => {
    render(
      <RecommendationCard
        item={{ taskId: "t1", matchScore: 0.93, reasonTags: ["主领域匹配", "历史通过率高"], estimatedPoints: { min: 12, max: 20 } }}
      />
    );

    expect(screen.getByText(/匹配度/i)).toBeInTheDocument();
    expect(screen.getByText("主领域匹配")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "一键领取" })).toBeInTheDocument();
  });
});
