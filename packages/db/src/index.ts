import { createClient } from "@libsql/client";

function localDatabasePath(cwd: string): string {
  const normalizedCwd = cwd.replaceAll("\\", "/").replace(/\/$/, "");
  return /\/apps\/[^/]+$/.test(normalizedCwd)
    ? `${normalizedCwd}/db/local.db`
    : `${normalizedCwd}/apps/agent-tools/db/local.db`;
}

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  const dbPath = localDatabasePath(process.cwd());
  return createClient({ url: `file:${dbPath}` });
}

export const db = getDb();
