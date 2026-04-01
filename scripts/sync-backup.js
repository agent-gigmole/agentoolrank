// Sync intelligence-backup.json from Turso to ensure 100% coverage
const dotenv = require('dotenv');
dotenv.config({ path: '/home/qmt/workspace/ai-directory/.env.local' });
const { createClient } = require('@libsql/client');
const { writeFileSync } = require('fs');

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const BACKUP = '/home/qmt/workspace/ai-directory/data/intelligence-backup.json';

db.execute("SELECT id, intelligence FROM tools WHERE length(intelligence) > 10")
  .then(r => {
    const backup = {};
    for (const row of r.rows) {
      try { backup[row.id] = JSON.parse(row.intelligence); } catch {}
    }
    writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
    console.log('Synced', Object.keys(backup).length, 'tools to backup');
  });
