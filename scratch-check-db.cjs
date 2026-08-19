const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const dotenvContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
dotenvContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'habitpro' }
});

async function main() {
  console.log("Fetching profiles...");
  const { data: profiles, error: pe } = await supabase.from('profiles').select('*');
  if (pe) console.error(pe);
  else console.log("Profiles:", profiles);

  console.log("\nFetching streak freezes...");
  const { data: freezes, error: fe } = await supabase.from('streak_freezes_used').select('*');
  if (fe) console.error(fe);
  else console.log("Freezes:", freezes);

  console.log("\nFetching recent habit logs...");
  const { data: logs, error: le } = await supabase.from('habit_logs').select('*').order('logical_date', { ascending: false }).limit(20);
  if (le) console.error(le);
  else console.log("Logs:", logs);
}

main();
