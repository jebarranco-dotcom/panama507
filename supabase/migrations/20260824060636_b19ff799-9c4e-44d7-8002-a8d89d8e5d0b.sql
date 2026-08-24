CREATE TABLE IF NOT EXISTS public.programacion_redes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  red text NOT NULL,
  hora text NOT NULL DEFAULT '09:00',
  pilar text NOT NULL DEFAULT '',
  formato text NOT NULL DEFAULT '',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, red)
);

REVOKE ALL ON public.programacion_redes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programacion_redes TO authenticated;
GRANT ALL ON public.programacion_redes TO service_role;

ALTER TABLE public.programacion_redes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS programacion_lectura ON public.programacion_redes;
CREATE POLICY programacion_lectura ON public.programacion_redes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = programacion_redes.empresa_id AND eu.user_id = auth.uid()));

DROP POLICY IF EXISTS programacion_escritura ON public.programacion_redes;
CREATE POLICY programacion_escritura ON public.programacion_redes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = programacion_redes.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = programacion_redes.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));

DROP TRIGGER IF EXISTS programacion_redes_updated_at ON public.programacion_redes;
CREATE TRIGGER programacion_redes_updated_at
  BEFORE UPDATE ON public.programacion_redes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.programacion_redes (empresa_id, red, hora, pilar, formato, activo)
SELECT e.id, v.red, v.hora, CASE WHEN e.slug = 'gestiones-comerciales' THEN v.pilar_serv ELSE v.pilar END, v.formato, true
FROM public.empresas e
CROSS JOIN (VALUES
  ('instagram','09:00','propiedad_destacada','servicio_destacado','carrusel'),
  ('facebook','13:00','educativo','educativo','imagen'),
  ('tiktok','18:30','tour_virtual','caso_gestion','reel')
) AS v(red, hora, pilar, pilar_serv, formato)
ON CONFLICT (empresa_id, red) DO NOTHING;