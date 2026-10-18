import { createFileRoute } from "@tanstack/react-router";

import { PaginaLegal, Seccion } from "@/components/PaginaLegal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de privacidad | Centro de gestión de redes" },
      {
        name: "description",
        content:
          "Cómo PANAMA REAL ESTATE y GESTIONES COMERCIALES tratan los datos usados para la gestión de redes sociales, borradores y publicaciones autorizadas.",
      },
      { property: "og:title", content: "Política de privacidad | Centro de gestión de redes" },
      {
        property: "og:description",
        content:
          "Tratamiento de datos para la gestión de cuentas de Facebook, Instagram y TikTok de nuestras empresas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      descripcion="Este centro interno se usa para planificar, revisar y publicar contenido en las cuentas de Facebook, Instagram y TikTok administradas por PANAMA REAL ESTATE y GESTIONES COMERCIALES."
      actualizado="18 de octubre de 2026"
    >
      <Seccion titulo="Responsables del tratamiento">
        <p>
          PANAMA REAL ESTATE (alquiler y venta de propiedades) y GESTIONES COMERCIALES
          (asesorías, trámites y gestiones) son responsables del tratamiento de los datos
          gestionados por este centro, cada una respecto de sus propias cuentas, contenidos y
          conversaciones. El acceso de los colaboradores se limita a la empresa y los permisos
          que les hayan sido asignados.
        </p>
      </Seccion>

      <Seccion titulo="Datos que tratamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Datos de las cuentas administradas:</strong>{" "}
            nombre de la página o perfil, identificadores de cuenta, información básica del
            perfil y permisos otorgados al autorizar la conexión.
          </li>
          <li>
            <strong className="text-foreground">Contenido de marketing:</strong> borradores,
            textos, imágenes, videos, programación, decisiones de revisión y publicaciones
            aprobadas por el equipo.
          </li>
          <li>
            <strong className="text-foreground">Mensajes y solicitudes:</strong> consultas que
            las personas nos envían por las páginas administradas, para atenderlas y darles
            seguimiento comercial, incluyendo los datos de contacto que faciliten. El permiso
            de perfil básico de TikTok no permite leer mensajes privados de TikTok.
          </li>
          <li>
            <strong className="text-foreground">Registros técnicos:</strong> fecha y resultado
            de cada intento de publicación o autorización, errores, identificadores de
            publicación y acciones de revisión, con fines de auditoría y seguridad.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Para qué usamos los datos">
        <p>
          Únicamente para generar y revisar borradores, programar y publicar contenido en las
          cuentas autorizadas, responder mensajes y solicitudes recibidas, y elaborar informes
          internos de trabajo. No vendemos datos ni los usamos para publicidad de terceros.
        </p>
      </Seccion>

      <Seccion titulo="Permisos de TikTok y autorización de publicación">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">user.info.basic:</strong> permite consultar
            información básica del perfil autorizado para identificar la cuenta conectada.
          </li>
          <li>
            <strong className="text-foreground">video.upload:</strong> permite enviar videos
            al flujo de carga de TikTok para que el titular los revise y complete su publicación
            en TikTok; la carga no equivale a una publicación directa.
          </li>
          <li>
            <strong className="text-foreground">video.publish:</strong> permite la publicación
            directa mediante Direct Post únicamente si TikTok aprueba este permiso para la
            aplicación y el titular de la cuenta lo concede. Su descripción aquí no significa
            que ya esté aprobado o disponible.
          </li>
        </ul>
        <p>
          Solo se utiliza un permiso cuando ha sido concedido y está disponible para la
          aplicación. No se publica contenido sin autorización del titular o administrador
          autorizado y revisión humana del contenido. La programación no sustituye esa
          autorización ni permite eludir los controles de TikTok.
        </p>
      </Seccion>

      <Seccion titulo="Credenciales y tokens">
        <p>
          Los tokens de acceso y las credenciales de aplicación se almacenan cifrados
          únicamente en el servidor. No se incluyen en el código del navegador ni se publican
          en enlaces, informes o registros. Solo los procesos autorizados del servidor los
          utilizan para las operaciones y cuentas que el titular haya autorizado.
        </p>
      </Seccion>

      <Seccion titulo="Acceso y conservación">
        <p>
          El acceso al centro requiere sesión y está segmentado por empresa: cada usuario ve
          solo las propiedades, servicios, mensajes y publicaciones de la empresa a la que
          pertenece. Conservamos el contenido y los mensajes mientras sean necesarios para la
          gestión comercial y las obligaciones aplicables; después se eliminan o anonimizan.
          Los registros se conservan solo mientras sean necesarios para seguridad, auditoría
          y resolución de incidencias. Los tokens se conservan mientras la conexión autorizada
          siga siendo necesaria; una solicitud de eliminación comprende su retirada.
        </p>
      </Seccion>

      <Seccion titulo="Revocación y eliminación">
        <p>
          Puedes revocar los permisos desde la configuración de aplicaciones autorizadas de
          TikTok o de la red social correspondiente. La revocación impide nuevas operaciones
          que dependan de esos permisos; no elimina por sí sola el contenido ya publicado en
          la red social ni los registros conservados por una obligación aplicable. Para
          solicitar la eliminación de datos del centro y de los tokens asociados, sigue el
          procedimiento de /data-deletion, accesible en el enlace «Eliminación de datos» al
          final de esta página. El contenido publicado se gestiona también desde la propia
          plataforma.
        </p>
      </Seccion>

      <Seccion titulo="Derechos y contacto">
        <p>
          Puedes solicitar acceso, corrección, eliminación o, cuando corresponda conforme a
          la normativa aplicable, oposición, limitación y portabilidad de tus datos. Para
          ejercer estos derechos o consultar sobre privacidad, contacta por mensaje directo
          con la página oficial de PANAMA REAL ESTATE o GESTIONES COMERCIALES a la que
          corresponda tu solicitud, o sigue el procedimiento de eliminación de datos.
          Se podrá solicitar la información mínima necesaria para verificar tu identidad
          y evitar entregar o eliminar datos de otra persona.
        </p>
      </Seccion>
    </PaginaLegal>
  );
}
