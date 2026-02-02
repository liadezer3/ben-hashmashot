-- Remove old cron jobs that call the wrong function
SELECT cron.unschedule(2);
SELECT cron.unschedule(3);

-- Create new cron job that runs scheduled-push every 5 minutes
SELECT cron.schedule(
  'scheduled-push-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jpxyczlocqmfumkakdyx.supabase.co/functions/v1/scheduled-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHljemxvY3FtZnVta2FrZHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDkzNTYsImV4cCI6MjA3NTMyNTM1Nn0.kfkSh0E57bj6DtOmkkDl3Ww-6MSkIVx4CDHDcFnx1FQ'
    ),
    body := jsonb_build_object('automated', true)
  ) AS request_id;
  $$
);