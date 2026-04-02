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
  const desc = searchParams.get("desc") || "";
  const layerNames = searchParams.get("layer_names") || "";

  const layerList = layerNames ? layerNames.split("|").slice(0, 6) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left side — main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "48px 50px",
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            <div style={{ fontSize: "20px", color: "#64748b", fontWeight: 700 }}>
              aimarketrank.com
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#38bdf8",
                backgroundColor: "#0c2d4d",
                padding: "4px 12px",
                borderRadius: "999px",
              }}
            >
              AI Marketing Blueprint
            </div>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <span style={{ fontSize: "44px" }}>{icon}</span>
            <h1
              style={{
                fontSize: "38px",
                color: "#f8fafc",
                fontWeight: 800,
                lineHeight: 1.2,
                maxWidth: "600px",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Description */}
          {desc && (
            <p
              style={{
                fontSize: "18px",
                color: "#94a3b8",
                lineHeight: 1.5,
                maxWidth: "580px",
                marginBottom: "20px",
              }}
            >
              {desc.slice(0, 120)}{desc.length > 120 ? "..." : ""}
            </p>
          )}

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "auto",
              paddingTop: "20px",
              borderTop: "1px solid #1e293b",
            }}
          >
            {buildTime && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", color: "#475569", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Build</span>
                <span style={{ fontSize: "24px", color: "#38bdf8", fontWeight: 700 }}>{buildTime}</span>
              </div>
            )}
            {cost && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", color: "#475569", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Cost</span>
                <span style={{ fontSize: "24px", color: "#4ade80", fontWeight: 700 }}>{cost}</span>
              </div>
            )}
            {layers > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", color: "#475569", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Layers</span>
                <span style={{ fontSize: "24px", color: "#c084fc", fontWeight: 700 }}>{layers}</span>
              </div>
            )}
            {tools > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", color: "#475569", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Tools</span>
                <span style={{ fontSize: "24px", color: "#fb923c", fontWeight: 700 }}>{tools}</span>
              </div>
            )}
            {difficulty && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", color: "#475569", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Level</span>
                <span style={{ fontSize: "24px", color: "#fbbf24", fontWeight: 700 }}>{difficulty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side — layer list */}
        {layerList.length > 0 && (
          <div
            style={{
              width: "340px",
              display: "flex",
              flexDirection: "column",
              padding: "48px 40px",
              backgroundColor: "#1e293b",
              borderLeft: "1px solid #334155",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: "13px", color: "#475569", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "20px" }}>
              Architecture
            </div>
            {layerList.map((name, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "999px",
                    backgroundColor: "#334155",
                    color: "#94a3b8",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ fontSize: "15px", color: "#cbd5e1" }}>
                  {name.slice(0, 30)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
