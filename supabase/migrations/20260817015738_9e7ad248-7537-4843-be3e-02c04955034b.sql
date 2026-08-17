-- Membership table
CREATE TABLE public.empresa_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'miembro',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, empresa_id)
);

GRANT SELECT ON public.empresa_usuarios TO authenticated;
GRANT ALL ON public.empresa_usuarios TO service_role;
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresa_usuarios_propias ON public.empresa_usuarios
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Helper
CREATE OR REPLACE FUNCTION public.es_miembro(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE empresa_id = _empresa_id AND user_id = auth.uid()
  )
$$;

-- Backfill: existing panel users get access to existing companies
INSERT INTO public.empresa_usuarios (user_id, empresa_id, rol)
SELECT u.id, e.id, 'admin' FROM auth.users u CROSS JOIN public.empresas e
ON CONFLICT DO NOTHING;

-- empresas
DROP POLICY IF EXISTS empresas_escritura_interna ON public.empresas;
DROP POLICY IF EXISTS empresas_lectura_publica ON public.empresas;
REVOKE ALL ON public.empresas FROM anon;
CREATE POLICY empresas_lectura_miembros ON public.empresas
  FOR SELECT TO authenticated USING (public.es_miembro(id));
CREATE POLICY empresas_escritura_miembros ON public.empresas
  FOR UPDATE TO authenticated USING (public.es_miembro(id)) WITH CHECK (public.es_miembro(id));

-- propiedades
DROP POLICY IF EXISTS propiedades_escritura_interna ON public.propiedades;
DROP POLICY IF EXISTS propiedades_lectura_publica ON public.propiedades;
REVOKE ALL ON public.propiedades FROM anon;
CREATE POLICY propiedades_miembros ON public.propiedades
  FOR ALL TO authenticated USING (public.es_miembro(empresa_id)) WITH CHECK (public.es_miembro(empresa_id));

-- publicaciones
DROP POLICY IF EXISTS publicaciones_escritura_interna ON public.publicaciones;
DROP POLICY IF EXISTS publicaciones_lectura_publica ON public.publicaciones;
REVOKE ALL ON public.publicaciones FROM anon;
CREATE POLICY publicaciones_miembros ON public.publicaciones
  FOR ALL TO authenticated USING (public.es_miembro(empresa_id)) WITH CHECK (public.es_miembro(empresa_id));

-- colaboradores
DROP POLICY IF EXISTS colaboradores_solo_autenticados ON public.colaboradores;
CREATE POLICY colaboradores_miembros ON public.colaboradores
  FOR ALL TO authenticated USING (public.es_miembro(empresa_id)) WITH CHECK (public.es_miembro(empresa_id));

-- cuentas_sociales
DROP POLICY IF EXISTS cuentas_solo_autenticados ON public.cuentas_sociales;
CREATE POLICY cuentas_miembros ON public.cuentas_sociales
  FOR ALL TO authenticated USING (public.es_miembro(empresa_id)) WITH CHECK (public.es_miembro(empresa_id));

-- informes_diarios
DROP POLICY IF EXISTS informes_solo_autenticados ON public.informes_diarios;
CREATE POLICY informes_miembros ON public.informes_diarios
  FOR ALL TO authenticated USING (public.es_miembro(empresa_id)) WITH CHECK (public.es_miembro(empresa_id));

-- mensajes
DROP POLICY IF EXISTS mensajes_solo_autenticados ON public.mensajes;
CREATE POLICY mensajes_miembros ON public.mensajes
  FOR ALL TO authenticated USING (public.es_miembro(empresa_id)) WITH CHECK (public.es_miembro(empresa_id));