CREATE TABLE public.empresas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  giro text NOT NULL DEFAULT 'Alquiler y venta de propiedades inmobiliarias',
  tono text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  zonas text NOT NULL DEFAULT '',
  color_primario text NOT NULL DEFAULT '#1d4ed8',
  color_acento text NOT NULL DEFAULT '#d4af37',
  logo_url text,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.empresas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresas_lectura_publica ON public.empresas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY empresas_escritura_interna ON public.empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.empresas (id, slug, nombre, tono, whatsapp, zonas, color_primario, color_acento)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'rentelo-facil', 'RENTELO FACIL',
   'cercano, profesional y directo, con lenguaje de Panamá y sin promesas exageradas',
   '', 'Ciudad de Panamá y alrededores', '#c9a227', '#c9a227'),
  ('22222222-2222-4222-8222-222222222222', 'panama-real-estate', 'PANAMA REAL ESTATE',
   'premium, cercano y confiable, con lenguaje de Panamá y Colombia, sin promesas exageradas',
   '66801666', 'República de Panamá y Ciudad de Bogotá', '#1d4ed8', '#d4af37');

ALTER TABLE public.propiedades ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.publicaciones ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.mensajes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.colaboradores ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.cuentas_sociales ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.informes_diarios ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

UPDATE public.propiedades SET empresa_id = '11111111-1111-4111-8111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.publicaciones SET empresa_id = '11111111-1111-4111-8111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.mensajes SET empresa_id = '11111111-1111-4111-8111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.colaboradores SET empresa_id = '11111111-1111-4111-8111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.cuentas_sociales SET empresa_id = '11111111-1111-4111-8111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.informes_diarios SET empresa_id = '11111111-1111-4111-8111-111111111111' WHERE empresa_id IS NULL;

ALTER TABLE public.propiedades ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.publicaciones ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.mensajes ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.colaboradores ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.cuentas_sociales ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.informes_diarios ALTER COLUMN empresa_id SET NOT NULL;

CREATE INDEX idx_propiedades_empresa ON public.propiedades(empresa_id);
CREATE INDEX idx_publicaciones_empresa ON public.publicaciones(empresa_id, fecha_programada);
CREATE INDEX idx_mensajes_empresa ON public.mensajes(empresa_id, created_at);
CREATE INDEX idx_colaboradores_empresa ON public.colaboradores(empresa_id);
CREATE INDEX idx_cuentas_empresa ON public.cuentas_sociales(empresa_id);

ALTER TABLE public.informes_diarios DROP CONSTRAINT IF EXISTS informes_diarios_fecha_key;
DROP INDEX IF EXISTS informes_diarios_fecha_idx;
CREATE UNIQUE INDEX IF NOT EXISTS informes_diarios_empresa_fecha_key ON public.informes_diarios(empresa_id, fecha);

INSERT INTO public.cuentas_sociales (empresa_id, red, usuario, conectada, notas)
VALUES
  ('22222222-2222-4222-8222-222222222222', 'facebook', '@panamarealestate', false, 'Pendiente conectar app de Meta Business.'),
  ('22222222-2222-4222-8222-222222222222', 'instagram', '@panamarealestate', false, 'Pendiente cuenta profesional vinculada a la página.'),
  ('22222222-2222-4222-8222-222222222222', 'tiktok', '@panamarealestate', false, 'Pendiente acceso al Content Posting API.');