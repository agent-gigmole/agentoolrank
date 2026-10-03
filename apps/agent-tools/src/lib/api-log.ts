// Wrap a REST route handler so every call lands in api_calls (surface "api"), like MCP tool calls. Uses after() so the
// insert survives the response on Vercel. Key: Authorization Bearer / x-api-key / ?key=, hashed in callRow.
import { after, type NextRequest } from "next/server";
import { db } from "@repo/db";
import { recordCall } from "./api-usage";

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

export function withCallLog<C>(tool: string, handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const t0 = Date.now();
    let res: Response | undefined;
    try {
      res = await handler(req, ctx);
      return res;
    } finally {
      const key = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "") || req.headers.get("x-api-key") || req.nextUrl.searchParams.get("key") || undefined;
      const call = { surface: "api" as const, tool, ok: !!res && res.status < 400, ms: Date.now() - t0, key, ua: req.headers.get("user-agent") ?? "", src: req.nextUrl.searchParams.get("src") ?? "" };
      after(() => recordCall((q) => db.execute(q), call));
    }
  };
}
