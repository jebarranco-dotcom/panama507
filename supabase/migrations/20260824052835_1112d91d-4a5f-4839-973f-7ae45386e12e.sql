-- Estado de conexión por empresa y red (visible para miembros, sin secretos)
CREATE TABLE public.conexiones_redes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  red text NOT NULL CHECK (red IN ('facebook','instagram','tiktok')),
  proveedor text NOT NULL CHECK (proveedor IN ('meta','tiktok')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','autorizada','conectada','error')),
  cuenta_externa_id text NOT NULL DEFAULT '',
  cuenta_externa_nombre text NOT NULL DEFAULT '',
  permisos_otorgados text[] NOT NULL DEFAULT '{}',
  permisos_faltantes text[] NOT NULL DEFAULT '{}',
  detalle text NOT NULL DEFAULT '',
  autorizada_at timestamptz,
  expira_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, red)
);

GRANT SELECT ON public.conexiones_redes TO authenticated;
GRANT ALL ON public.conexiones_redes TO service_role;
ALTER TABLE public.conexiones_redes ENABLE ROW LEVEL SECURITY;

CREATE POLICY conexiones_redes_lectura ON public.conexiones_redes
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = conexiones_redes.empresa_id AND eu.user_id = auth.uid()));

CREATE TRIGGER conexiones_redes_updated_at BEFORE UPDATE ON public.conexiones_redes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bitácora de trazabilidad de estados
CREATE TABLE public.conexiones_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  red text NOT NULL,
  estado text NOT NULL,
  mensaje text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.conexiones_eventos TO authenticated;
GRANT ALL ON public.conexiones_eventos TO service_role;
ALTER TABLE public.conexiones_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY conexiones_eventos_lectura ON public.conexiones_eventos
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = conexiones_eventos.empresa_id AND eu.user_id = auth.uid()));

-- Tokens de acceso: solo servidor, nunca accesibles desde el navegador
CREATE TABLE public.conexiones_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  red text NOT NULL,
  access_token_cifrado text NOT NULL,
  refresh_token_cifrado text,
  expira_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, red)
);

GRANT ALL ON public.conexiones_tokens TO service_role;
ALTER TABLE public.conexiones_tokens ENABLE ROW LEVEL SECURITY;

-- Credenciales de app por empresa: solo servidor; el panel ve metadatos vía función de servidor
CREATE TABLE public.app_credenciales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  proveedor text NOT NULL CHECK (proveedor IN ('meta','tiktok')),
  client_id text NOT NULL,
  client_secret_cifrado text NOT NULL,
  pista_secreto text NOT NULL DEFAULT '',
  actualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, proveedor)
);

GRANT ALL ON public.app_credenciales TO service_role;
ALTER TABLE public.app_credenciales ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER app_credenciales_updated_at BEFORE UPDATE ON public.app_credenciales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Estado inicial por empresa activa
INSERT INTO public.conexiones_redes (empresa_id, red, proveedor, detalle)
SELECT e.id, r.red, r.proveedor, 'Pendiente de autorización oficial'
FROM public.empresas e
CROSS JOIN (VALUES ('facebook','meta'),('instagram','meta'),('tiktok','tiktok')) AS r(red, proveedor)
ON CONFLICT (empresa_id, red) DO NOTHING;