import { NextResponse } from "next/server";
import { createImpactProgress } from "@/lib/p0/certifications/impact-progress";

type RouteContext = {
  params: Promise<{ agentId: string }> | { agentId: string };
};

async function resolveAgentId(context: RouteContext) {
  const params = await context.params;
  return params.agentId;
}

export async function GET(_: Request, context: RouteContext) {
  const agentId = await resolveAgentId(context);

  return NextResponse.json(createImpactProgress(agentId));
}
