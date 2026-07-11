# Logistics Design Decisions

1. Shared data: Supabase-backed, with local browser fallback for development.
2. Weekly income: the calculated allowance is granted directly to every company, up to each company cap.
3. Caps: one global default with optional per-company overrides.
4. Account access: Discord OAuth; Root assigns each account a site role and company. Command users requisition only for their assigned company.
5. Duplicate assets: grouped by catalog name while preserving individual unit conditions.
6. Salvage: Admin/Root chooses 10%–50% at salvage time, defaulting to the configured percentage. Refunds use the current catalog value and round upward.
7. Critical/Decisive requisition sites: use the Major value.
8. Shared atlas: anonymous viewers receive sanitized public map data; Admin/Root receive private GM data; Command can publish Tactical Point POIs only.
9. Custom uploaded moon textures: stored in Supabase Storage and referenced by shared URLs.
10. Initial companies: Dorn Company, Makeshift Company, Vixus Company, and 4th Company.
11. Initial catalog: the Ground, Air, Base, and General asset lists provided for v0.4.0.
