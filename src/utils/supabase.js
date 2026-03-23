import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fllvbpkuhxfcgwtelxit.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHZicGt1aHhmY2d3dGVseGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjY0OTYsImV4cCI6MjA4OTgwMjQ5Nn0.Eyvy4mR8yncHfETfmfQzXS4xtipmlGfz8agws4pkp9c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
