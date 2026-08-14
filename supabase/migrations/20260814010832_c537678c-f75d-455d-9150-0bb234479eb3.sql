CREATE TABLE public.propiedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  operacion text NOT NULL DEFAULT 'alquiler',
  tipo text NOT NULL DEFAULT 'apartamento',
  precio numeric NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'USD',
  habitaciones int NOT NULL DEFAULT 0,
  banos numeric NOT NULL DEFAULT 0,
  area_m2 numeric NOT NULL DEFAULT 0,
  ubicacion text NOT NULL DEFAULT '',
  descripcion text NOT NULL DEFAULT '',
  imagen_url text,
  destacada boolean NOT NULL DEFAULT false,
  estado text NOT NULL DEFAULT 'disponible',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propiedades TO anon, authenticated;
GRANT ALL ON public.propiedades TO service_role;
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "propiedades_acceso_interno" ON public.propiedades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.cuentas_sociales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  red text NOT NULL,
  usuario text NOT NULL DEFAULT '',
  conectada boolean NOT NULL DEFAULT false,
  seguidores int NOT NULL DEFAULT 0,
  alcance_mensual int NOT NULL DEFAULT 0,
  notas text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuentas_sociales TO anon, authenticated;
GRANT ALL ON public.cuentas_sociales TO service_role;
ALTER TABLE public.cuentas_sociales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cuentas_acceso_interno" ON public.cuentas_sociales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  rol text NOT NULL DEFAULT 'Asesor inmobiliario',
  correo text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  redes_asignadas text[] NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  publicaciones_asignadas int NOT NULL DEFAULT 0,
  leads_atendidos int NOT NULL DEFAULT 0,
  leads_cerrados int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO anon, authenticated;
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colaboradores_acceso_interno" ON public.colaboradores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.publicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_programada date NOT NULL DEFAULT current_date,
  hora_programada text NOT NULL DEFAULT '09:00',
  red text NOT NULL DEFAULT 'instagram',
  pilar text NOT NULL DEFAULT 'propiedad_destacada',
  formato text NOT NULL DEFAULT 'carrusel',
  titular text NOT NULL DEFAULT '',
  copy text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  cta text NOT NULL DEFAULT '',
  idea_visual text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'programado',
  propiedad_id uuid REFERENCES public.propiedades(id) ON DELETE SET NULL,
  alcance int NOT NULL DEFAULT 0,
  likes int NOT NULL DEFAULT 0,
  comentarios int NOT NULL DEFAULT 0,
  clics int NOT NULL DEFAULT 0,
  leads int NOT NULL DEFAULT 0,
  generado_por_ia boolean NOT NULL DEFAULT true,
  publicado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicaciones TO anon, authenticated;
GRANT ALL ON public.publicaciones TO service_role;
ALTER TABLE public.publicaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publicaciones_acceso_interno" ON public.publicaciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX publicaciones_fecha_idx ON public.publicaciones (fecha_programada);

CREATE TABLE public.mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  red text NOT NULL DEFAULT 'instagram',
  remitente text NOT NULL DEFAULT '',
  usuario_remitente text NOT NULL DEFAULT '',
  mensaje text NOT NULL DEFAULT '',
  intencion text NOT NULL DEFAULT 'consulta',
  prioridad text NOT NULL DEFAULT 'media',
  estado text NOT NULL DEFAULT 'nuevo',
  respuesta text,
  notas text NOT NULL DEFAULT '',
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  propiedad_id uuid REFERENCES public.propiedades(id) ON DELETE SET NULL,
  proximo_seguimiento date,
  respondido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensajes TO anon, authenticated;
GRANT ALL ON public.mensajes TO service_role;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mensajes_acceso_interno" ON public.mensajes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.informes_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL UNIQUE DEFAULT current_date,
  resumen text NOT NULL DEFAULT '',
  publicaciones_publicadas int NOT NULL DEFAULT 0,
  publicaciones_programadas int NOT NULL DEFAULT 0,
  mensajes_recibidos int NOT NULL DEFAULT 0,
  mensajes_atendidos int NOT NULL DEFAULT 0,
  leads_nuevos int NOT NULL DEFAULT 0,
  alcance_total int NOT NULL DEFAULT 0,
  mejor_red text NOT NULL DEFAULT '',
  logros text[] NOT NULL DEFAULT '{}',
  recomendaciones text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.informes_diarios TO anon, authenticated;
GRANT ALL ON public.informes_diarios TO service_role;
ALTER TABLE public.informes_diarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "informes_acceso_interno" ON public.informes_diarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.cuentas_sociales (red, usuario, conectada, seguidores, alcance_mensual, notas) VALUES
('facebook', 'RenteloFacil', false, 4820, 61200, 'Pendiente conectar token de Meta Business'),
('instagram', '@rentelofacil', false, 7350, 98400, 'Pendiente conectar Instagram Graph API'),
('tiktok', '@rentelofacil', false, 3110, 145000, 'Pendiente conectar TikTok Content Posting API');

