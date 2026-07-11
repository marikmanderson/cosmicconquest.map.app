# Cosmic Conquest Atlas — Changelog

## v0.4.1-prototype
- Salvage now prompts Admin/Root for a 10%–50% return percentage per asset, defaulting to 33% or the Root-configured default.
- Salvage refunds continue to use the current catalog cost and always round upward.
- Removed the central Republic requisition pool.
- Weekly requisition grants now apply directly to every company up to its individual cap.
- Added shared Supabase galaxy-map storage and Realtime updates.
- Added separate sanitized public map state and private Admin/Root map state.
- Command accounts can publish Tactical Point POI changes without gaining access to full-map editing.
- Added Supabase Storage support for custom uploaded moon textures.
- Added a migration SQL file for databases already using the v0.4.0 schema.
