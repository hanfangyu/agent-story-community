import { NextResponse } from "next/server";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  if (!id || id.trim().length === 0) {
    return NextResponse.json({ error: "缺少 task id" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "claimed", taskId: id });
}
