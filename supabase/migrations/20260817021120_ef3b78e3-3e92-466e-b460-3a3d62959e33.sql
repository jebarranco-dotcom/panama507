INSERT INTO public.empresas (id, slug, nombre, giro, tono, whatsapp, zonas, color_primario, color_acento, activa)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  'gestiones-comerciales',
  'GESTIONES COMERCIALES',
  'Asesorías, trámites y gestiones empresariales: consultoría, desarrollo de negocios, asuntos públicos, contratación pública y soluciones 360 para el sector público y privado',
  'corporativo, claro y consultivo; enfocado en soluciones, trazabilidad y cumplimiento; sin promesas de resultados garantizados',
  '',
  'República de Panamá (Ciudad de Panamá y todo el país)',
  '#0f3d6e',
  '#c9a227',
  true
);

INSERT INTO public.empresa_usuarios (user_id, empresa_id, rol)
SELECT DISTINCT eu.user_id, '33333333-3333-4333-8333-333333333333'::uuid, 'miembro'
FROM public.empresa_usuarios eu
ON CONFLICT (user_id, empresa_id) DO NOTHING;

INSERT INTO public.cuentas_sociales (empresa_id, red, usuario, conectada, notas)
VALUES
  ('33333333-3333-4333-8333-333333333333', 'facebook', '@gestionescomerciales', false, 'Pendiente conectar la página empresarial.'),
  ('33333333-3333-4333-8333-333333333333', 'instagram', '@gestionescomerciales', false, 'Pendiente conectar la cuenta profesional.'),
  ('33333333-3333-4333-8333-333333333333', 'tiktok', '@gestionescomerciales', false, 'Pendiente conectar la cuenta de empresa.');

INSERT INTO public.propiedades (empresa_id, titulo, operacion, tipo, precio, moneda, ubicacion, descripcion, destacada, estado)
VALUES
  ('33333333-3333-4333-8333-333333333333', 'Asesoría empresarial y estratégica', 'servicio', 'estrategia', 0, 'USD', 'Panamá', 'Diagnóstico, planes de negocio, modelos de negocio, estrategias de crecimiento, análisis de riesgos y acompañamiento a juntas directivas.', true, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Desarrollo de negocios', 'servicio', 'comercial', 0, 'USD', 'Panamá', 'Prospección, embudos comerciales, propuestas, CRM, cierre de ventas B2B, B2G y B2C, alianzas y expansión territorial.', true, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Intermediación y facilitación comercial', 'servicio', 'comercial', 0, 'USD', 'Panamá', 'Conexión transparente entre compradores, vendedores, aliados e inversionistas; búsqueda de activos y representación de intereses legítimos.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Asuntos públicos y relaciones institucionales', 'servicio', 'sector_publico', 0, 'USD', 'Panamá', 'Representación legítima de intereses empresariales, relacionamiento institucional, monitoreo normativo y mesas de trabajo público-privadas.', true, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Trámites y gestiones administrativas', 'servicio', 'tramites', 0, 'USD', 'Panamá', 'Preparación, presentación y seguimiento de expedientes, permisos, avisos de operación, cronogramas de permisos y diligencias corporativas.', true, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Contratación pública y PanamaCompra', 'servicio', 'sector_publico', 0, 'USD', 'Panamá', 'Acompañamiento administrativo y comercial a proveedores del Estado: registro, propuestas, expedientes y capacitación básica.', true, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Contratos privados y administración contractual', 'servicio', 'contratos', 0, 'USD', 'Panamá', 'Control de obligaciones, entregables, cambios, recuperación de contratos atrasados y cierre administrativo.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Servicios para inversionistas', 'servicio', 'inversion', 0, 'USD', 'Panamá', 'Acompañamiento integral desde la oportunidad hasta el establecimiento en Panamá, con representación local postinversión.', true, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Investigación e inteligencia de negocios', 'servicio', 'inteligencia', 0, 'USD', 'Panamá', 'Perfiles de empresas, análisis competitivo, monitoreo sectorial, informes periódicos y alertas de riesgos y oportunidades.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Gestión de proyectos', 'servicio', 'proyectos', 0, 'USD', 'Panamá', 'Formulación, seguimiento y control de proyectos, recuperación de proyectos paralizados y creación de PMO.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Compras, proveedores y abastecimiento', 'servicio', 'operaciones', 0, 'USD', 'Panamá', 'Sourcing, comparativos, negociación, control de entregas, garantías, inventarios y coordinación logística.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Servicios inmobiliarios y construcción', 'servicio', 'inmobiliario', 0, 'USD', 'Panamá', 'Facilitación y coordinación de proyectos y búsquedas inmobiliarias mediante corredores y profesionales idóneos.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Comercio exterior y negocios internacionales', 'servicio', 'internacional', 0, 'USD', 'Panamá', 'Investigación de mercados, búsqueda de proveedores y distribuidores, misiones comerciales y enlace con cámaras y embajadas.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Marketing, comunicación y eventos', 'servicio', 'marketing', 0, 'USD', 'Panamá', 'Posicionamiento, materiales comerciales, organización de eventos empresariales, patrocinadores y protocolo.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Transformación digital y automatización', 'servicio', 'digital', 0, 'USD', 'Panamá', 'Sistemas, dashboards, automatización de flujos y herramientas digitales para la operación comercial.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Responsabilidad social y gestión comunitaria', 'servicio', 'social', 0, 'USD', 'Panamá', 'Diseño y coordinación de programas de impacto social, alianzas y relacionamiento comunitario medible.', false, 'disponible'),
  ('33333333-3333-4333-8333-333333333333', 'Gestiones ejecutivas y soluciones especiales', 'servicio', 'ejecutivo', 0, 'USD', 'Panamá', 'Gestor único, secretaría corporativa externa, enlace institucional y resolución de situaciones administrativas urgentes.', true, 'disponible');

INSERT INTO public.colaboradores (empresa_id, nombre, rol, correo, telefono, whatsapp, redes_asignadas, activo)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  'Coordinación Gestiones Comerciales',
  'Gestor comercial e institucional',
  '',
  '',
  '',
  ARRAY['facebook','instagram','tiktok'],
  true
);
