import { createClient } from "@libsql/client";

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    // Local development: use local SQLite file
    return createClient({
      url: "file:./db/local.db",
    });
  }

  return createClient({
    url,
    authToken,
  });
}

export const db = getDb();
