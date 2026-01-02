-- Remove the old duplicate cron job
SELECT cron.unschedule(1);