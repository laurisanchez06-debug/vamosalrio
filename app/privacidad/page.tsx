import type { Metadata } from "next";
import LegalShell, { Clausula } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Política de Privacidad · vamosalrio",
  description:
    "Qué datos recolecta vamosalrio, para qué los usa y cómo los protege. Operada por Kappla SRL.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell
      titulo="Política de Privacidad"
      actualizado="Última actualización: 1 de junio de 2026"
    >
      <Clausula numero={1} titulo="Responsable del tratamiento">
        <p>
          El responsable de los datos personales es{" "}
          <strong>Kappla SRL</strong> (CUIT 30-71451107-2), Rosario, Santa Fe,
          Argentina. Contacto:{" "}
          <a
            href="mailto:comercial@kapplasrl.com"
            className="font-semibold text-rio"
          >
            comercial@kapplasrl.com
          </a>
          .
        </p>
      </Clausula>

      <Clausula numero={2} titulo="Datos que recolectamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Datos de registro:</strong> nombre, correo electrónico,
            contraseña (almacenada de forma cifrada), fecha de nacimiento y
            género.
          </li>
          <li>
            <strong>Datos de perfil:</strong> foto, descripción personal, enlace
            a redes sociales (ej. Instagram) si el Usuario decide aportarlos.
          </li>
          <li>
            <strong>Datos de uso:</strong> salidas creadas o a las que se sumó,
            mensajes en chats de salidas, calificaciones y referencias.
          </li>
          <li>
            <strong>Datos de ubicación:</strong> puntos de encuentro que el
            Usuario carga; la Plataforma no rastrea la ubicación en tiempo real
            del dispositivo.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y
            datos de navegación necesarios para el funcionamiento del servicio.
          </li>
        </ul>
      </Clausula>

      <Clausula numero={3} titulo="Finalidad del tratamiento">
        <p>
          Utilizamos los datos para: operar la Plataforma y permitir la
          coordinación entre Usuarios; mostrar perfiles a otros Usuarios; enviar
          notificaciones operativas (solicitudes, recordatorios de salidas,
          cambios); garantizar la seguridad y prevenir abusos; y mejorar el
          servicio.
        </p>
      </Clausula>

      <Clausula numero={4} titulo="Base legal">
        <p>
          El tratamiento se basa en el consentimiento del Usuario (Ley 25.326 de
          Protección de Datos Personales) y en la necesidad de ejecutar la
          relación de servicio. El Usuario presta su consentimiento al aceptar
          esta Política durante el registro.
        </p>
      </Clausula>

      <Clausula numero={5} titulo="Con quién compartimos los datos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Con otros Usuarios:</strong> el perfil público (nombre,
            foto, descripción, reputación, edad/rango según configuración) es
            visible para otros Usuarios, como parte esencial del servicio de
            confianza.
          </li>
          <li>
            <strong>Con proveedores de tecnología</strong> que nos prestan
            servicios de infraestructura (alojamiento, base de datos, envío de
            correos). Estos proveedores procesan datos por cuenta de Kappla SRL
            bajo obligaciones de confidencialidad, y pueden alojar datos en
            servidores ubicados fuera de Argentina.
          </li>
          <li>
            <strong>Con autoridades</strong>, cuando exista obligación legal de
            hacerlo.
          </li>
        </ul>
        <p>
          <strong>No vendemos datos personales a terceros.</strong>
        </p>
      </Clausula>

      <Clausula numero={6} titulo="Derechos del titular de los datos">
        <p>
          El Usuario puede ejercer en cualquier momento sus derechos de{" "}
          <strong>acceso, rectificación, actualización y supresión</strong> de
          sus datos, escribiendo a{" "}
          <a
            href="mailto:comercial@kapplasrl.com"
            className="font-semibold text-rio"
          >
            comercial@kapplasrl.com
          </a>
          . El titular de los datos tiene la facultad de ejercer el derecho de
          acceso en forma gratuita a intervalos no inferiores a seis meses (art.
          14, inc. 3, Ley 25.326).
        </p>
        <p>
          La{" "}
          <strong>
            Agencia de Acceso a la Información Pública (AAIP)
          </strong>
          , órgano de control de la Ley 25.326, tiene la atribución de atender
          denuncias y reclamos relativos al incumplimiento de las normas sobre
          datos personales.
        </p>
      </Clausula>

      <Clausula numero={7} titulo="Conservación">
        <p>
          Conservamos los datos mientras la cuenta esté activa y durante el
          plazo necesario para cumplir obligaciones legales. El Usuario puede
          solicitar la baja de su cuenta y la supresión de sus datos en
          cualquier momento.
        </p>
      </Clausula>

      <Clausula numero={8} titulo="Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger
          los datos (cifrado de contraseñas, control de accesos). Ningún sistema
          es 100% infalible; el Usuario también es responsable de proteger sus
          credenciales.
        </p>
      </Clausula>

      <Clausula numero={9} titulo="Menores">
        <p>
          La Plataforma no está dirigida a menores de 18 años y no recolecta
          datos de ellos de manera consciente. Si detectamos datos de un menor,
          los eliminaremos.
        </p>
      </Clausula>

      <Clausula numero={10} titulo="Cookies y tecnologías similares">
        <p>
          Utilizamos cookies y almacenamiento local estrictamente necesarios
          para el funcionamiento del servicio (sesión, preferencias).
        </p>
      </Clausula>

      <Clausula numero={11} titulo="Cambios en esta Política">
        <p>
          Podremos actualizar esta Política. Notificaremos los cambios
          sustanciales a los Usuarios registrados.
        </p>
      </Clausula>

      <Clausula numero={12} titulo="Contacto">
        <p>
          Consultas sobre privacidad y ejercicio de derechos:{" "}
          <a
            href="mailto:comercial@kapplasrl.com"
            className="font-semibold text-rio"
          >
            comercial@kapplasrl.com
          </a>
        </p>
      </Clausula>
    </LegalShell>
  );
}
