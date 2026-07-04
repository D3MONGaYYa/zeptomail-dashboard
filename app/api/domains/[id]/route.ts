import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildWebhookUrl } from "@/lib/tokens";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await query<{
    id: number;
    name: string;
    token: string;
    is_active: boolean;
    created_at: string;
  }>("SELECT id, name, token, is_active, created_at FROM domains WHERE id = $1", [params.id]);

  const domain = result.rows[0];
  if (!domain) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: domain.id,
    name: domain.name,
    webhookUrl: buildWebhookUrl(domain.token),
    isActive: domain.is_active,
    createdAt: domain.created_at,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive (boolean) is required." }, { status: 400 });
  }

  const result = await query(
    "UPDATE domains SET is_active = $1 WHERE id = $2 RETURNING id",
    [body.isActive, params.id]
  );
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await query("DELETE FROM domains WHERE id = $1 RETURNING id", [params.id]);
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
