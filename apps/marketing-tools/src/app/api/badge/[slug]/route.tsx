import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { db } from "@repo/db";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

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
          <span>AIMarketRank</span>
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
          {stars && (
            <span style={{ fontSize: "11px", opacity: 0.85 }}>★ {stars}</span>
          )}
        </div>
      </div>
    ),
    {
      width: 320,
      height: 32,
    }
  );
}
