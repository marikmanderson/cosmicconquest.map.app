# Cosmic Conquest Atlas — Changelog

## v0.4.2-prototype
- Added a dedicated Public Description / Briefing editor to the Celestial Bodies Editor for planets, moons, Waystations, and other bodies.
- Added an optional manual faction-control override for Rantel Waystations.
- Waystation overrides distribute the station's Strategic Weight by GM-entered faction percentages and require a 100% total.
- Manually controlled Waystations now contribute to Rantel Cluster and overall system control calculations.
- Waystation system-map styling reflects the dominant override faction.

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
