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
    ],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      descripcion="Este centro interno se usa para planificar, revisar y publicar contenido en las cuentas de Facebook, Instagram y TikTok administradas por PANAMA REAL ESTATE y GESTIONES COMERCIALES."
      actualizado="24 de agosto de 2026"
    >
      <Seccion titulo="Quiénes somos">
        <p>
          PANAMA REAL ESTATE (alquiler y venta de propiedades) y GESTIONES COMERCIALES
          (asesorías, trámites y gestiones) operan un centro compartido de gestión de redes
          sociales. Cada empresa administra únicamente sus propias cuentas, contenidos y
          conversaciones.
        </p>
      </Seccion>

      <Seccion titulo="Datos que tratamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Datos de las cuentas administradas:</strong>{" "}
            nombre de la página o perfil, identificadores públicos y permisos otorgados al
            autorizar la conexión.
          </li>
          <li>
            <strong className="text-foreground">Contenido de marketing:</strong> borradores,
            textos, imágenes, programación y publicaciones aprobadas por el equipo.
          </li>
          <li>
            <strong className="text-foreground">Mensajes y solicitudes:</strong> consultas que
            las personas nos envían por las páginas administradas, para atenderlas y darles
            seguimiento comercial.
          </li>
          <li>
            <strong className="text-foreground">Registros técnicos:</strong> fecha y resultado
            de cada intento de publicación o autorización, con fines de auditoría.
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

      <Seccion titulo="Credenciales y tokens">
        <p>
          Los tokens de acceso y credenciales de aplicación se guardan cifrados en el servidor y
          nunca se muestran en pantalla, en enlaces ni en informes. Solo los procesos del
          servidor los utilizan para publicar en las cuentas que el titular autorizó. Puedes
          revocar el acceso en cualquier momento desde la configuración de la red social
          correspondiente.
        </p>
      </Seccion>

      <Seccion titulo="Acceso y conservación">
        <p>
          El acceso al centro requiere sesión y está segmentado por empresa: cada usuario ve
          solo las propiedades, servicios, mensajes y publicaciones de la empresa a la que
          pertenece. Conservamos el contenido y los mensajes mientras sean necesarios para la
          gestión comercial y las obligaciones aplicables; después se eliminan o anonimizan.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo por mensaje
          directo a cualquiera de las páginas administradas, o siguiendo el procedimiento de la
          página de eliminación de datos.
        </p>
      </Seccion>
    </PaginaLegal>
  );
}
