// "Not actively maintained" signal for tool pages: no commit for 180+ days.
export function staleness(lastCommit: string | null, now: Date): { stale: boolean; months: number } {
  if (!lastCommit) return { stale: false, months: 0 };
  const days = (now.getTime() - new Date(lastCommit).getTime()) / 86400000;
  return { stale: days >= 180, months: Math.floor(days / 30) };
}
