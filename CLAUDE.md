# CLAUDE.md — JahtiPro

## MCP Connectors (use directly — do NOT ask the user to copy-paste)

### Supabase MCP
- Use for all database operations: run SQL, inspect tables, check RLS policies, view schema
- Use to verify data after inserts/updates instead of asking the user to check manually
- **Always verify column names and CHECK constraints via MCP before writing queries — this file may lag behind**

### Vercel MCP
- Use to check build/deployment logs directly
- Use to trigger redeploys if needed
- Never ask the user to copy-paste build output — fetch it via MCP

---

## Project Overview

Finnish hunting club management app. Next.js 16 + Supabase + Tailwind CSS v4.

**Stack:** Next.js App Router · React 19 · TypeScript strict · Supabase (auth + db + storage) · Tailwind v4 · Sentry (production error tracking)

**Theme:** Dark green (`green-950` → `stone-950` gradient) · Mobile-first · Finnish UI text

---

## Database Schema

> **Source of truth: Supabase MCP.** This file shows the schema in summary; verify exact columns and CHECK constraints via MCP before writing queries.

### Core tables

| Table | Tärkeimmät sarakkeet |
|-------|----------------------|
| `clubs` | `id`, `name`, `location`, `business_id`, `street_address`, `postal_address`, `email`, `phone`, `mobile`, `is_demo`, `demo_expires_at` |
| `profiles` | `id`, `club_id`, `active_club_id`, `full_name`, `email`, `phone`, `role`, `member_status`, `member_number`, `member_type`, `birth_date`, `street_address`, `postal_code`, `city`, `home_municipality`, `billing_method`, `additional_info`, `dev_access`, `last_seen_at`, `total_sessions`, `join_date` |
| `club_members` | `id`, `club_id`, `profile_id`, `role` (enum), `status` (enum), `joined_at` |
| `bookings` | `id`, `club_id`, `profile_id`, `starts_on`, `ends_on`, `note` |
| `payments` | `id`, `club_id`, `profile_id`, `description`, `amount_cents` (÷100 = €), `due_date`, `paid_at`, `status`, `sent_at` |
| `documents` | `id`, `club_id`, `uploaded_by`, `name`, `category`, `storage_path` |
| `events` | `id`, `club_id`, `title`, `description`, `type`, `starts_at`, `ends_at` |
| `saalis` | `id`, `club_id`, `profile_id`, `elain`, `maara`, `sukupuoli`, `ika_luokka`, `paikka`, `kuvaus`, `pvm` |

### Subscription & billing
`subscriptions`, `plan_limits`, `jahtipro_invoices`, `club_bank_accounts`

### Admin & analytics
`audit_events`, `activity_log`, `feedback`, `gdpr_requests`, `superadmin_notes`, `operator_notes`

### CRM & sales
`crm_contacts`, `crm_activities`, `email_sequences`, `email_sends`, `sales_pipeline`, `launch_signups`, `registration_requests`

### Development
`dev_tasks`, `dev_comments`

### Other
`harvest_reports`, `cabin_bookings`, `cabin_info`, `map_links`, `map_credentials`, `invitations`, `member_imports`, `member_registry`, `club_groups`, `club_group_members`, `onboarding`, `rental_locations`, `rental_location_approvers`, `guest_permits`, `budget_expenses`, `budget_goals`

### CHECK constraints (verified)

- `profiles.role`: **`superadmin` | `admin` | `board_member` | `member` | `dev_partner`**
- `profiles.member_status`: `active` | `inactive` | `pending`
- `subscriptions.plan`: `start` | `plus` | `pro` | `perus` | `standardi` | `demo`
- `subscriptions.status`: `trial` | `active` | `expired` | `cancelled`
- `dev_tasks.status`: `idea` | `suunnitteilla` | `tyon_alla` | `valmis` | `arkistoitu`
- `dev_tasks.priority`: `kriittinen` | `korkea` | `normaali` | `matala`
- `dev_tasks.category`: `yleinen` | `bugi` | `ominaisuus` | `ui` | `tietokanta` | `muu`
- `audit_events.outcome`: `success` | `denied` | `error`
- `payments.status`: `paid` | `pending` | `overdue`

