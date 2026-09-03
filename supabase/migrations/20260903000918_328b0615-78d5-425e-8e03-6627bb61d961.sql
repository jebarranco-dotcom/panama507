ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS referencia_externa text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS mensajes_ref_externa_unica
  ON public.mensajes (empresa_id, red, referencia_externa)
  WHERE referencia_externa <> '';

CREATE UNIQUE INDEX IF NOT EXISTS conversaciones_ref_externa_unica
  ON public.conversaciones (empresa_id, red, referencia_externa)
  WHERE referencia_externa <> '';