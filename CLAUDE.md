# CLAUDE.md — JahtiPro

## MCP Connectors (use directly — do NOT ask the user to copy-paste)

### Supabase MCP
- Use for all database operations: run SQL, inspect tables, check RLS policies, view schema
- Use to verify data after inserts/updates instead of asking the user to check manually
- **Always verify column names via MCP before writing queries — this file may lag behind**

### Vercel MCP
- Use to check build/deployment logs directly
- Use to trigger redeploys if needed
- Never ask the user to copy-paste build output — fetch it via MCP

---

## Project Overview

Finnish hunting club management app. Next.js 16 + Supabase + Tailwind CSS v4.

**Stack:** Next.js App Router · React 19 · TypeScript strict · Supabase (auth + db + storage) · Tailwind v4

**Theme:** Dark green (`green-950` → `stone-950` gradient) · Mobile-first · Finnish UI text

---

## Real Database Schema

> **Source of truth: Supabase MCP. Use MCP to verify before writing queries.**

| Table | Columns |
|-------|---------|
| `profiles` | `id`, `club_id`, `full_name`, `email`, `phone`, `role`, `member_status`, `join_date` |
| `bookings` | `id`, `club_id`, `profile_id`, `starts_on`, `ends_on`, `note` |
| `payments` | `id`, `club_id`, `profile_id`, `description`, `amount_cents` (÷100 = €), `due_date`, `paid_at`, `status` |
| `documents` | `id`, `club_id`, `uploaded_by`, `name`, `category`, `storage_path` |
| `events` | `id`, `club_id`, `title`, `description`, `type`, `starts_at`, `ends_at` |
| `saalis` | `id`, `club_id`, `profile_id`, `elain`, `maara`, `sukupuoli`, `ika_luokka`, `paikka`, `kuvaus`, `pvm` |

**profiles.role values:** `admin` | `board_member` | `member`
**profiles.member_status values:** `active` | `pending` | `inactive`
**payments.status values:** `paid` | `pending` | `overdue`
**payments.amount_cents:** stored in cents, divide by 100 for euros display

### Document categories
`seura_saannot` · `hirviseurue` · `peurajaosto` · `karhujaosto` · `vuosikokous` · `kesakokous` · `muu`

### Storage bucket
`documents` — path pattern: `{club_id}/{timestamp}.{ext}`

---

## Auth Pattern

**No `club_members` table.** Role and club are stored directly on `profiles`.

```ts
// Server component auth check
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

const { data: profile } = await supabase
  .from('profiles')
  .select('club_id, role, member_status')
  .eq('id', user.id)
  .single()

// Role check
const isAdmin = profile?.role === 'admin' || profile?.role === 'board_member'
```

**Access rules:**
- All authenticated members: dashboard, erakartano, maksut, metsastajille, dokumentit, tapahtumat, saalis
- `board_member` + `admin` only: jasenet (redirect others to /dashboard), hallinto

---

## Registration Flow

`/rekisteroidy` — new club sign-up:
```ts
await supabase.auth.signUp({
  email, password,
  options: { data: { club_name: '...', full_name: '...' } },
})
```
A Supabase trigger/function uses `raw_user_meta_data` to create the club + profile row.

---

## Directory Structure

```
app/
  dashboard/        # Hub (server) + logout-button (client)
  login/            # Login page — has link to /rekisteroidy
  rekisteroidy/     # New club registration (client)
  erakartano/       # Cabin bookings — page, booking-form, delete-booking-button
  jasenet/          # Members (board/admin only) — page, member-search
  maksut/           # Own payments (server)
  metsastajille/    # Documents — server page
  dokumentit/       # Re-exports metsastajille/page
  hallinto/         # Admin panel — page, admin-panel, tab-members, tab-payments, tab-documents
  tapahtumat/       # Events — page, new-event-form, delete-event-button
  saalis/           # Hunt reports — page, new-saalis-form, delete-saalis-button
lib/supabase/
  server.ts         # createClient() for server components
  browser.ts        # createClient() for client components
  middleware.ts     # session refresh + route protection
```

---

## TypeScript Notes

Supabase infers joined relations as arrays. Use double cast:
```ts
const rows = (data ?? []) as unknown as MyType[]
// single join field:
const name = (row.profiles as unknown as { full_name: string | null } | null)?.full_name
```

No `any` — use `unknown` as intermediate cast instead.

---

## Git

Branch: `claude/local-directory-encoding-8hL2K`

```bash
git push -u origin claude/local-directory-encoding-8hL2K
```
