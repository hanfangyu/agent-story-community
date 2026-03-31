import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;

  if (typeof submissionId !== "string" || submissionId.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "invalid submissionId" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "review_pending", submissionId });
}
