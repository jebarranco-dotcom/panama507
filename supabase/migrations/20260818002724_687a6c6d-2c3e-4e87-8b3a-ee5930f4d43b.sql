REVOKE ALL ON public.empresa_usuarios FROM anon;
GRANT SELECT ON public.empresa_usuarios TO authenticated;
GRANT ALL ON public.empresa_usuarios TO service_role;