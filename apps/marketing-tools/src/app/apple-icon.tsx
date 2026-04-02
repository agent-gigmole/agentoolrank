import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 90,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: 36,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-2px",
        }}
      >
        AT
      </div>
    ),
    { ...size }
  );
}
