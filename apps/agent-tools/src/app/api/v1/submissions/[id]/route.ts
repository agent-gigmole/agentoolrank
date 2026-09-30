import { NextRequest } from "next/server";
import { submissionStatus } from "@/lib/submit-core";

// GET /api/v1/submissions/{id}?token=... → review status of a submission.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const s = await submissionStatus(Number(id), token);
  if (!s) return Response.json({ error: "not_found" }, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
  return Response.json(s, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
}
