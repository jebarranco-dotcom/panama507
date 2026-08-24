import { createFileRoute } from "@tanstack/react-router";

import { PaginaLegal, Seccion } from "@/components/PaginaLegal";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "Eliminación de datos | Centro de gestión de redes" },
      {
        name: "description",
        content:
          "Cómo solicitar la eliminación de tus datos en el centro de gestión de redes de PANAMA REAL ESTATE y GESTIONES COMERCIALES.",
      },
      { property: "og:title", content: "Eliminación de datos | Centro de gestión de redes" },
      {
        property: "og:description",
        content:
          "Procedimiento y plazos para solicitar la eliminación de mensajes, datos de contacto y conexiones de cuentas.",
      },
    ],
  }),
  component: EliminacionDatos,
});

function EliminacionDatos() {
  return (
    <PaginaLegal
      titulo="Solicitud de eliminación de datos"
      descripcion="Puedes pedir en cualquier momento que eliminemos los datos que conservamos sobre ti o sobre una cuenta social conectada."
      actualizado="24 de agosto de 2026"
    >
      <Seccion titulo="Cómo solicitarlo">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Envía un mensaje directo a cualquiera de las páginas administradas (Facebook,
            Instagram o TikTok de PANAMA REAL ESTATE o GESTIONES COMERCIALES) con el asunto
            <strong className="text-foreground"> «Eliminación de datos»</strong>.
          </li>
          <li>
            Si eres colaborador del centro, también puedes solicitarlo desde el propio centro
            pidiéndolo al administrador de tu empresa, que registrará la solicitud.
          </li>
          <li>
            Indica el nombre o usuario con el que nos escribiste y, si aplica, la cuenta o página
            cuya conexión quieres eliminar. No envíes contraseñas ni códigos: nunca los
            necesitamos.
          </li>
        </ol>
      </Seccion>

      <Seccion titulo="Qué eliminamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Los mensajes y solicitudes que conservamos de tu conversación.</li>
          <li>Tus datos de contacto y notas de seguimiento comercial.</li>
          <li>
            Las autorizaciones y accesos guardados de la cuenta social indicada, junto con sus
            registros de conexión.
          </li>
        </ul>
        <p>
          Los accesos guardados se destruyen de forma irreversible y el centro deja de publicar
          en esa cuenta de inmediato.
        </p>
      </Seccion>

      <Seccion titulo="Plazo">
        <p>
          Confirmamos la recepción en un máximo de 5 días hábiles y completamos la eliminación
          dentro de los 30 días siguientes. Te avisamos por el mismo canal cuando esté hecho.
        </p>
      </Seccion>

      <Seccion titulo="Qué no se elimina">
        <p>
          Las publicaciones ya visibles en las redes sociales se gestionan desde cada plataforma;
          si quieres retirar una publicación concreta, indícalo en tu solicitud. Tampoco se
          eliminan los registros mínimos que debamos conservar por obligaciones legales o
          contables, que se guardan de forma restringida y no se usan para marketing.
        </p>
      </Seccion>

      <Seccion titulo="Revocar el acceso por tu cuenta">
        <p>
          Además de esta solicitud, puedes retirar el acceso de la aplicación desde la
          configuración de aplicaciones y sitios web de tu cuenta de Facebook, Instagram o
          TikTok. Al hacerlo, dejamos de tener permiso para publicar o leer mensajes en tu
          nombre.
        </p>
      </Seccion>
    </PaginaLegal>
  );
}
