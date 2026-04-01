-- Add dev_access flag to profiles
-- Safe to run multiple times (IF NOT EXISTS)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dev_access boolean NOT NULL DEFAULT false;

-- Dev tasks kanban board
CREATE TABLE IF NOT EXISTS public.dev_tasks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'idea'
                CHECK (status IN ('idea', 'suunnitteilla', 'työn_alla', 'valmis', 'hylätty')),
  priority    text NOT NULL DEFAULT 'normaali'
                CHECK (priority IN ('kriittinen', 'korkea', 'normaali', 'matala')),
  category    text NOT NULL DEFAULT 'yleinen'
                CHECK (category IN ('bugi', 'ominaisuus', 'ui', 'tietokanta', 'yleinen', 'muu')),
  sort_order  integer,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- Dev task comments
CREATE TABLE IF NOT EXISTS public.dev_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES public.dev_tasks(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  message    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS disabled — these tables are accessed exclusively via the service-role admin client
ALTER TABLE public.dev_tasks    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_comments DISABLE ROW LEVEL SECURITY;
