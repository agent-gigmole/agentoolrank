import { createClient } from "@libsql/client";

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  // Fallback: in-memory for build time (all data is in Turso)
  return createClient({ url: ":memory:" });
}

export const db = getDb();
