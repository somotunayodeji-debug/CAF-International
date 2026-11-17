// Use only the project's public publishable/anon key in the browser.
// Never put a service_role key here.
const SUPABASE_URL = "https://scrnhjrlzfaeihapxdsg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lCdwhE8G4DZX7LS6DMOMtg_5QV0ZDqv";

if (
  window.supabase?.createClient &&
  !SUPABASE_ANON_KEY.startsWith("PASTE_")
) {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  );
} else if (!window.supabase?.createClient) {
  console.error("Supabase JS did not load. Check the Supabase CDN connection.");
}
