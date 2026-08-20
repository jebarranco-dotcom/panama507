INSERT INTO public.empresa_usuarios (empresa_id, user_id)
SELECT e.id, u.id
FROM public.empresas e
CROSS JOIN auth.users u
WHERE e.slug = 'gestiones-comerciales'
  AND u.email = 'info@gestionescomerciales.com'
ON CONFLICT DO NOTHING;