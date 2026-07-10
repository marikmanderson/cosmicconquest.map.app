# Cosmic Conquest — Osiris Command Atlas

A client-side prototype for the Cosmic Conquest interactive campaign map.

## What is in v0.3.8

- Animated Osiris System command map with planets, moons, stations, and the Rantel Cluster.
- Planet Theater with rotating globe selection for planets and moons.
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
- Planet Theater right-click while in Web Admin role: quick POI create/edit menu.
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


## v0.3.8 Notes

This pass focuses on the POI system and admin quality-of-life tools. Seeded POIs and terrain have been cleared so Web Admins can test right-click creation/editing on clean planets. The Terrain Editor has been replaced by the Celestial Bodies Editor for tuning planet/moon size, orbit spacing, and orbit speed.


## New in v0.3.8
- Added a Flat Tactical Map mode in Planet Theater.
- Flat map uses the same 2:1 equirectangular texture pipeline as the globe.
- Brekka now uses the new custom high-resolution flat/globe texture.


## New in v0.3.8
- Fixed globe texture projection when opened directly from the local file system.
- Globe View now samples the same 2:1 flat map texture directly without relying on browser-blocked canvas pixel reads.
