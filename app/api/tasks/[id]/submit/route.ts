import { NextResponse } from "next/server";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  if (!id || id.trim().length === 0) {
    return NextResponse.json({ error: "缺少 task id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    status: "submitted",
    taskId: id,
    payloadKeys: Object.keys(body || {}),
  });
}
