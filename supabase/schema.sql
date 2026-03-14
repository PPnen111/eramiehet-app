-- =====================================================
-- Kyyjärven Erämiehet – Supabase tietokantarakenne
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

-- 4. Seed: Kyyjärven Erämiehet -seura
insert into public.clubs (name) values ('Kyyjärven Erämiehet');

-- =====================================================
-- Trigger: luo profile ja lisää seuraan automaattisesti
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_club_id uuid;
begin
  -- Luo profiili
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  -- Lisää Kyyjärven Erämiehet -seuraan automaattisesti
  select id into v_club_id
  from public.clubs
  where name = 'Kyyjärven Erämiehet'
  limit 1;

  if v_club_id is not null then
    insert into public.club_members (profile_id, club_id, role, status)
    values (new.id, v_club_id, 'member', 'active');
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
