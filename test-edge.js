const crypto = require('crypto');
const SUPABASE_URL = "https://srnrrfvglgoaviannvbp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybnJyZnZnbGdvYXZpYW5udmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjY0NDUsImV4cCI6MjA4ODA0MjQ0NX0.8v4SsW08wzXHlJ-De3uKu1IEBYryj89-DeGfmkN1wHg";

async function test() {
  console.log("Pinging Edge Function...");
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-quests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      action: 'generate_path',
      goalText: 'Master machine learning',
      profile: {
        id: crypto.randomUUID(),
        player_name: 'Hunter',
        rank: 'E',
        level: 1,
        stats_str: 10,
        stats_int: 10,
        stats_vit: 10,
        stats_dex: 10,
        stats_wis: 10
      },
      pathId: crypto.randomUUID()
    })
  });
  
  console.log("STATUS:", response.status);
  const text = await response.text();
  console.log("BODY:", text);
}

test();
