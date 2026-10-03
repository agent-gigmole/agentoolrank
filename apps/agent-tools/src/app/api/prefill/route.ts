import { NextRequest, NextResponse } from "next/server";
import { githubRepo } from "@/lib/downloads";
import { prefillFromRepo, type RepoJson } from "@/lib/prefill";

// Submit form prefill: GET /api/prefill?url=https://github.com/owner/repo → { name, tagline, url, github_url }.
// GitHub's public API (60/h per IP without a token). Any failure returns {} so the form simply stays as typed.
export async function GET(req: NextRequest) {
  const repo = githubRepo(req.nextUrl.searchParams.get("url"));
  if (!repo) return NextResponse.json({}, { status: 400 });
  try {
    const headers: Record<string, string> = { "User-Agent": "agentoolrank-prefill", Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`, {
      headers,
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({}, { status: res.status === 404 ? 404 : 200 });
    return NextResponse.json(prefillFromRepo((await res.json()) as RepoJson), { headers: { "Cache-Control": "public, s-maxage=86400" } });
  } catch {
    return NextResponse.json({});
  }
}
