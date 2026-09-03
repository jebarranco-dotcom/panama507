-- Zona horaria por empresa
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS zona_horaria text NOT NULL DEFAULT 'America/Panama';

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  red text NOT NULL DEFAULT 'facebook',
  usuario_red text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  correo text NOT NULL DEFAULT '',
  interes text NOT NULL DEFAULT '',
  propiedad_id uuid REFERENCES public.propiedades(id) ON DELETE SET NULL,
  etapa text NOT NULL DEFAULT 'nuevo' CHECK (etapa IN ('nuevo','seguimiento','calificado','cerrado','perdido')),
  valor_estimado numeric NOT NULL DEFAULT 0,
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  notas text NOT NULL DEFAULT '',
  ultimo_contacto_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_miembros ON public.leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = leads.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = leads.empresa_id AND eu.user_id = auth.uid()));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX leads_empresa_etapa_idx ON public.leads (empresa_id, etapa);

-- CONVERSACIONES
CREATE TABLE public.conversaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  red text NOT NULL DEFAULT 'facebook',
  tipo text NOT NULL DEFAULT 'mensaje' CHECK (tipo IN ('mensaje','comentario')),
  participante text NOT NULL DEFAULT '',
  usuario_participante text NOT NULL DEFAULT '',
  referencia_externa text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo','en_atencion','esperando_respuesta','calificado','cerrado')),
  etiquetas text[] NOT NULL DEFAULT '{}',
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ultimo_mensaje_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversaciones TO authenticated;
GRANT ALL ON public.conversaciones TO service_role;
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversaciones_miembros ON public.conversaciones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = conversaciones.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = conversaciones.empresa_id AND eu.user_id = auth.uid()));
CREATE TRIGGER conversaciones_updated_at BEFORE UPDATE ON public.conversaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX conversaciones_empresa_estado_idx ON public.conversaciones (empresa_id, estado);

ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS conversacion_id uuid REFERENCES public.conversaciones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- TAREAS DE SEGUIMIENTO
CREATE TABLE public.tareas_seguimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT '',
  detalle text NOT NULL DEFAULT '',
  vence_at timestamptz NOT NULL DEFAULT now(),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completada','vencida','cancelada')),
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  conversacion_id uuid REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tareas_seguimiento TO authenticated;
GRANT ALL ON public.tareas_seguimiento TO service_role;
ALTER TABLE public.tareas_seguimiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY tareas_miembros ON public.tareas_seguimiento FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = tareas_seguimiento.empresa_id AND eu.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = tareas_seguimiento.empresa_id AND eu.user_id = auth.uid()));
CREATE TRIGGER tareas_updated_at BEFORE UPDATE ON public.tareas_seguimiento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PLANTILLAS DE RESPUESTA
CREATE TABLE public.plantillas_respuesta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'general',
  red text NOT NULL DEFAULT 'todas',
  contenido text NOT NULL DEFAULT '',
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plantillas_respuesta TO authenticated;
GRANT ALL ON public.plantillas_respuesta TO service_role;
ALTER TABLE public.plantillas_respuesta ENABLE ROW LEVEL SECURITY;
CREATE POLICY plantillas_lectura ON public.plantillas_respuesta FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = plantillas_respuesta.empresa_id AND eu.user_id = auth.uid()));
CREATE POLICY plantillas_escritura ON public.plantillas_respuesta FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = plantillas_respuesta.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresa_roles r WHERE r.empresa_id = plantillas_respuesta.empresa_id AND r.user_id = auth.uid() AND r.rol IN ('admin','gestor')));
CREATE TRIGGER plantillas_updated_at BEFORE UPDATE ON public.plantillas_respuesta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESULTADO POR RED DE CADA PUBLICACION
CREATE TABLE public.publicaciones_redes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  publicacion_id uuid NOT NULL REFERENCES public.publicaciones(id) ON DELETE CASCADE,
  red text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_cola','publicado','error')),
  referencia_externa text NOT NULL DEFAULT '',
  intentos integer NOT NULL DEFAULT 0,
  error_detalle text NOT NULL DEFAULT '',
  alcance integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comentarios integer NOT NULL DEFAULT 0,
  clics integer NOT NULL DEFAULT 0,
  publicado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publicacion_id, red)
);
GRANT SELECT ON public.publicaciones_redes TO authenticated;
GRANT ALL ON public.publicaciones_redes TO service_role;
ALTER TABLE public.publicaciones_redes ENABLE ROW LEVEL SECURITY;
CREATE POLICY publicaciones_redes_lectura ON public.publicaciones_redes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = publicaciones_redes.empresa_id AND eu.user_id = auth.uid()));
CREATE TRIGGER publicaciones_redes_updated_at BEFORE UPDATE ON public.publicaciones_redes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LOGS DE AUTOMATIZACION
CREATE TABLE public.logs_automatizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  proceso text NOT NULL,
  estado text NOT NULL DEFAULT 'ok' CHECK (estado IN ('ok','error','omitido')),
  detalle text NOT NULL DEFAULT '',
  duracion_ms integer NOT NULL DEFAULT 0,
  clave_idempotencia text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.logs_automatizacion TO authenticated;
GRANT ALL ON public.logs_automatizacion TO service_role;
ALTER TABLE public.logs_automatizacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_lectura ON public.logs_automatizacion FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresa_usuarios eu WHERE eu.empresa_id = logs_automatizacion.empresa_id AND eu.user_id = auth.uid()));
CREATE UNIQUE INDEX logs_idempotencia_idx ON public.logs_automatizacion (clave_idempotencia) WHERE clave_idempotencia IS NOT NULL;
CREATE INDEX logs_empresa_fecha_idx ON public.logs_automatizacion (empresa_id, created_at DESC);