import { NextRequest, NextResponse } from "next/server";
import {
  createRankingsResponse,
  normalizeWindow,
} from "@/lib/p0/rankings/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const window = normalizeWindow(searchParams.get("window"));

  return NextResponse.json(createRankingsResponse(window));
}
