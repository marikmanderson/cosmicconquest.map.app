# Shared Atlas + Logistics Setup (Supabase + Discord)

The site still works in local testing mode, but production deployment should use Supabase so every viewer sees the same galaxy map and every company sees the same logistics data.

## 1. Create or update the Supabase project

### Fresh Supabase project

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. In **Project Settings → API**, copy the project URL and publishable/anon key.
5. Put those values into `data/backend-config.js` and set `enabled: true`.

### Existing v0.4.0 database

Run:

```text
supabase/v0.4.1_migration.sql
```

Do not run the migration on a blank project; use the full schema instead.

Never place the Supabase service-role key in the webpage. The browser uses the publishable/anon key, while Row Level Security and database functions enforce permissions.

## 2. Configure Discord login

1. Create an application in the Discord Developer Portal.
2. Under OAuth2, add the Supabase callback URL shown in **Supabase → Authentication → Providers → Discord**.
3. Enter the Discord Client ID and Client Secret in the Supabase Discord provider settings.
4. Add the published GitHub Pages URL to Supabase's allowed redirect URLs.
5. Update `discordRedirectUrl` in `data/backend-config.js` when needed.

The first Discord account begins as Viewer. Promote the first Root account directly in Supabase:

```sql
update public.profiles set app_role='root' where id='<USER UUID>';
```

After that, Root can assign roles and companies from **Admin Console → Discord Account Assignments**.

## 3. Shared galaxy map behavior

- Anonymous viewers load a shared, sanitized atlas state from Supabase.
- Admin and Root accounts load the full atlas, including hidden Intel and GM notes.
- Admin and Root map edits publish the complete atlas state.
- Command accounts can publish Tactical Point POI changes only.
- Changes are delivered to other open clients through Supabase Realtime.
- The first authenticated Admin or Root account initializes an empty shared atlas from the current local map.

The database stores separate public and private atlas states. Hidden POIs, hidden terrain, hidden sectors, and GM-only POI notes are removed from the anonymous public copy.

Custom uploaded moon maps are uploaded to the public `atlas-textures` Storage bucket. The included configuration accepts PNG, JPEG, and WebP files up to 50 MB. For larger 8K PNG files, compress them to WebP or optimize the PNG before upload.

Sign in before making production map edits. Local edits made while signed out remain browser-local and are not published automatically.

## 4. Weekly requisition automation

The schema creates a daily Cron check. `run_weekly_requisition(false)` has a seven-day guard, so only one automatic weekly grant occurs.

The calculated weekly value is granted directly to **each company**, up to that company's cap. There is no central Republic pool.

Admin/Root map changes schedule a Resource and Production Site snapshot sync while the site is open. Before relying on the first scheduled grant, press **Sync Site Snapshot** once in the Admin Console.

## 5. GitHub Pages

Commit the updated files to the same repository. GitHub Pages continues serving the static website; Supabase supplies:

- Discord authentication
- shared galaxy-map storage
- shared company logistics
- uploaded moon texture storage
- realtime updates
- weekly requisition automation
