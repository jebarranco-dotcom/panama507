-- 1) Replace SECURITY DEFINER helper with inline membership checks (RLS-safe)
DROP POLICY IF EXISTS colaboradores_miembros ON public.colaboradores;
DROP POLICY IF EXISTS cuentas_miembros ON public.cuentas_sociales;
DROP POLICY IF EXISTS informes_miembros ON public.informes_diarios;
DROP POLICY IF EXISTS mensajes_miembros ON public.mensajes;
DROP POLICY IF EXISTS propiedades_miembros ON public.propiedades;
DROP POLICY IF EXISTS publicaciones_miembros ON public.publicaciones;
DROP POLICY IF EXISTS empresas_lectura_miembros ON public.empresas;
DROP POLICY IF EXISTS empresas_escritura_miembros ON public.empresas;

CREATE POLICY colaboradores_miembros ON public.colaboradores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = colaboradores.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = colaboradores.empresa_id AND eu.user_id = auth.uid()));

CREATE POLICY cuentas_miembros ON public.cuentas_sociales FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = cuentas_sociales.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = cuentas_sociales.empresa_id AND eu.user_id = auth.uid()));

CREATE POLICY informes_miembros ON public.informes_diarios FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = informes_diarios.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = informes_diarios.empresa_id AND eu.user_id = auth.uid()));

CREATE POLICY mensajes_miembros ON public.mensajes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = mensajes.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = mensajes.empresa_id AND eu.user_id = auth.uid()));

CREATE POLICY propiedades_miembros ON public.propiedades FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = propiedades.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = propiedades.empresa_id AND eu.user_id = auth.uid()));

CREATE POLICY publicaciones_miembros ON public.publicaciones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = publicaciones.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = publicaciones.empresa_id AND eu.user_id = auth.uid()));

CREATE POLICY empresas_lectura_miembros ON public.empresas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = empresas.id AND eu.user_id = auth.uid()));

CREATE POLICY empresas_escritura_miembros ON public.empresas FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = empresas.id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = empresas.id AND eu.user_id = auth.uid()));

DROP FUNCTION IF EXISTS public.es_miembro(uuid);

-- 2) Membership table: read-only for users, writes only through server-side (service_role)
REVOKE INSERT, UPDATE, DELETE ON public.empresa_usuarios FROM authenticated;
REVOKE ALL ON public.empresa_usuarios FROM anon;
GRANT SELECT ON public.empresa_usuarios TO authenticated;
GRANT ALL ON public.empresa_usuarios TO service_role;
COMMENT ON TABLE public.empresa_usuarios IS 'Membresias empresa-usuario. Solo lectura de las filas propias para usuarios autenticados; altas/bajas exclusivamente vía procesos del servidor (service_role).';