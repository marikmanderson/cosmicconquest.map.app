# Cosmic Conquest Atlas — Changelog

## v0.4.6-prototype
- Fixed uploaded moon textures not being selected by the Flat Map and Globe renderers when the texture came from a shared Supabase URL.
- Added a moon-only texture replacement control to the Celestial Bodies Editor.
- Added a current-texture preview and status readout for moons.
- Added 2:1 projection, supported-format, and 50 MB shared-upload validation.
- Improved Supabase upload errors for signed-out or insufficient-role sessions.

## v0.4.5-prototype
- Added a Rantel Cluster-only visual asteroid-density slider to the Celestial Bodies Editor.
- The slider controls 100–1,200 decorative System View asteroids and defaults to 340.
- Asteroid density is visual only and does not alter faction control, strategic weight, or logistics calculations.
- The value persists through local saves and the shared Supabase atlas JSON.

## v0.4.4-prototype
- Added editable POI label text size in the Admin Console POI editor.
- Added editable POI label text size in the Quick Create / Quick Edit panel.
- Label text size is independent from icon Display Size and works in both flat-map and globe rendering.
- Existing POIs migrate to a default text-size multiplier of 1.00.

## v0.4.3-prototype
- Fixed Delete Celestial Body on the shared website.
- Deleted seeded moons and Waystations now remain deleted after Supabase saves, Realtime refreshes, and page reloads.
- Added persistent body-deletion tombstones to prevent migration logic from silently restoring removed seeded bodies.
- Recreating a custom moon with the same ID clears its old deletion tombstone.
- Expanded the manual faction-control override from Rantel Waystations to every body available in the Celestial Bodies Editor.
- Manual overrides now replace both POI and sector-derived control for the selected body and distribute its Strategic Weight by GM-entered percentages.
- Manually controlled linked moons, stations, and satellites can contribute their Strategic Weight to an automatic parent-body calculation.

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
