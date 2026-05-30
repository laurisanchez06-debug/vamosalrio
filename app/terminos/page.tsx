import type { Metadata } from "next";
import LegalShell, { Clausula } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Términos y Condiciones — vamosalrio",
  description:
    "Términos y condiciones de uso de vamosalrio. Borrador pendiente de revisión legal.",
};

export default function TerminosPage() {
  return (
    <LegalShell
      titulo="Términos y Condiciones"
      actualizado="Última actualización: mayo 2026"
      borrador
    >
      <p className="text-pretty leading-relaxed text-tinta/75">
        Estos Términos regulan el uso de <strong>vamosalrio</strong> (la
        “Plataforma”), operada por Kappla SRL. Al usar la Plataforma aceptás
        estos Términos. Si no estás de acuerdo, no la uses.
      </p>

      <Clausula numero={1} titulo="Qué es vamosalrio">
        <p>
          vamosalrio es una <strong>plataforma de coordinación entre usuarios</strong>:
          permite que las personas publiquen salidas al río y que otras pidan
          sumarse. <strong>vamosalrio NO organiza ni opera las salidas, no provee
          embarcaciones, no transporta personas ni presta ningún servicio
          náutico.</strong> Solo facilita el contacto y la coordinación entre quienes
          arman una salida (el “host”) y quienes participan.
        </p>
      </Clausula>

      <Clausula numero={2} titulo="Responsabilidad del host">
        <p>
          El host es el <strong>único responsable</strong> de la salida que publica.
          Esto incluye —sin limitarse a— la embarcación y su estado, las
          habilitaciones y matrículas correspondientes, el cumplimiento de la
          normativa de la Prefectura Naval Argentina y demás autoridades, los
          elementos de seguridad a bordo y la conducción segura durante toda la
          actividad.
        </p>
      </Clausula>

      <Clausula numero={3} titulo="Participación bajo propia responsabilidad">
        <p>
          Cada usuario participa de las salidas <strong>bajo su propia y exclusiva
          responsabilidad</strong> y <strong>asume voluntariamente los riesgos</strong> propios
          de una actividad náutica y al aire libre (entre otros: condiciones del
          río y del clima, naturaleza de la navegación y posibilidad de
          accidentes). Es responsabilidad de cada uno evaluar si está en
          condiciones de participar.
        </p>
      </Clausula>

      <Clausula numero={4} titulo="Deslinde de responsabilidad">
        <p>
          En la máxima medida permitida por la ley, <strong>Kappla SRL no será
          responsable</strong> por accidentes, lesiones, daños o pérdidas —personales
          o materiales— que ocurran antes, durante o después de las salidas
          coordinadas a través de la Plataforma. La relación de la actividad es
          entre los usuarios entre sí; Kappla SRL no es parte de esa relación ni
          garantiza la idoneidad, identidad o conducta de ningún usuario.
        </p>
      </Clausula>

      <Clausula numero={5} titulo="Mayoría de edad">
        <p>
          El uso de la Plataforma está reservado a <strong>personas mayores de 18
          años</strong>. Al crear una cuenta declarás que tenés al menos 18 años de
          edad.
        </p>
      </Clausula>

      <Clausula numero={6} titulo="Conducta y suspensión">
        <p>
          Esperamos respeto y buena fe. No se permite acoso, discriminación,
          violencia, suplantación de identidad, información falsa, ni ningún uso
          ilegal o que ponga en riesgo a otras personas.
        </p>
        <p>
          Podemos <strong>suspender o eliminar cuentas</strong> que incumplan estos Términos,
          reciban reportes fundados o realicen conductas que afecten la seguridad
          o la confianza de la comunidad, sin obligación de aviso previo.
        </p>
      </Clausula>

      <Clausula numero={7} titulo="Cambios">
        <p>
          Podemos actualizar estos Términos. Si los cambios son relevantes, lo
          avisaremos por la Plataforma. El uso continuado implica la aceptación de
          la versión vigente.
        </p>
      </Clausula>

      <p className="text-sm text-tinta/55">
        Dudas o reclamos:{" "}
        <a href="mailto:hola@vamosalrio.com.ar" className="font-medium text-rio">
          hola@vamosalrio.com.ar
        </a>
        .
      </p>
    </LegalShell>
  );
}
