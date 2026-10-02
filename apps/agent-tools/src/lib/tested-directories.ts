// Directories we actually went through the submission flow on (exported from our own notes by
// scripts/export-tested-directories.ts). Pure helpers for the /where-to-list table.
export interface TestedDirectory {
  domain: string;
  free: "yes" | "no" | "unknown";
  conditions: string[]; // queue | badge | backlink | x_post | vote_or_review_others | call
  queue: string | null;
  paidFrom: number | null;
  link: "dofollow" | "nofollow" | "ugc" | "unknown"; // only when we checked the live rel attribute
  login: string[];
  captcha: string;
  human: string[]; // steps a person had to do: captcha | real_name | phone | payment | x_post | video_call | email_inbox
  verified: string;
}

export interface DirectoryFilters { freeOnly?: boolean; noBadge?: boolean; noLogin?: boolean; noHuman?: boolean }

export function filterDirectories(list: TestedDirectory[], f: DirectoryFilters): TestedDirectory[] {
  return list.filter((d) =>
    (!f.freeOnly || d.free !== "no") &&
    (!f.noBadge || !d.conditions.some((c) => c === "badge" || c === "backlink")) &&
    (!f.noLogin || (d.login.length > 0 && d.login.every((l) => l === "none"))) &&
    (!f.noHuman || !d.human.some((h) => h !== "email_inbox")));
}

export function summarize(list: TestedDirectory[]) {
  const checked = list.filter((d) => d.link !== "unknown");
  return {
    total: list.length,
    free: list.filter((d) => d.free === "yes").length,
    badgeOrBacklink: list.filter((d) => d.conditions.some((c) => c === "badge" || c === "backlink")).length,
    needsHuman: list.filter((d) => d.human.some((h) => h !== "email_inbox")).length,
    linkChecked: checked.length,
    nofollowOfChecked: checked.filter((d) => d.link !== "dofollow").length,
  };
}
