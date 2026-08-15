-- colaboradores: internal only
DROP POLICY IF EXISTS colaboradores_acceso_interno ON public.colaboradores;
REVOKE ALL ON public.colaboradores FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;
CREATE POLICY colaboradores_solo_autenticados ON public.colaboradores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cuentas_sociales: internal only
DROP POLICY IF EXISTS cuentas_acceso_interno ON public.cuentas_sociales;
REVOKE ALL ON public.cuentas_sociales FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuentas_sociales TO authenticated;
GRANT ALL ON public.cuentas_sociales TO service_role;
CREATE POLICY cuentas_solo_autenticados ON public.cuentas_sociales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- informes_diarios: internal only
DROP POLICY IF EXISTS informes_acceso_interno ON public.informes_diarios;
REVOKE ALL ON public.informes_diarios FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.informes_diarios TO authenticated;
GRANT ALL ON public.informes_diarios TO service_role;
CREATE POLICY informes_solo_autenticados ON public.informes_diarios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- mensajes: internal only (customer PII)
DROP POLICY IF EXISTS mensajes_acceso_interno ON public.mensajes;
REVOKE ALL ON public.mensajes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensajes TO authenticated;
GRANT ALL ON public.mensajes TO service_role;
CREATE POLICY mensajes_solo_autenticados ON public.mensajes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- propiedades: public catalog read, writes internal only
DROP POLICY IF EXISTS propiedades_acceso_interno ON public.propiedades;
REVOKE INSERT, UPDATE, DELETE ON public.propiedades FROM anon;
GRANT SELECT ON public.propiedades TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propiedades TO authenticated;
GRANT ALL ON public.propiedades TO service_role;
CREATE POLICY propiedades_lectura_publica ON public.propiedades
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY propiedades_escritura_interna ON public.propiedades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- publicaciones: public read of marketing content, writes internal only
DROP POLICY IF EXISTS publicaciones_acceso_interno ON public.publicaciones;
REVOKE INSERT, UPDATE, DELETE ON public.publicaciones FROM anon;
GRANT SELECT ON public.publicaciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicaciones TO authenticated;
GRANT ALL ON public.publicaciones TO service_role;
CREATE POLICY publicaciones_lectura_publica ON public.publicaciones
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY publicaciones_escritura_interna ON public.publicaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);