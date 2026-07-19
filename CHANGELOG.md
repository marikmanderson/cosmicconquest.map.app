# Cosmic Conquest Atlas Changelog

## v0.5.2
- Added Hidden Notes editing to the Admin Quick Edit POI dialog without exposing the field to Command accounts.
- Added live 12 × 6 grid coordinates for Flat Map and Globe View hover/click positions.
- Added map coordinates beneath selected POI and terrain names in the Selected Asset panel.

## v0.5.1
- Fixed Planet Theater globe view for uploaded moon textures by routing moon globe rendering through the optimized Canvas projection path.
- Added a browser tab favicon using the GAR logo already shown in the Atlas header.


## v0.5.0-prototype
- Restored uploaded moon textures in System View while keeping full-resolution Planet Theater maps lazy-loaded.
- Added cached off-screen sprites for stars, planets, and moons so textured bodies are not rebuilt every animation frame.
- Converted the decorative Rantel asteroid belt into a cached visual layer, preserving its appearance while removing hundreds of repeated draw calls.
- Added a WebGL globe projector for GPU-accelerated rotation, with the existing Canvas renderer retained as an automatic fallback.
- Reduced Flat Map texture scaling work by drawing from the existing 2048×1024 render texture.
- Cached Planet Theater background stars and grid lines.
- Throttled hover-card work, coalesced resize handling, and skipped unchanged panel/list rebuilds.
- Prevented hidden Logistics and Admin views from performing heavy DOM renders.
- Removed expensive live full-panel backdrop blur and full-screen blend operations while preserving the glass-panel appearance.
- Preserved the per-account **Revert My Last Save** feature from v0.4.9.

## v0.4.9-prototype
- Added a per-account **Revert My Last Save** control in Settings.
- Revert stores only the user’s most recent save on that browser and applies a field-aware reverse merge, preserving fields changed by other users afterward.
- Stopped rendering the hidden System View while Planet Theater, Logistics, or Admin Console is active.
- Capped System View animation at 30 FPS, with a higher temporary drag rate for responsiveness.
- Suspended canvas work while the browser tab is hidden.
- Added cached starfield, asteroid descriptors, strategic-control results, and sector-bonus calculations.
- Reduced canvas device-pixel rendering overhead on high-DPI displays.
- Avoided rebuilding Admin and Logistics panels when their tabs are not active.
- Added CSS layout/paint containment and off-screen list rendering optimizations.
