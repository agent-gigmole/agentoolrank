import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { db } from "@repo/db";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // ?metric=downloads: show npm + PyPI downloads (30 days) instead of stars, for libraries used far more than starred.
  const wantDownloads = req.nextUrl.searchParams.get("metric") === "downloads";

  // Fetch tool data
  let name = slug;
  let stars = "";
  try {
    const r = await db.execute({
      sql: "SELECT name, github_stars FROM tools WHERE id = ?",
      args: [slug],
    });
    if (r.rows.length > 0) {
      const tool = r.rows[0] as any;
      name = tool.name || slug;
      if (tool.github_stars) {
        stars = tool.github_stars >= 1000
          ? `${(tool.github_stars / 1000).toFixed(1)}k`
          : String(tool.github_stars);
      }
    }
  } catch {}
  let downloads = "";
  if (wantDownloads) {
    try {
      const d = await db.execute({ sql: "SELECT SUM(downloads_30d) n FROM tool_packages WHERE tool_id = ?", args: [slug] });
      const n = Number(d.rows[0]?.n ?? 0);
      if (n > 0) downloads = n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);
    } catch {}
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
          height: "100%",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 700,
            height: "100%",
          }}
        >
          <span style={{ fontSize: "14px" }}>⚡</span>
          <span>AgentoolRank</span>
        </div>
        {/* Right: tool info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 600,
            height: "100%",
          }}
        >
          <span>Featured: {name}</span>
          {downloads ? (
            <span style={{ fontSize: "11px", opacity: 0.85 }}>⬇ {downloads}/mo</span>
          ) : (
            stars && <span style={{ fontSize: "11px", opacity: 0.85 }}>★ {stars}</span>
          )}
        </div>
      </div>
    ),
    {
      // Width follows the text so long names and the downloads tail aren't clipped (~7.4 px per char at 13px + brand block).
      width: Math.max(320, Math.min(560, Math.round(150 + (`Featured: ${name}`.length + (downloads ? downloads.length + 6 : stars.length + 3)) * 7.4))),
      height: 32,
    }
  );
}
