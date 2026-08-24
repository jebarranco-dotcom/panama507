alter table public.app_credenciales
  add column if not exists verificada_at timestamptz,
  add column if not exists verificacion_detalle text not null default '';