import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "AI Tool Stack";
  const icon = searchParams.get("icon") || "🔧";
  const difficulty = searchParams.get("difficulty") || "";
  const layers = parseInt(searchParams.get("layers") || "0");
  const tools = parseInt(searchParams.get("tools") || "0");
  const buildTime = searchParams.get("build_time") || "";
  const cost = searchParams.get("cost") || "";
  const tags = searchParams.get("tags") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f172a",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              fontWeight: 700,
            }}
          >
            AgenTool Rank
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#64748b",
            }}
          >
            AI Project Blueprint
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "48px" }}>{icon}</span>
          <h1
            style={{
              fontSize: "42px",
              color: "#f8fafc",
              fontWeight: 800,
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Tags */}
        {tags && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "32px",
            }}
          >
            {tags.split(",").map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "16px",
                  color: "#93c5fd",
                  backgroundColor: "#1e3a5f",
                  padding: "4px 12px",
                  borderRadius: "999px",
                }}
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "auto",
          }}
        >
          {buildTime && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Build Time</span>
              <span style={{ fontSize: "28px", color: "#38bdf8", fontWeight: 700 }}>
                {buildTime}
              </span>
            </div>
          )}
          {cost && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Monthly Cost</span>
              <span style={{ fontSize: "28px", color: "#4ade80", fontWeight: 700 }}>
                {cost}
              </span>
            </div>
          )}
          {layers > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Layers</span>
              <span style={{ fontSize: "28px", color: "#c084fc", fontWeight: 700 }}>
                {layers}
              </span>
            </div>
          )}
          {tools > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Tools</span>
              <span style={{ fontSize: "28px", color: "#fb923c", fontWeight: 700 }}>
                {tools}
              </span>
            </div>
          )}
          {difficulty && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Difficulty</span>
              <span style={{ fontSize: "28px", color: "#fbbf24", fontWeight: 700 }}>
                {difficulty}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
