-- Idempotencia de la generación diaria.
-- Una empresa puede tener como máximo una pieza por red para cada fecha operativa.
CREATE UNIQUE INDEX IF NOT EXISTS publicaciones_empresa_fecha_red_key
  ON public.publicaciones (empresa_id, fecha_programada, red);
