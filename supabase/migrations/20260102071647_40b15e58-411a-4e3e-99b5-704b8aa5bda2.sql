-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule 1: Friday morning at 8:00 AM Israel time (6:00 UTC)
SELECT cron.schedule(
  'send-shabbat-notifications-morning',
  '0 6 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://jpxyczlocqmfumkakdyx.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHljemxvY3FtZnVta2FrZHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDkzNTYsImV4cCI6MjA3NTMyNTM1Nn0.kfkSh0E57bj6DtOmkkDl3Ww-6MSkIVx4CDHDcFnx1FQ'
    ),
    body := jsonb_build_object('scheduled', true, 'timing', 'morning')
  ) AS request_id;
  $$
);

-- Schedule 2: Friday afternoon at 2:00 PM Israel time (12:00 UTC)
SELECT cron.schedule(
  'send-shabbat-notifications-afternoon',
  '0 12 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://jpxyczlocqmfumkakdyx.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHljemxvY3FtZnVta2FrZHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDkzNTYsImV4cCI6MjA3NTMyNTM1Nn0.kfkSh0E57bj6DtOmkkDl3Ww-6MSkIVx4CDHDcFnx1FQ'
    ),
    body := jsonb_build_object('scheduled', true, 'timing', 'afternoon')
  ) AS request_id;
  $$
);