### Document categories
`seura_saannot` · `hirviseurue` · `peurajaosto` · `karhujaosto` · `vuosikokous` · `kesakokous` · `muu`

### Storage bucket
`documents` — path pattern: `{club_id}/{timestamp}.{ext}`

---

## Finnish Characters in DB

**ä/ö rikkoo CHECK-constraintit ja enum-arvot.** Käytä aina ASCII-vastineita constraint-arvoissa.

Esimerkki: `dev_tasks.status` käyttää `tyon_alla` — EI `työn_alla`. Sama koskee kaikkia statusarvoja, joita käytetään koodissa stringeinä.

UI-tekstit ja vapaakenttätekstit (esim. `description`, `note`, `kuvaus`) saavat ja niiden pitääkin sisältää ä/ö normaalisti.

---

## Auth Pattern

`profiles.role` ja `profiles.club_id` ovat ensisijainen pääsynhallinnan lähde. `club_members`-taulu on olemassa ja sitä käytetään monikerhojäsenyyteen, mutta useimmat auth-tarkistukset perustuvat suoraan `profiles`-riviin.

```ts
// Server component auth check
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

const { data: profile } = await supabase
  .from('profiles')
  .select('club_id, role, member_status, dev_access')
  .eq('id', user.id)
  .single()
```

### Käyttäjäportaalit ja pääsynhallinta

| Reitti | Pääsy |
|--------|-------|
| `/operaattori` | vain `role === 'superadmin'` (Pekan operaattorinäkymä) |
| `/superadmin` | vain `role === 'superadmin'` |
| `/kehitys` | `role === 'superadmin'` TAI `dev_access === true` (Jarin pääsy) |
| `/hallinto` | `role === 'admin'` tai `'board_member'` (seuran ylläpito) |
| `/jasenet` | `role === 'admin'` tai `'board_member'` |
| Dashboard, erakartano, maksut, dokumentit, tapahtumat, saalis, profiili | kaikki autentikoidut jäsenet |

Muut roolitarkistukset:
```ts
const isAdmin = profile?.role === 'admin' || profile?.role === 'board_member'
const isSuperadmin = profile?.role === 'superadmin'
const hasDevAccess = profile?.role === 'superadmin' || profile?.dev_access === true
```

---

## RLS & Admin Client

### lib/supabase/admin.ts — `createAdminClient()`

`createAdminClient()` käyttää service role -avainta ja **ohittaa RLS:n kokonaan**.

**Säännöt:**
- Käytä **VAIN** API-routeissa (`app/api/**/route.ts`) tai server-only koodissa
- **EI KOSKAAN** client componenteissa — service role ei saa päätyä selaimeen
- Tyypilliset käyttötapaukset:
  - Jäsenten hyväksyntä: `app/api/members/[id]/route.ts` (PATCH)
  - Superadmin-toiminnot: `app/api/superadmin/*`
  - Kerhon luonti: `app/api/create-club/route.ts`
  - Auth-kontekstin yli operoivat haut (esim. listaa kaikki klubit operaattorille)

### RLS-blokki client-päivityksissä

Client-side `supabase.from('profiles').update(...)` blokkaantuu RLS:ään monessa tapauksessa (esim. roolimuutokset, member_status). **Reititä admin-operaatiot API-routejen kautta käyttäen admin clientiä**, älä tee niitä suoraan client componentissa.

Esim. jäsenten hyväksyntä:
```ts
// Client component → POST /api/members/[id] → admin client → update profile
```

---

## Sentry (Production Error Tracking)

`@sentry/nextjs` on konfiguroitu tuotantoon ja **GDPR-yhteensopiva**.

**Tiedostot:**
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation-client.ts`

**Konfiguraatio:**
- DSN tuotannossa, EU-region (ingest.de.sentry.io)
- `sendDefaultPii: false` — ei IP-osoitteita, ei sähköpostia
- `beforeSend` filtteröi cookies ja request bodyt
- `tracesSampleRate: 0.1`

**Virhekontekstin lisäys (TODO — ei vielä kaikkialla):**
```ts
import * as Sentry from '@sentry/nextjs'

