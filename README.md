# Cosmic Conquest — Osiris Command Atlas

The Cosmic Conquest interactive campaign atlas and shared logistics tracker.

## What is in v0.4.7

- Animated Osiris System command map with planets, moons, stations, and the Rantel Cluster.
- Rantel Cluster-only asteroid-density slider for controlling decorative System View belt population.
- Planet Theater with rotating globe selection for planets and moons.
- Shared Supabase moon textures render in both Flat Map and Globe View and can be replaced from the Celestial Bodies Editor.
- Clean POI testing state: all seeded POIs and seeded terrain have been removed.
- Web Admin quick POI workflow from Planet Theater:
  - Right-click empty globe territory to quick-create a POI.
  - Right-click an existing POI to quick-edit, open the full Admin Console editor, or delete it.
- POI editor with previewable icon selection instead of model templates.
- Strategic Tier dropdown plus numeric Strategic Value and Tactical Value fields.
- Faction ownership, visibility, and briefing text support for POIs.
- Public intel vs. hidden/GM-only visibility behavior.
- JSON export/import for campaign data.
- LocalStorage persistence.

## Controls

- Mouse wheel: zoom in/out around the cursor.
- System View left-drag: pan the system map. A short left-click selects assets.
- Planet Theater left-drag: rotate the globe.
- Planet Theater Shift + left-drag, right-drag, or middle-drag: pan the theater camera.
- Planet Theater middle-click while in Command/Admin/Root role: quick-create a POI. Command is restricted to Tactical Points.
- Planet Theater right-click an existing POI while in Admin/Root role: quick-edit or delete.
- Planet Theater Zoom + / Zoom - / Fit buttons: quick camera controls for the selected globe.
- Reset Camera: restores both System View and Planet Theater to default scale and position.

## Running locally

Open `index.html` directly after unzipping, or run:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Notes

This is still a frontend/localStorage prototype. Export JSON before major edits if you want to preserve work between builds.


## v0.4.1 Notes

This pass focuses on the POI system and admin quality-of-life tools. Seeded POIs and terrain have been cleared so Web Admins can test right-click creation/editing on clean planets. The Terrain Editor has been replaced by the Celestial Bodies Editor for tuning planet/moon size, orbit spacing, and orbit speed.


## New in v0.4.1
- Added a Flat Tactical Map mode in Planet Theater.
- Flat map uses the same 2:1 equirectangular texture pipeline as the globe.
- Brekka now uses the new custom high-resolution flat/globe texture.


## New in v0.4.1
- Fixed globe texture projection when opened directly from the local file system.
- Globe View now samples the same 2:1 flat map texture directly without relying on browser-blocked canvas pixel reads.


## Logistics
See `LOGISTICS_DECISIONS.md` and `SUPABASE_SETUP.md` for the shared Logistics system.


## Shared deployment

Configure Supabase using `SUPABASE_SETUP.md` to enable Discord accounts, shared logistics, shared galaxy-map data, Realtime updates, and uploaded moon texture storage.


## New in v0.4.3

The Celestial Bodies Editor includes a public description field and optional faction-control override for every body. Enabled percentages must total 100% and distribute the selected body’s Strategic Weight between factions. The override replaces automatic POI and sector control for that body, while separately overridden linked bodies can contribute to an automatic parent-body calculation.

## New in v0.4.6

- Added an independent **Label Text Size** multiplier to the full POI Admin Console editor.
- Added the same control to the POI Quick Create / Quick Edit panel.
- Text size applies to POI labels in both Flat Map and Globe views without changing icon size.
- Existing POIs default to a text-size multiplier of `1.00`.


## New in v0.4.7

- Osiris can be selected in Admin Console → Celestial Bodies Editor and resized with Visual Size.
- The Selected Asset information panel now scrolls independently when its briefing is taller than the right rail.
