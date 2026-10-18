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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminos,
});

function Terminos() {
  return (
    <PaginaLegal
      titulo="Términos de uso"
      descripcion="Estas condiciones regulan el uso del centro de gestión de redes sociales compartido por PANAMA REAL ESTATE y GESTIONES COMERCIALES."
      actualizado="18 de octubre de 2026"
    >
      <Seccion titulo="1. Objeto y alcance">
        <p>
          El centro es una herramienta interna de las empresas indicadas. Permite generar
          borradores de contenido, aprobarlos, programarlos y publicarlos en las cuentas de
          Facebook, Instagram y TikTok de cada empresa, según los permisos y funciones
          disponibles, así como atender los mensajes recibidos en las redes que lo permitan.
          El uso del centro implica aceptar estas condiciones y las normas de la plataforma
          correspondiente.
        </p>
      </Seccion>

      <Seccion titulo="2. Acceso autorizado">
        <p>
          El acceso está limitado a colaboradores autorizados con sesión activa y rol asignado.
          Cada usuario es responsable de la confidencialidad de sus credenciales y solo puede
          operar sobre la empresa a la que fue asignado.
          Solo se pueden conectar cuentas cuyo titular haya autorizado su administración;
          disponer de acceso al centro no concede acceso a cuentas de terceros.
        </p>
      </Seccion>

      <Seccion titulo="3. Conexión de cuentas sociales">
        <p>
          Las cuentas se conectan mediante los flujos de autorización oficiales de cada
          plataforma. Solo el titular o administrador de la página puede autorizar la conexión, y
          puede revocarla en cualquier momento desde la configuración de aplicaciones
          autorizadas de la plataforma. No se realizarán publicaciones ni otras operaciones
          que requieran permisos revocados. La autorización de una cuenta no sustituye la
          aprobación del contenido que se pretende enviar.
        </p>
      </Seccion>

      <Seccion titulo="4. Revisión humana y responsabilidad del contenido">
        <p>
          Los borradores generados de forma automatizada requieren revisión y aprobación humana
          antes de publicarse. Las empresas son responsables del contenido final, de la exactitud
          de la información sobre propiedades, servicios y precios, y del cumplimiento de las
          normas de cada plataforma.
          Quien aprueba un envío debe comprobar la cuenta destinataria, el texto, las imágenes
          o videos, la programación y los derechos de uso del material. No debe publicar datos
          personales de terceros sin una base válida ni presentar información no verificada
          como cierta.
        </p>
      </Seccion>

      <Seccion titulo="5. Borradores, carga de videos y Direct Post en TikTok">
        <p>
          El flujo de trabajo parte de un borrador, continúa con su revisión y aprobación
          humana y, solo después, permite programar o solicitar el envío. El permiso
          user.info.basic identifica la cuenta autorizada. Con video.upload, el video se
          remite al flujo de carga de TikTok para que el titular revise y complete la
          publicación en TikTok: no constituye publicación automática ni Direct Post.
        </p>
        <p>
          Direct Post está condicionado a la aprobación de video.publish por TikTok, a la
          autorización de ese permiso por el titular y a la disponibilidad de la función
          en el centro. Mientras no se cumplan estos requisitos, no se ofrece ni garantiza
          publicación directa automática. No se usará la programación para eludir la
          revisión, el consentimiento, las opciones de privacidad ni los requisitos de
          TikTok. Un borrador o un envío en cola no demuestra que el contenido haya sido
          publicado en la plataforma.
        </p>
      </Seccion>

      <Seccion titulo="6. Usos prohibidos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Publicar contenido engañoso, ilegal o que infrinja derechos de terceros.</li>
          <li>Intentar acceder a datos de una empresa distinta a la asignada.</li>
          <li>Extraer, compartir o reutilizar credenciales, tokens o datos de contacto.</li>
          <li>Suplantar identidades, enviar spam o publicar sin autorización del titular.</li>
          <li>Eludir la revisión humana, los permisos, límites o controles de las plataformas.</li>
          <li>Usar mensajes o datos personales para fines ajenos a la gestión autorizada.</li>
        </ul>
      </Seccion>

      <Seccion titulo="7. Disponibilidad y programación">
        <p>
          El servicio puede interrumpirse por mantenimiento o por cambios y límites de las APIs
          de las plataformas. No garantizamos la publicación cuando la plataforma rechaza o
          limita una solicitud. Tampoco se garantiza una hora exacta de publicación cuando
          intervengan interrupciones, procesamiento de videos, permisos insuficientes o
          límites de la plataforma. Una hora programada no subsana la falta de autorización
          o de aprobación del contenido; el resultado del envío debe verificarse en la red.
        </p>
      </Seccion>

      <Seccion titulo="8. Revocación, privacidad y eliminación de datos">
        <p>
          El tratamiento de datos se describe en la política de privacidad. Las solicitudes de
          eliminación se atienden según el procedimiento publicado en la página de eliminación de
          datos.
          Puedes retirar la autorización de la cuenta en la plataforma correspondiente y
          solicitar la eliminación de los datos y tokens asociados mediante /data-deletion.
          Revocar el acceso no borra automáticamente publicaciones existentes en TikTok u
          otras redes; su eliminación también se gestiona en esas plataformas. Pueden
          conservarse únicamente los datos necesarios para obligaciones aplicables,
          conforme a la política de privacidad.
        </p>
      </Seccion>

      <Seccion titulo="9. Contacto">
        <p>
          Para cualquier consulta sobre estos términos, escríbenos por mensaje directo a
          la página oficial de PANAMA REAL ESTATE o GESTIONES COMERCIALES a la que corresponda
          tu consulta. Los enlaces a Privacidad, Términos y Eliminación de datos permanecen
          disponibles al final de esta página.
        </p>
      </Seccion>
    </PaginaLegal>
  );
}
