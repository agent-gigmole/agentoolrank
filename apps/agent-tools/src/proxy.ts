import { NextRequest, NextResponse } from "next/server";
import { isGonePath } from "./lib/delisted";

// Soft-delisted tools: 410 Gone on their tool / alternatives / compare pages (and zh/ja versions).
export function proxy(request: NextRequest) {
  if (isGonePath(request.nextUrl.pathname)) {
    return new NextResponse("This tool is no longer listed on AgentoolRank.", { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/tool/:path*", "/alternatives/:path*", "/compare/:path*", "/zh/tool/:path*", "/ja/tool/:path*"],
};
