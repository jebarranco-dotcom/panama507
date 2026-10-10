CREATE OR REPLACE FUNCTION public.programar_hora_publicacion(_empresa uuid, _hora text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $fn$
DECLARE
  h int := split_part(_hora, ':', 1)::int;
  m int := split_part(_hora, ':', 2)::int;
  nombre text := 'publicar-hora-' || _empresa::text;
  comando text;
BEGIN
  IF h < 0 OR h > 23 OR m < 0 OR m > 59 THEN RAISE EXCEPTION 'Hora inválida'; END IF;
  SELECT replace(command, 'publicar-programado', 'publicar-programado') INTO comando
    FROM cron.job WHERE jobname = 'publicador-programado';
  IF comando IS NULL THEN RAISE EXCEPTION 'No existe el publicador base'; END IF;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = nombre;
  -- Panamá es UTC-5 todo el año.
  PERFORM cron.schedule(nombre, format('%s %s * * *', m, (h + 5) % 24), comando);
  RETURN format('%s %s * * *', m, (h + 5) % 24);
END;
$fn$;
REVOKE ALL ON FUNCTION public.programar_hora_publicacion(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.programar_hora_publicacion(uuid, text) TO service_role;