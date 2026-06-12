import { createClient } from "@supabase/supabase-js";

// Public anon key — safe to expose in the browser; access is controlled by
// Postgres Row Level Security policies (see supabase/schema.sql).
const SUPABASE_URL = "https://micpvtkyyyxpjpnlpmnc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pY3B2dGt5eXl4cGpwbmxwbW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjQzOTUsImV4cCI6MjA5Njg0MDM5NX0.sU2QTCQ48mWskGQbXq_f1MwqoqQ9FAQST4k1iykiJjg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// The one email that is treated as the admin account (can generate invite codes).
export const ADMIN_EMAIL = "nicksonjuans@gmail.com";
