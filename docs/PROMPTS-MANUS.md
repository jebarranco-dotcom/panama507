# Prompts listos para Manus

Contexto del repo: TanStack Start v1 + React 19 + Vite 7 + Tailwind v4, backend Supabase (Lovable Cloud).
Rutas protegidas en `src/routes/_authenticated/`, públicas en `src/routes/` (`/auth`, `/privacy`, `/terms`, `/data-deletion`, `/reset-password`).
Lógica de servidor en `src/lib/*.server.ts`, RPC en `src/lib/*.functions.ts`, webhooks en `src/routes/api/public/hooks/`.

## Reglas que Manus debe respetar siempre

1. No usar react-router-dom ni crear `src/App.tsx`; el router es TanStack Router por archivos.
2. No editar `src/routeTree.gen.ts` ni nada en `src/integrations/supabase/` (autogenerado).
3. Secretos solo en servidor (`process.env` dentro de `.handler()`); nunca en el navegador.
4. Toda tabla nueva en `public` necesita `GRANT` + `ENABLE ROW LEVEL SECURITY` + políticas por empresa.
5. Todo dato debe estar filtrado por `empresa_id` y por membresía (`empresa_usuarios`).
6. Nunca simular conexiones sociales válidas ni presentar datos ficticios como reales; usar el estado tipado `pending_oauth`.
7. Ninguna respuesta automática a clientes sin aprobación humana.

## 1. Onboarding / auditoría inicial

> Clona el repo y haz una auditoría de arquitectura: lista rutas, server functions, tablas usadas y dónde se aplica RLS por empresa. No cambies código; entrega un informe con `archivo:línea`.

## 2. Completar OAuth de Meta

> En `src/lib/conexiones.server.ts` y `src/lib/oauth.functions.ts`, revisa el flujo OAuth de Meta (Facebook/Instagram). Verifica scopes de mensajería (`pages_messaging`, `pages_manage_metadata`, `instagram_manage_messages`), refresco de tokens de larga duración y almacenamiento cifrado en `conexiones_tokens`. Devuelve errores tipados `pending_oauth` con permisos faltantes. No expongas tokens al cliente.

## 3. TikTok Content Posting API

> Implementa la publicación real en TikTok en `src/lib/publicador.server.ts` usando la Content Posting API, con manejo de estados, reintentos limitados e idempotencia vía `logs_automatizacion`. Si falta autorización, devuelve `pending_oauth`.

## 4. Mensajería y leads

> Extiende `src/lib/mensajeria.server.ts` para sincronizar comentarios de Facebook/Instagram además de mensajes directos, creando `conversaciones` y `leads` idempotentes con `referencia_externa`. Sin respuestas automáticas.

## 5. Programación y publicación automática

> Revisa `src/lib/programacion.server.ts` y `publicador.server.ts`: asegura zona horaria por empresa, reintentos con backoff, prevención de duplicados y registro en `logs_automatizacion`. Añade tests de la lógica de ventana horaria.

## 6. Informes

> Mejora `/informes`: histórico comparativo, métricas por red y exportación CSV/PDF fiel a los datos reales. Sin métricas inventadas cuando no hay conexión.

## 7. UI/UX y responsive

> Revisa el menú lateral fijo y todas las páginas en móvil (360px) y escritorio: estados de carga, estados vacíos, errores claros, 404 y ningún botón sin acción. Solo cambios de presentación, sin tocar lógica de negocio.

## 8. Seguridad

> Ejecuta una revisión de seguridad: políticas RLS por tabla, grants, aislamiento multiempresa, roles (`admin`, `gestor`, `asesor`) y ausencia de secretos en el bundle del cliente. Entrega hallazgos priorizados y parches mínimos.

## Flujo de trabajo sugerido

1. Rama por tarea: `feat/…`, `fix/…`.
2. Pull request con descripción y pasos de verificación.
3. Al mergear a `main`, Lovable sincroniza automáticamente los cambios al proyecto.
