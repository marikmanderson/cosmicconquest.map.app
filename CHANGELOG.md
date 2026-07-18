# Cosmic Conquest Atlas — Changelog

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
