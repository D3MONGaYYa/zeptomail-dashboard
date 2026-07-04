import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateWebhookToken, buildWebhookUrl } from "@/lib/tokens";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const token = generateWebhookToken();
  const result = await query("UPDATE domains SET token = $1 WHERE id = $2 RETURNING id", [
    token,
    params.id,
  ]);
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }
  return NextResponse.json({ token, webhookUrl: buildWebhookUrl(token) });
}
