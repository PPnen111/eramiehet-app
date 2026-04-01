-- Fix status constraint: replace työn_alla (contains ö, prone to encoding issues)
-- with ASCII-safe value tyon_alla
ALTER TABLE public.dev_tasks DROP CONSTRAINT IF EXISTS dev_tasks_status_check;

UPDATE public.dev_tasks SET status = 'tyon_alla' WHERE status = 'työn_alla';

ALTER TABLE public.dev_tasks
  ADD CONSTRAINT dev_tasks_status_check
  CHECK (status IN ('idea', 'suunnitteilla', 'tyon_alla', 'valmis', 'hylätty'));
