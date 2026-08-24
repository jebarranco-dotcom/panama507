DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','gestor','asesor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.empresa_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rol public.app_role NOT NULL DEFAULT 'asesor',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, empresa_id, rol)
);

REVOKE ALL ON public.empresa_roles FROM anon;
GRANT SELECT ON public.empresa_roles TO authenticated;
GRANT ALL ON public.empresa_roles TO service_role;

ALTER TABLE public.empresa_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empresa_roles_propios ON public.empresa_roles;
CREATE POLICY empresa_roles_propios ON public.empresa_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.empresa_roles (user_id, empresa_id, rol)
SELECT eu.user_id, eu.empresa_id,
       CASE WHEN eu.rol = 'admin' THEN 'admin'::public.app_role ELSE 'asesor'::public.app_role END
FROM public.empresa_usuarios eu
ON CONFLICT (user_id, empresa_id, rol) DO NOTHING;

-- empresas
DROP POLICY IF EXISTS empresas_lectura_miembros ON public.empresas;
DROP POLICY IF EXISTS empresas_escritura_miembros ON public.empresas;
CREATE POLICY empresas_lectura_miembros ON public.empresas
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = empresas.id AND eu.user_id = auth.uid()));
CREATE POLICY empresas_escritura_gestores ON public.empresas
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = empresas.id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = empresas.id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

-- propiedades
DROP POLICY IF EXISTS propiedades_miembros ON public.propiedades;
CREATE POLICY propiedades_lectura ON public.propiedades
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = propiedades.empresa_id AND eu.user_id = auth.uid()));
CREATE POLICY propiedades_escritura ON public.propiedades
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = propiedades.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = propiedades.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

-- publicaciones
DROP POLICY IF EXISTS publicaciones_miembros ON public.publicaciones;
CREATE POLICY publicaciones_lectura ON public.publicaciones
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = publicaciones.empresa_id AND eu.user_id = auth.uid()));
CREATE POLICY publicaciones_escritura ON public.publicaciones
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = publicaciones.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = publicaciones.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

-- colaboradores
DROP POLICY IF EXISTS colaboradores_miembros ON public.colaboradores;
CREATE POLICY colaboradores_lectura ON public.colaboradores
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = colaboradores.empresa_id AND eu.user_id = auth.uid()));
CREATE POLICY colaboradores_escritura ON public.colaboradores
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = colaboradores.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = colaboradores.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

-- cuentas_sociales
DROP POLICY IF EXISTS cuentas_miembros ON public.cuentas_sociales;
CREATE POLICY cuentas_lectura ON public.cuentas_sociales
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = cuentas_sociales.empresa_id AND eu.user_id = auth.uid()));
CREATE POLICY cuentas_escritura ON public.cuentas_sociales
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = cuentas_sociales.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = cuentas_sociales.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

-- informes_diarios
DROP POLICY IF EXISTS informes_miembros ON public.informes_diarios;
CREATE POLICY informes_lectura ON public.informes_diarios
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = informes_diarios.empresa_id AND eu.user_id = auth.uid()));
CREATE POLICY informes_escritura ON public.informes_diarios
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = informes_diarios.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = informes_diarios.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

-- mensajes: todos los roles de la empresa pueden atender la bandeja
DROP POLICY IF EXISTS mensajes_miembros ON public.mensajes;
CREATE POLICY mensajes_miembros ON public.mensajes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = mensajes.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = mensajes.empresa_id AND eu.user_id = auth.uid()));