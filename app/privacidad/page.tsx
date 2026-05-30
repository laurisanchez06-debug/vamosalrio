import type { Metadata } from "next";
import LegalShell, { Clausula } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Política de Privacidad — vamosalrio",
  description:
    "Qué datos recolecta vamosalrio, para qué los usa y cómo los protege. Borrador pendiente de revisión legal.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell
      titulo="Política de Privacidad"
      actualizado="Última actualización: mayo 2026"
      borrador
    >
      <p className="text-pretty leading-relaxed text-tinta/75">
        En <strong>vamosalrio</strong> (operada por Kappla SRL) cuidamos tus datos.
        Acá te contamos qué información recolectamos, para qué la usamos y qué
        nunca compartimos.
      </p>

      <Clausula numero={1} titulo="Qué datos recolectamos">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong>Email</strong>: para crear tu cuenta, identificarte e enviarte
            avisos relacionados con tus salidas.
          </li>
          <li>
            <strong>Datos de perfil</strong>: nombre, foto, presentación, usuario de
            Instagram (si elegís cargarlo) y tu reputación dentro de la app.
          </li>
          <li>
            <strong>Intereses</strong>: las actividades que marcás (lancha, pesca,
            kayak, etc.) para mostrarte salidas más afines.
          </li>
          <li>
            <strong>Ubicación de las salidas</strong>: el punto de encuentro que define
            el host para cada salida. Es información de la salida, no de tu
            domicilio.
          </li>
        </ul>
      </Clausula>

      <Clausula numero={2} titulo="Para qué los usamos">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>Operar la Plataforma: crear tu cuenta y mantener tu sesión.</li>
          <li>Mostrar las salidas y conectar a hosts con participantes.</li>
          <li>
            Que el host pueda decidir con contexto (tu presentación e intereses).
          </li>
          <li>Calcular reputación a partir de las calificaciones entre usuarios.</li>
          <li>Enviarte avisos operativos de tus salidas.</li>
        </ul>
      </Clausula>

      <Clausula numero={3} titulo="Qué NO compartimos">
        <p>
          <strong>No publicamos ni compartimos tu dirección exacta de domicilio.</strong>{" "}
          Lo único visible sobre ubicación es el <strong>punto de encuentro</strong> que el
          host decide cargar para una salida. Tu perfil (nombre, foto,
          presentación, intereses y reputación) es visible para otros usuarios
          dentro de la app para generar confianza; tu email no se muestra
          públicamente.
        </p>
      </Clausula>

      <Clausula numero={4} titulo="Dónde se guardan">
        <p>
          Los datos se almacenan en nuestra infraestructura de base de datos y
          autenticación (Supabase). Aplicamos controles de acceso para que cada
          usuario vea solo lo que le corresponde.
        </p>
      </Clausula>

      <Clausula numero={5} titulo="Tus derechos">
        <p>
          Podés acceder a tus datos, corregirlos o pedir que eliminemos tu cuenta
          escribiéndonos a{" "}
          <a href="mailto:hola@vamosalrio.com.ar" className="font-medium text-rio">
            hola@vamosalrio.com.ar
          </a>
          .
        </p>
      </Clausula>
    </LegalShell>
  );
}