INSERT INTO public.colaboradores (nombre, rol, correo, telefono, whatsapp, redes_asignadas, publicaciones_asignadas, leads_atendidos, leads_cerrados) VALUES
('María Fernández', 'Community Manager', 'maria@rentelofacil.com', '+507 6123-4567', '+50761234567', ARRAY['instagram','facebook'], 42, 96, 14),
('Carlos Sánchez', 'Asesor de ventas', 'carlos@rentelofacil.com', '+507 6234-5678', '+50762345678', ARRAY['facebook'], 18, 74, 21),
('Ana Rodríguez', 'Asesora de alquileres', 'ana@rentelofacil.com', '+507 6345-6789', '+50763456789', ARRAY['instagram','tiktok'], 27, 118, 33),
('Luis Mendoza', 'Creador de contenido', 'luis@rentelofacil.com', '+507 6456-7890', '+50764567890', ARRAY['tiktok'], 36, 22, 4);

INSERT INTO public.propiedades (titulo, operacion, tipo, precio, habitaciones, banos, area_m2, ubicacion, descripcion, destacada, estado) VALUES
('Apartamento moderno con vista al mar', 'alquiler', 'apartamento', 1450, 2, 2, 105, 'Costa del Este, Panamá', 'Torre premium con piscina, gym y seguridad 24/7. Línea blanca incluida.', true, 'disponible'),
('Casa familiar en urbanización cerrada', 'venta', 'casa', 285000, 4, 3.5, 240, 'Panamá Pacífico', 'Patio amplio, cuarto de servicio y área social techada. Ideal para familias.', true, 'disponible'),
('Studio amoblado listo para mudarse', 'alquiler', 'studio', 780, 1, 1, 48, 'El Cangrejo, Panamá', 'A pasos del metro, perfecto para profesionales jóvenes. Incluye internet.', false, 'disponible'),
('Penthouse de lujo con terraza privada', 'venta', 'penthouse', 620000, 3, 4, 320, 'Punta Pacífica, Panamá', 'Terraza con jacuzzi, doble estacionamiento y vista 270° a la bahía.', true, 'disponible'),
('Local comercial en avenida principal', 'alquiler', 'local', 2200, 0, 2, 160, 'Vía España, Panamá', 'Alto tráfico peatonal, vitrina amplia y depósito interno.', false, 'disponible'),
('Casa de playa a 5 minutos del mar', 'alquiler', 'casa', 1900, 3, 2, 180, 'Coronado, Panamá Oeste', 'Ideal para estancias largas o temporada. Acceso a club de playa.', false, 'disponible');

INSERT INTO public.publicaciones (fecha_programada, hora_programada, red, pilar, formato, titular, copy, hashtags, cta, idea_visual, estado, alcance, likes, comentarios, clics, leads, publicado_at)
SELECT current_date - 1, '09:00', 'instagram', 'propiedad_destacada', 'carrusel',
 'Vive frente al mar en Costa del Este',
 E'Despertar con vista al mar sí es posible 🌊\n\nApartamento de 2 habitaciones, 105 m², torre con piscina y gym, línea blanca incluida. Alquiler desde $1,450/mes.\n\n¿Te lo mostramos esta semana?',
 ARRAY['#RenteloFacil','#AlquilerPanama','#CostaDelEste','#VivirEnPanama','#Inmobiliaria'],
 'Escríbenos por DM y coordinamos tu visita hoy mismo.',
 'Carrusel de 5 fotos: sala con ventanal, terraza, piscina, dormitorio, planta.',
 'publicado', 8420, 612, 48, 190, 7, now() - interval '1 day'
UNION ALL SELECT current_date - 1, '13:00', 'tiktok', 'tour_virtual', 'reel',
 'Tour de 30 segundos: penthouse en Punta Pacífica',
 E'Esto cuesta $620,000 en Punta Pacífica 👀 Terraza con jacuzzi y vista 270° a la bahía.\n\nGuarda este video si algún día quieres vivir así.',
 ARRAY['#PanamaRealEstate','#Penthouse','#TourDeCasas','#RenteloFacil'],
 'Comenta PENTHOUSE y te enviamos la ficha completa.',
 'Recorrido vertical con transiciones al ritmo del audio en tendencia.',
 'publicado', 24800, 1930, 122, 410, 11, now() - interval '1 day'
