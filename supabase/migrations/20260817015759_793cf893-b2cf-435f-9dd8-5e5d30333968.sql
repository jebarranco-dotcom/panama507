REVOKE ALL ON FUNCTION public.es_miembro(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.es_miembro(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.es_miembro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_miembro(uuid) TO service_role;