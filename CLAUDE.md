# CLAUDE.md — Erämiehet App

## MCP Connectors (use directly — do NOT ask the user to copy-paste)

### Supabase MCP
- Use for all database operations: run SQL, inspect tables, check RLS policies, view schema
- Use to verify data after inserts/updates instead of asking the user to check manually
- Use to check table columns before writing queries (source of truth for schema)

### Vercel MCP
- Use to check build/deployment logs directly
- Use to trigger redeploys if needed
- Use to inspect environment variables (names only, not values)
- Never ask the user to copy-paste build output — fetch it via MCP

---

## Project Overview

Finnish hunting club management app. Next.js 16 + Supabase + Tailwind CSS v4.

**Stack:** Next.js App Router · React 19 · TypeScript · Supabase (auth + db + storage) · Tailwind v4

**Theme:** Dark green (`green-950` → `stone-950` gradient) · Mobile-first · Finnish UI text

---

## Directory Structure

```
app/
  dashboard/        # Hub page (server) + logout-button (client)
  login/            # Auth page (client, email/password)
  erakartano/       # Cabin bookings — page, booking-form, delete-booking-button
  jasenet/          # Member list (board/admin only) — page, member-search
  maksut/           # Own payments — page (server)
  metsastajille/    # Documents for hunters — page (server)
  dokumentit/       # Re-exports metsastajille/page (all members can access)
  hallinto/         # Admin panel (board/admin) — page, admin-panel, tab-members, tab-payments, tab-documents
  tapahtumat/       # Events — page, new-event-form, delete-event-button
  saalis/           # Hunt reports — page, new-saalis-form, delete-saalis-button
lib/
  supabase/
    server.ts       # createClient() for server components
    browser.ts      # createClient() for client components
    middleware.ts   # session refresh + route protection
```

---

## Database Schema (Supabase — verify via MCP before writing queries)

| Table | Key columns |
|-------|-------------|
| `profiles` | `id`, `full_name`, `phone`, `join_date` |
| `club_members` | `id`, `profile_id`, `club_id`, `role` (admin/board_member/member), `status` (active/pending/inactive) |
| `clubs` | `id`, `name` |
| `bookings` | `id`, `club_id`, `profile_id`, `booker_name`, `starts_on`, `ends_on`, `note` |
| `payments` | `id`, `club_id`, `profile_id`, `payment_type`, `amount`, `due_at`, `paid_at`, `status`, `notes` |
| `documents` | `id`, `club_id`, `name`, `category`, `storage_path`, `created_at` |
| `events` | `id`, `club_id`, `title`, `description`, `type`, `starts_at` |
| `saalis` | `id`, `club_id`, `profile_id`, `elain`, `maara`, `sukupuoli`, `ika_luokka`, `pvm`, `paikka`, `kuvaus` |

### Document categories
`seura_saannot` · `hirviseurue` · `peurajaosto` · `karhujaosto` · `vuosikokous` · `kesakokous`

### Storage bucket
`documents` — path pattern: `{club_id}/{timestamp}.{ext}`

---

## Auth & Role Patterns

```ts
// Server component auth check
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

// Membership + role check
const { data: mem } = await supabase
  .from('club_members')
  .select('club_id, role')
  .eq('profile_id', user.id)
  .eq('status', 'active')
  .single()
```

**Access rules:**
- All authenticated active members: dashboard, erakartano, maksut, metsastajille, dokumentit, tapahtumat, saalis
- `board_member` + `admin` only: jasenet, hallinto

---

## TypeScript Notes

Supabase returns joined relations as arrays in its inferred types even for single-row joins. Use double cast:
```ts
const rows = (data ?? []) as unknown as MyType[]
// or for a single join:
const val = (row.relation as unknown as { field: string } | null)?.field
```

---

## Git

Branch: `claude/local-directory-encoding-8hL2K`

```bash
git push -u origin claude/local-directory-encoding-8hL2K
```