Sentry.setTag('club_id', clubId)
Sentry.setUser({ id: profileId })  // EI emailia, EI nimeä
```

### GDPR-säännöt

- **ÄLÄ** lokaa PII-tietoja `console.error`:iin (sähköposti, nimi, osoite, puhelinnumero)
- **ÄLÄ** käytä `Sentry.captureMessage()` viestillä joka sisältää henkilötietoja — Sentry tallentaa viestin sellaisenaan
- Jos auditointi on tarpeen, kirjoita `audit_events`-tauluun (kentät: `actor_id`, `actor_role`, `club_id`, `action`, `resource_type`, `resource_id`, `outcome`, `metadata`)
- Vältä PII:n liittämistä `Sentry.setExtra`/`setContext` -arvoihin

---

## Registration Flow

`/rekisteroidy` — new club sign-up:
```ts
await supabase.auth.signUp({
  email, password,
  options: { data: { club_name: '...', full_name: '...' } },
})
```
Supabase trigger/function käyttää `raw_user_meta_data`:a luodakseen kerhon + profile-rivin.

---

## Directory Structure

```
app/
  api/              # Server-side API routes (admin client lives here)
    members/        # PATCH/DELETE jäsenten hallintaan
    superadmin/     # Superadmin-toiminnot
    operator/       # Operaattorin toiminnot
    payments/, feedback/, gdpr/, ...
  auth/             # Auth callback handlers
  components/       # Shared React components
  dashboard/        # Hub
  login/            # Login + link to /rekisteroidy
  rekisteroidy/     # New club registration
  liity/            # Liity olemassa olevaan kerhoon
  onboarding/       # Onboarding wizard
  mfa-verify/       # MFA-vahvistus
  reset-password/   # Salasanan palautus
  vaihda-seura/     # Active club switcher (active_club_id)
  profiili/         # Oma profiili
  tietosuoja/       # Tietosuojaseloste / GDPR
  erakartano/       # Cabin bookings
  jasenet/          # Members (admin/board only)
  maksut/           # Own payments
  laskut/           # Invoices
  metsastajille/    # Documents
  dokumentit/       # Re-exports metsastajille/page
  hallinto/         # Admin panel
  tapahtumat/       # Events
  saalis/           # Hunt reports
  vierasluvat/      # Guest permits
  karttatunnukset/  # Map credentials
  tilaus/           # Subscription management
  uusi/             # New club bootstrap
  superadmin/       # Superadmin dashboard (role=superadmin)
  operaattori/      # Operator dashboard (role=superadmin)
  kehitys/          # Dev tasks board (superadmin or dev_access)
  demo/             # Demo-tilan sivut
  global-error.tsx  # Sentry-yhteensopiva error boundary
lib/supabase/
  server.ts         # createClient() server componenteille
  browser.ts        # createClient() client componenteille
  admin.ts          # createAdminClient() — service role, vain API-routeissa
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

## Git-työnkulku

**Default branch:** `main` (tuotanto = jahtipro.fi)

Jokainen tehtävä omaan haaraan:
- `feature/` — uusille ominaisuuksille
- `fix/` — korjauksille
- `chore/` — siivoukselle ja dokumentaatiolle

### Työnkulku

1. Luo feature-haara **main:n päälle** (älä `claude/`-haaroihin)
2. Tee muutokset, committoi kuvaavalla viestillä
3. Pushaa haara: `git push -u origin <haaran-nimi>`
4. Luo PR main-haaraa vasten
5. **ÄLÄ MERGEÄ AUTOMAATTISESTI** — käyttäjä testaa preview-deployssa ensin
6. Käyttäjä mergeä manuaalisesti GitHubin "Merge pull request" -napilla

### Vercel-deployment

- Jokainen PR → Preview deploy
- main-merge → Production deploy (jahtipro.fi)

### Säännöt

- **ÄLÄ** käytä `gh pr merge --auto` tai vastaavia auto-merge-komentoja
- **ÄLÄ** pushaa main-haaraan suoraan
- Pushaa vain `feature/`/`fix/`/`chore/`-haaroihin
- Ilmoita käyttäjälle PR-linkki kun valmis
