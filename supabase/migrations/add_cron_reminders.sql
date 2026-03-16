-- Enable required extensions (run once per project, safe to re-run)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- ---------------------------------------------------------------------------
-- Daily payment reminder cron job
-- Runs at 06:00 UTC = 08:00 Finnish winter time (UTC+2)
--
-- BEFORE RUNNING: replace the placeholder values below:
--   APP_URL       → your Vercel deployment URL, e.g. https://eramiehet.vercel.app
--   CRON_SECRET   → the value of your CRON_SECRET environment variable in Vercel
-- ---------------------------------------------------------------------------

select cron.schedule(
  'send-payment-reminders',   -- job name (unique)
  '0 6 * * *',                -- every day at 06:00 UTC
  $$
    select
      net.http_post(
        url     := 'APP_URL/api/send-reminders',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer CRON_SECRET'
        ),
        body    := '{}'::jsonb
      )
  $$
);

-- To verify the job was created:
-- select * from cron.job;

-- To remove the job if needed:
-- select cron.unschedule('send-payment-reminders');
