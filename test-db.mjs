import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching listings...");
  const { data, error } = await supabase.from('listings').select('*').limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Listings count:", data?.length);
    console.log("Sample:", JSON.stringify(data, null, 2));
  }
}

test();
