-- Token de usuario del sistema Meta, separado del App Secret.
-- Se almacena cifrado por empresa y proveedor; nunca se devuelve al navegador.
alter table public.app_credenciales
  add column if not exists system_user_token_cifrado text;

comment on column public.app_credenciales.system_user_token_cifrado is
  'Token Meta System User cifrado; solo lo usa el backend para operaciones autorizadas.';
