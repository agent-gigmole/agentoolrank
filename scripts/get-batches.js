const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

db.execute("SELECT id, github_owner, github_repo FROM tools WHERE github_owner IS NOT NULL AND github_owner != '' AND (intelligence IS NULL OR intelligence = '' OR length(intelligence) < 10) ORDER BY score DESC")
  .then(r => {
    console.log('Remaining:', r.rows.length);
    for (let b = 0; b < 8; b++) {
      const batch = r.rows.slice(b * 20, (b + 1) * 20);
      if (!batch.length) break;
      console.log('\nBATCH' + (b + 16) + ':');
      console.log(batch.map(t => t.id + ' (' + t.github_owner + '/' + t.github_repo + ')').join(', '));
    }
  });
