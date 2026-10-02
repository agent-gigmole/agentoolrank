"use client";
import { useState } from "react";
import { filterDirectories, type DirectoryFilters, type TestedDirectory } from "@/lib/tested-directories";

const LOGIN: Record<string, string> = { none: "none", email_password: "email", email_code: "email code", magic_link: "magic link", google: "Google", github: "GitHub", x: "X", other: "other" };
const COND: Record<string, string> = { queue: "queue", badge: "badge", backlink: "backlink", x_post: "X post", vote_or_review_others: "vote others", call: "call" };
const TOGGLES: Array<[keyof DirectoryFilters, string]> = [
  ["freeOnly", "Free option"],
  ["noBadge", "No badge / backlink"],
  ["noLogin", "No account needed"],
  ["noHuman", "No captcha or manual step"],
];

export function TestedDirectoryTable({ rows }: { rows: TestedDirectory[] }) {
  const [f, setF] = useState<DirectoryFilters>({});
  const shown = filterDirectories(rows, f);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        {TOGGLES.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setF({ ...f, [k]: !f[k] })}
            className={`px-3 py-1 rounded-full border ${f[k] ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}>
            {label}
          </button>
        ))}
        <span className="text-gray-500 self-center">{shown.length} of {rows.length}</span>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-2">Directory</th>
              <th className="text-left p-2">Free</th>
              <th className="text-left p-2">Free tier conditions</th>
              <th className="text-left p-2">Paid from</th>
              <th className="text-left p-2">Link (checked)</th>
              <th className="text-left p-2">Login</th>
              <th className="text-left p-2">Captcha</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.domain} className="border-t align-top">
                <td className="p-2 font-medium whitespace-nowrap">{d.domain}</td>
                <td className="p-2">{d.free}</td>
                <td className="p-2 text-gray-700">
                  {d.conditions.length ? d.conditions.map((c) => COND[c] ?? c).join(", ") : "—"}
                  {d.queue && <div className="text-xs text-gray-500">{d.queue}</div>}
                </td>
                <td className="p-2">{d.paidFrom !== null ? `$${d.paidFrom}` : "—"}</td>
                <td className="p-2">{d.link === "unknown" ? "not checked" : d.link}</td>
                <td className="p-2">{d.login.map((l) => LOGIN[l] ?? l).join(", ") || "—"}</td>
                <td className="p-2">{d.captcha === "unknown" ? "—" : d.captcha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
