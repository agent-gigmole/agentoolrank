// Pages of soft-delisted tools (tools_archive) answer 410 Gone so search engines drop them faster than a 404.
import { DELISTED } from "./delisted-ids";

export function isGonePath(pathname: string, ids: readonly string[] = DELISTED): boolean {
  const m = pathname.match(/^\/(?:(?:zh|ja)\/)?(?:tool|alternatives)\/([^/]+)\/?$/);
  if (m) return ids.includes(m[1]);
  const c = pathname.match(/^\/compare\/([^/]+?)\/?$/);
  if (c) return ids.some((id) => c[1].startsWith(`${id}-vs-`) || c[1].endsWith(`-vs-${id}`));
  return false;
}
