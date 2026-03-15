const SUPABASE_URL = "https://srnrrfvglgoaviannvbp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybnJyZnZnbGdvYXZpYW5udmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjY0NDUsImV4cCI6MjA4ODA0MjQ0NX0.8v4SsW08wzXHlJ-De3uKu1IEBYryj89-DeGfmkN1wHg";

async function testAuth() {
  console.log("Fetching a profile and creating a path through REST API...");
  
  // 1. Fetch a valid profile
  let profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  let profiles = await profileRes.json();
  if(!profiles || !profiles.length) {
    console.error("No profiles found!");
    return;
  }
  let profile = profiles[0];
  console.log("Found profile:", profile.id);

  // 2. Fetch a valid path (instead of insert which violates RLS)
  let pathRes = await fetch(`${SUPABASE_URL}/rest/v1/paths?player_id=eq.${profile.id}&limit=1`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  let paths = await pathRes.json();
  if(!paths || !paths.length) {
     console.error("No paths found for this user!");
     return;
  }
  let path = paths[0];
  console.log("Found path:", path.id);

  // 3. Ping edge function
  console.log("Pinging Edge Function with Real IDs...");
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-quests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      action: 'generate_path',
      goalText: 'Master machine learning',
      profile: profile,
      pathId: path.id
    })
  });
  
  console.log("STATUS:", response.status);
  const text = await response.text();
  console.log("BODY:", text);
}

testAuth();
