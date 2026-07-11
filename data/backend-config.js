// Shared-data configuration for Cosmic Conquest Logistics, galaxy-map state, and uploaded moon textures.
// Leave enabled:false for local browser testing.
// When deploying Supabase, fill in the project URL and publishable/anon key.
window.CC_BACKEND_CONFIG = {
  enabled: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  discordRedirectUrl: window.location.origin + window.location.pathname,
  realtime: true
};
