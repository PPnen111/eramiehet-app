# Erämiesten App – Claude Code kehitysohje

## Sovelluksen tarkoitus
SaaS-sovellus suomalaisille metsästysseuroille.
Yksi sovellus, monta seuraa – multi-tenant arkkitehtuuri.
Ensimmäinen testiseura: Kyyjärven Erämiehet.

---

## Tech stack
- Next.js 16.1.6, App Router, TypeScript strict
- Tailwind CSS v4 (ei tailwind.config.js)
- Supabase: Auth, PostgreSQL, Storage, RLS
- Vercel deployment
- GitHub: github.com/PPnen111/eramiehet-app

---

## Testikäyttäjät
- Admin: paunonen@gmail.com (Pekka Paunonen, rooli: admin)
- Jäsen: testi@eramiehet.fi (rooli: member)

---

## Tietokanta (Supabase)

### Taulut
- clubs
- profiles (club_id, role, member_status, join_date)
- events
- hunt_registrations
- harvest_reports
- cabin_bookings
- documents
- payments
- map_links
- announcements

### RLS-pattern
club_id = (SELECT club_id FROM profiles WHERE id = auth.uid())

### Roolit
- admin, board_member, member

---

## Sivujen nykytilanne

### Toimii
- /dashboard
- /tapahtumat
- /saalis

### Tyhjät - TOTEUTA
- /erakartano
- /jasenet
- /maksut
- /metsastajille
- /hallinto

### Puuttuu - LUO
- /dokumentit
- /rekisteroidy

---

## UI-säännöt
- Dark green teema: green-950, green-900, stone-950
- Kaikki teksti suomeksi
- Mobile-first
- TypeScript strict, ei any
- Supabase join palauttaa arrayn - käytä as unknown as T

---

## Deployment
- Vercel: eramiehet-app.vercel.app
- Branch: main
- Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
