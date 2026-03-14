-- =====================================================
-- Metsästysseuran sovellus – Supabase tietokantarakenne
-- Aja tämä Supabase → SQL Editor → Run
-- =====================================================

-- 1. Profiles-taulu (linkitetty auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  updated_at timestamptz default now()
);

-- 2. Clubs-taulu
create table public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 3. Club members -taulu
create table public.club_members (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  role text check (role in ('admin', 'board_member', 'member')) default 'member',
  status text check (status in ('active', 'inactive', 'pending')) default 'pending',
  created_at timestamptz default now(),
  unique(profile_id, club_id)
);

-- 4. Seed: esimerkki seuran luomisesta (EI ajeta tuotannossa)
-- insert into public.clubs (name) values ('Kyyjärven Erämiehet');

-- =====================================================
-- Trigger: luo profile ja käsittele seuraonboarding
-- =====================================================
-- Onboarding-logiikka raw_user_meta_data-kentän perusteella:
--
--   club_name  → luo uusi seura tällä nimellä, käyttäjä saa roolin 'admin'
--   club_id    → liitä käyttäjä olemassa olevaan seuraan, rooli 'member', status 'pending'
--   (ei kumpikaan) → luo vain profiili, ei seurayhteyttä
--
-- Esimerkki SignUp-kutsussa:
--   options: { data: { full_name: 'Matti', club_name: 'Uusi Seura ry' } }
--   options: { data: { full_name: 'Matti', club_id: '<uuid>' } }

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_club_id uuid;
  v_club_name text;
  v_member_count integer;
begin
  -- Luo profiili
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  v_club_name := new.raw_user_meta_data->>'club_name';
  v_club_id   := (new.raw_user_meta_data->>'club_id')::uuid;

  if v_club_name is not null then
    -- Uusi seura: rekisteröijä saa admin-roolin
    insert into public.clubs (name)
    values (v_club_name)
    returning id into v_club_id;

    insert into public.club_members (profile_id, club_id, role, status)
    values (new.id, v_club_id, 'admin', 'active');

  elsif v_club_id is not null then
    -- Liittyminen olemassa olevaan seuraan: jää pending-tilaan (admin hyväksyy)
    insert into public.club_members (profile_id, club_id, role, status)
    values (new.id, v_club_id, 'member', 'pending');
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;

-- Profiles: käyttäjä voi lukea ja muokata omaa profiiliaan
create policy "Own profile" on public.profiles
  for all using (auth.uid() = id);

-- Clubs: kaikki kirjautuneet näkevät seurat
create policy "All members see clubs" on public.clubs
  for select using (auth.role() = 'authenticated');

-- Club members: näkee oman seuran jäsenet
create policy "See own club members" on public.club_members
  for select using (
    club_id in (
      select club_id from public.club_members where profile_id = auth.uid()
    )
  );

-- Club members: voi lisätä itsensä seuraan
create policy "Insert own membership" on public.club_members
  for insert with check (profile_id = auth.uid());

-- =====================================================
-- Saalisilmoitukset
-- =====================================================
create table public.saalis (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  reporter_name text,
  elain text not null,
  maara integer default 1,
  sukupuoli text check (sukupuoli in ('uros', 'naaras', 'tuntematon')) default 'tuntematon',
  ika_luokka text check (ika_luokka in ('vasa', 'nuori', 'aikuinen', 'tuntematon')) default 'tuntematon',
  paikka text,
  kuvaus text,
  pvm date not null default current_date,
  created_at timestamptz default now()
);

alter table public.saalis enable row level security;

create policy "Club members see saalis" on public.saalis
  for select using (
    club_id in (
      select club_id from public.club_members where profile_id = auth.uid()
    )
  );

create policy "Insert own saalis" on public.saalis
  for insert with check (profile_id = auth.uid());

create policy "Delete own or admin saalis" on public.saalis
  for delete using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = saalis.club_id
      and role in ('admin', 'board_member')
    )
  );

-- =====================================================
-- Mökkivaraukset (Eräkartano)
-- =====================================================
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  booker_name text,
  starts_on date not null,
  ends_on date not null,
  note text,
  created_at timestamptz default now(),
  constraint ends_after_starts check (ends_on >= starts_on)
);

alter table public.bookings enable row level security;

create policy "Club members see bookings" on public.bookings
  for select using (
    club_id in (
      select club_id from public.club_members
      where profile_id = auth.uid() and status = 'active'
    )
  );

create policy "Insert own booking" on public.bookings
  for insert with check (profile_id = auth.uid());

create policy "Delete own or admin booking" on public.bookings
  for delete using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = bookings.club_id
      and role in ('admin', 'board_member')
    )
  );

-- =====================================================
-- Maksut
-- =====================================================
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  description text not null,
  amount_cents integer not null,
  due_date date,
  paid_at timestamptz,
  status text check (status in ('paid', 'pending', 'overdue')) default 'pending',
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "See own payments" on public.payments
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = payments.club_id
      and role in ('admin', 'board_member')
    )
  );

create policy "Admin inserts payments" on public.payments
  for insert with check (
    exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = payments.club_id
      and role in ('admin', 'board_member')
    )
  );

create policy "Admin updates payments" on public.payments
  for update using (
    exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = payments.club_id
      and role in ('admin', 'board_member')
    )
  );

-- =====================================================
-- Dokumentit
-- =====================================================
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  category text not null default 'muu',
  storage_path text not null,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Club members see documents" on public.documents
  for select using (
    club_id in (
      select club_id from public.club_members
      where profile_id = auth.uid() and status = 'active'
    )
  );

create policy "Admin inserts documents" on public.documents
  for insert with check (
    exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = documents.club_id
      and role in ('admin', 'board_member')
    )
  );

create policy "Admin deletes documents" on public.documents
  for delete using (
    exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
      and club_id = documents.club_id
      and role in ('admin', 'board_member')
    )
  );

-- Club members: admin voi muokata jäsentietoja
create policy "Admin updates club members" on public.club_members
  for update using (
    exists (
      select 1 from public.club_members cm2
      where cm2.profile_id = auth.uid()
      and cm2.club_id = club_members.club_id
      and cm2.role in ('admin', 'board_member')
    )
  );

create policy "Admin deletes club members" on public.club_members
  for delete using (
    exists (
      select 1 from public.club_members cm2
      where cm2.profile_id = auth.uid()
      and cm2.club_id = club_members.club_id
      and cm2.role in ('admin', 'board_member')
    )
  );
