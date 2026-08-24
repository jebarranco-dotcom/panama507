ALTER TABLE public.publicaciones
  ADD COLUMN IF NOT EXISTS media_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS referencia_externa text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS error_publicacion text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS intentos_publicacion integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aprobada_at timestamptz,
  ADD COLUMN IF NOT EXISTS aprobada_por uuid;

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS requiere_aprobacion boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS publicaciones_estado_fecha_idx
  ON public.publicaciones (empresa_id, estado, fecha_programada);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publicador-programado') THEN
    PERFORM cron.unschedule('publicador-programado');
  END IF;
END $$;

SELECT cron.schedule(
  'publicador-programado',
  '*/10 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--2d59501b-39dd-4b6c-a079-b7c875bf56cc.lovable.app/api/public/hooks/publicar-programado',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_6iAhqYzbVDGDuUZdp0fmWw_qeCx7ruV"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $cron$
);