UNION ALL SELECT current_date, '09:00', 'facebook', 'educativo', 'imagen',
 '5 documentos que necesitas para alquilar en Panamá',
 E'Antes de firmar tu contrato de alquiler, ten listo esto:\n\n1. Cédula o pasaporte\n2. Carta de trabajo\n3. Últimos 3 talonarios\n4. Referencias del arrendador anterior\n5. Depósito de garantía\n\nEn RENTELO FACIL te acompañamos en cada paso.',
 ARRAY['#AlquilerSeguro','#RenteloFacil','#PanamaCity'],
 'Agenda una asesoría gratuita por mensaje.',
 'Infografía con checklist en la paleta de marca.',
 'publicado', 5120, 284, 33, 96, 4, now() - interval '3 hours'
UNION ALL SELECT current_date, '18:00', 'instagram', 'prueba_social', 'reel',
 'Las llaves de Yarelis ya son suyas',
 E'Yarelis buscaba un studio cerca del metro y en 6 días ya estaba mudándose 🔑\n\nAsí trabajamos: te mostramos solo lo que encaja contigo.',
 ARRAY['#Testimonio','#RenteloFacil','#ElCangrejo','#AlquilerPanama'],
 'Cuéntanos qué buscas y te enviamos 3 opciones hoy.',
 'Clip vertical de entrega de llaves con subtítulos grandes.',
 'programado', 0, 0, 0, 0, 0, NULL
UNION ALL SELECT current_date + 1, '09:00', 'tiktok', 'tendencia', 'reel',
 'Alquilar vs comprar en Panamá 2026',
 E'¿Alquilar o comprar? Depende de 3 números: cuota vs alquiler, cuánto tiempo te quedas y tu ahorro inicial.\n\nTe lo explicamos en 40 segundos.',
 ARRAY['#FinanzasPersonales','#PanamaRealEstate','#RenteloFacil'],
 'Escríbenos y calculamos tu escenario gratis.',
 'Video hablado con textos animados y comparativa en pantalla.',
 'programado', 0, 0, 0, 0, 0, NULL;

INSERT INTO public.mensajes (red, remitente, usuario_remitente, mensaje, intencion, prioridad, estado, respuesta, notas, colaborador_id, proximo_seguimiento, respondido_at, created_at)
SELECT 'instagram', 'Yarelis Ortega', '@yare.ortega', 'Hola, vi el studio de El Cangrejo. ¿Está disponible para agosto?', 'alquiler', 'alta', 'respondido',
 'Hola Yarelis 👋 Sí está disponible. ¿Te sirve una visita el jueves a las 4pm?', 'Interesada, presupuesto hasta $850.',
 (SELECT id FROM public.colaboradores WHERE nombre = 'Ana Rodríguez'), current_date + 1, now() - interval '2 hours', now() - interval '5 hours'
UNION ALL SELECT 'facebook', 'Roberto Díaz', 'Roberto Díaz', 'Buenas, ¿cuál es el precio final de la casa en Panamá Pacífico y aceptan financiamiento?', 'venta', 'alta', 'en_proceso',
 NULL, 'Solicita precalificación bancaria.',
 (SELECT id FROM public.colaboradores WHERE nombre = 'Carlos Sánchez'), current_date, NULL, now() - interval '3 hours'
UNION ALL SELECT 'tiktok', 'Kevin M.', '@kevinmp', 'PENTHOUSE', 'informacion', 'media', 'nuevo', NULL, 'Comentario del reel del penthouse.', NULL, current_date, NULL, now() - interval '1 hour'
UNION ALL SELECT 'instagram', 'Daniela Pérez', '@dani.perez', '¿Tienen algo de 3 habitaciones en Coronado para temporada?', 'alquiler', 'media', 'nuevo', NULL, '', NULL, current_date, NULL, now() - interval '40 minutes'
UNION ALL SELECT 'facebook', 'Inversiones GH', 'Inversiones GH', 'Queremos publicar 4 apartamentos con ustedes, ¿cómo funciona la comisión?', 'propietario', 'alta', 'nuevo', NULL, 'Posible cartera nueva de 4 unidades.', NULL, current_date, NULL, now() - interval '20 minutes';

INSERT INTO public.informes_diarios (fecha, resumen, publicaciones_publicadas, publicaciones_programadas, mensajes_recibidos, mensajes_atendidos, leads_nuevos, alcance_total, mejor_red, logros, recomendaciones)
VALUES (current_date - 1,
 'Día sólido en captación: el tour del penthouse en TikTok generó el mayor alcance del mes y la publicación de Costa del Este trajo 7 leads calificados por DM. La bandeja quedó al día salvo una consulta de financiamiento.',
 2, 3, 6, 5, 18, 33220, 'tiktok',
 ARRAY['Reel de penthouse superó 24k de alcance','7 leads nuevos desde Instagram','Tiempo de respuesta promedio de 22 minutos'],
 ARRAY['Repetir formato de tour vertical 3 veces por semana','Crear contenido educativo sobre financiamiento bancario','Dar seguimiento a la cartera de Inversiones GH']);