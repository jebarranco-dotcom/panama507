import { createFileRoute } from "@tanstack/react-router";

import { PaginaLegal, Seccion } from "@/components/PaginaLegal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Términos de uso | Centro de gestión de redes" },
      {
        name: "description",
        content:
          "Condiciones de uso del centro de gestión de redes sociales de PANAMA REAL ESTATE y GESTIONES COMERCIALES.",
      },
      { property: "og:title", content: "Términos de uso | Centro de gestión de redes" },
      {
        property: "og:description",
        content:
          "Reglas de uso del centro que planifica, revisa y publica contenido en las cuentas autorizadas.",
      },
    ],
  }),
  component: Terminos,
});

function Terminos() {
  return (
    <PaginaLegal
      titulo="Términos de uso"
      descripcion="Estas condiciones regulan el uso del centro de gestión de redes sociales compartido por PANAMA REAL ESTATE y GESTIONES COMERCIALES."
      actualizado="24 de agosto de 2026"
    >
      <Seccion titulo="1. Objeto y alcance">
        <p>
          El centro es una herramienta interna de las empresas indicadas. Permite generar
          borradores de contenido, aprobarlos, programarlos y publicarlos en las cuentas de
          Facebook, Instagram y TikTok de cada empresa, así como atender los mensajes recibidos.
        </p>
      </Seccion>

      <Seccion titulo="2. Acceso autorizado">
        <p>
          El acceso está limitado a colaboradores autorizados con sesión activa y rol asignado.
          Cada usuario es responsable de la confidencialidad de sus credenciales y solo puede
          operar sobre la empresa a la que fue asignado.
        </p>
      </Seccion>

      <Seccion titulo="3. Conexión de cuentas sociales">
        <p>
          Las cuentas se conectan mediante los flujos de autorización oficiales de cada
          plataforma. Solo el titular o administrador de la página puede autorizar la conexión, y
          puede revocarla en cualquier momento. Al revocarla, el centro deja de publicar en esa
          cuenta.
        </p>
      </Seccion>

      <Seccion titulo="4. Contenido publicado">
        <p>
          Los borradores generados de forma automatizada requieren revisión y aprobación humana
          antes de publicarse. Las empresas son responsables del contenido final, de la exactitud
          de la información sobre propiedades, servicios y precios, y del cumplimiento de las
          normas de cada plataforma.
        </p>
      </Seccion>

      <Seccion titulo="5. Uso prohibido">
        <ul className="list-disc space-y-2 pl-5">
          <li>Publicar contenido engañoso, ilegal o que infrinja derechos de terceros.</li>
          <li>Intentar acceder a datos de una empresa distinta a la asignada.</li>
          <li>Extraer, compartir o reutilizar credenciales, tokens o datos de contacto.</li>
        </ul>
      </Seccion>

      <Seccion titulo="6. Disponibilidad">
        <p>
          El servicio puede interrumpirse por mantenimiento o por cambios y límites de las APIs
          de las plataformas. No garantizamos la publicación cuando la plataforma rechaza o
          limita una solicitud.
        </p>
      </Seccion>

      <Seccion titulo="7. Privacidad y eliminación de datos">
        <p>
          El tratamiento de datos se describe en la política de privacidad. Las solicitudes de
          eliminación se atienden según el procedimiento publicado en la página de eliminación de
          datos.
        </p>
      </Seccion>

      <Seccion titulo="8. Contacto">
        <p>
          Para cualquier consulta sobre estos términos, escríbenos por mensaje directo a
          cualquiera de las páginas administradas por las empresas.
        </p>
      </Seccion>
    </PaginaLegal>
  );
}
