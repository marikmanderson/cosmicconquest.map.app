# Cosmic Conquest Atlas — Changelog

## v0.3.8-prototype
- Fixed dark/black pole caps on System View planet models by covering the full globe with the stylized texture signature.
- Removed redundant Terrain and POIs checkboxes from the Planet Theater sidebar.
- Admin/Root quick-create now uses middle mouse on open map territory; right-click remains for existing POI quick-edit/delete.
- Optimized Planet Theater globe rendering by using downscaled render textures instead of the full 8K source during live projection.
- Removed the old getImageData texture-read path that was no longer needed.
- Added adaptive globe sampling for smoother interaction while preserving a clean final render.
