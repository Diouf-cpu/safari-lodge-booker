-- Enable scheduled jobs and HTTP calls for the nightly accounts handoff
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;