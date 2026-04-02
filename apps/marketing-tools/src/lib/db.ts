import { createClient } from "@libsql/client";

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  // Local/build: use SQLite file (resolve from project root)
  const dbPath = `${process.cwd()}/db/local.db`;
  return createClient({ url: `file:${dbPath}` });
}

export const db = getDb();
