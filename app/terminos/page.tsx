import type { Metadata } from "next";
import LegalShell, { Clausula } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Términos y Condiciones · vamosalrio",
  description:
    "Términos y condiciones de uso de vamosalrio, operada por Kappla SRL.",
};

export default function TerminosPage() {
  return (
    <LegalShell
      titulo="Términos y Condiciones de uso"
      actualizado="Última actualización: 1 de junio de 2026"
    >
      <Clausula numero={1} titulo="Aceptación de los términos">
        <p>
          Al crear una cuenta, acceder o utilizar vamosalrio (en adelante, “la
          Plataforma”), operada por <strong>Kappla SRL</strong> (CUIT
          30-71451107-2, con domicilio en Rosario, Provincia de Santa Fe,
          Argentina), usted (en adelante, “el Usuario”) declara haber leído,
          comprendido y aceptado en su totalidad estos Términos y Condiciones y
          la Política de Privacidad. Si no está de acuerdo, no debe utilizar la
          Plataforma.
        </p>
      </Clausula>

      <Clausula numero={2} titulo="Qué es la Plataforma (y qué no es)">
        <p>
          vamosalrio es{" "}
          <strong>una herramienta tecnológica de intermediación</strong> que
          permite a sus Usuarios publicar, descubrir y coordinar salidas y
          actividades recreativas vinculadas al río y a la vida social, y
          conectarse entre sí.
        </p>
        <p>
          <strong>
            La Plataforma actúa exclusivamente como un punto de encuentro
            digital.
          </strong>{" "}
          De modo expreso:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>
              No organiza, no promueve, no dirige, no supervisa ni participa
            </strong>{" "}
            en ninguna de las salidas, actividades o encuentros publicados por
            los Usuarios.
          </li>
          <li>
            <strong>No es propietaria, no opera, no alquila ni controla</strong>{" "}
            embarcaciones, vehículos, inmuebles ni equipamiento de ningún tipo.
          </li>
          <li>
            <strong>No es parte</strong> de ningún acuerdo, encuentro o relación
            que se genere entre los Usuarios.
          </li>
          <li>
            El rol de la Plataforma es comparable al de un servicio de
            mensajería o tablón de anuncios: provee el medio para que las
            personas se comuniquen y coordinen, pero{" "}
            <strong>
              el contenido, las decisiones y las consecuencias de esas
              coordinaciones son responsabilidad exclusiva de los Usuarios
              involucrados.
            </strong>
          </li>
        </ul>
        <p>
          Toda salida es organizada por un Usuario (“Anfitrión”) por su propia
          cuenta y riesgo. Los demás Usuarios que se suman (“Tripulantes”) lo
          hacen voluntariamente y bajo su propia responsabilidad.
        </p>
      </Clausula>

      <Clausula numero={3} titulo="Requisitos para usar la Plataforma">
        <p>Para registrarse y utilizar la Plataforma, el Usuario debe:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Ser mayor de 18 años</strong> y tener plena capacidad legal
            para contratar.
          </li>
          <li>
            Proporcionar información veraz, exacta y actualizada, incluida su
            fecha de nacimiento real.
          </li>
          <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
        </ul>
        <p>
          <strong>
            La Plataforma está estrictamente prohibida para menores de 18 años.
          </strong>{" "}
          El Usuario que detecte el uso de la Plataforma por un menor debe
          reportarlo de inmediato. Kappla SRL se reserva el derecho de suspender
          o eliminar cualquier cuenta que incumpla este requisito.
        </p>
      </Clausula>

      <Clausula numero={4} titulo="Cuentas de Usuario">
        <p>
          El Usuario es el único responsable de toda actividad realizada desde
          su cuenta. La Plataforma podrá suspender o cancelar cuentas que
          infrinjan estos Términos, sin obligación de aviso previo cuando la
          conducta represente un riesgo para otros Usuarios.
        </p>
      </Clausula>

      <Clausula numero={5} titulo="Asunción de riesgos">
        <p>
          <strong>
            El Usuario reconoce y acepta expresamente que toda salida o
            actividad coordinada a través de la Plataforma conlleva riesgos
            inherentes
          </strong>{" "}
          (incluyendo, sin limitarse a, riesgos físicos, accidentes, lesiones,
          daños materiales o, en casos extremos, riesgo de vida) y que participa{" "}
          <strong>
            voluntariamente, por su propia decisión y bajo su exclusiva
            responsabilidad.
          </strong>
        </p>
        <h3 className="pt-1 font-semibold text-noche">
          5.1. Actividades acuáticas y náuticas
        </h3>
        <p>
          El Usuario comprende que las actividades en el río y en el agua
          (navegación, kayak, natación, pesca, deportes náuticos, estadía en
          islas, etc.) implican{" "}
          <strong>riesgos serios y propios de cada actividad.</strong> En
          particular:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            La conducción de embarcaciones está sujeta a la normativa de la{" "}
            <strong>Prefectura Naval Argentina (PNA)</strong>. Es
            responsabilidad exclusiva del Anfitrión y/o del propietario de la
            embarcación contar con la habilitación correspondiente, el
            equipamiento de seguridad obligatorio (chalecos salvavidas, etc.) y
            los seguros que la ley exija.
          </li>
          <li>
            La Plataforma <strong>no verifica</strong> habilitaciones náuticas,
            estado de embarcaciones, condiciones meteorológicas ni el
            cumplimiento de las normas de seguridad.
          </li>
          <li>
            Cada Usuario es responsable de evaluar las condiciones, su propia
            aptitud física (incluida la capacidad de nadar) y de tomar las
            precauciones que correspondan.
          </li>
        </ul>
        <p>
          El Usuario libera a Kappla SRL de toda responsabilidad por hechos
          derivados de estas actividades.
        </p>
      </Clausula>

      <Clausula numero={6} titulo="Sin verificación de Usuarios">
        <p>
          <strong>
            La Plataforma no verifica la identidad, los antecedentes, la
            conducta ni las intenciones de sus Usuarios.
          </strong>{" "}
          Las calificaciones, referencias y reputación son aportadas por la
          propia comunidad y constituyen únicamente opiniones de otros Usuarios;{" "}
          <strong>no son garantía</strong> de la idoneidad, honestidad o
          seguridad de ninguna persona.
        </p>
        <p>
          El Usuario es el único responsable de tomar sus propias precauciones
          al interactuar o encontrarse con otros Usuarios, incluyendo (pero no
          limitado a) informarse sobre la persona, encontrarse en lugares
          apropiados y avisar a terceros de confianza sobre sus planes.
        </p>
      </Clausula>

      <Clausula numero={7} titulo="Relación entre Usuarios">
        <p>
          Cualquier disputa, conflicto, daño o reclamo entre Usuarios (sea
          económico, personal, físico o de cualquier naturaleza) es{" "}
          <strong>ajeno a la Plataforma</strong> y debe resolverse directamente
          entre las partes involucradas. Kappla SRL no media, no arbitra ni
          asume responsabilidad alguna en dichos conflictos.
        </p>
      </Clausula>

      <Clausula numero={8} titulo="Conducta del Usuario y contenido">
        <p>
          El Usuario se compromete a no utilizar la Plataforma para fines
          ilícitos ni para publicar contenido falso, ofensivo, discriminatorio,
          fraudulento o que vulnere derechos de terceros. El Usuario es el único
          responsable del contenido que publica (textos, fotos, descripciones).
          Kappla SRL podrá remover contenido y suspender cuentas a su criterio,
          pero <strong>no tiene obligación de monitorear</strong> el contenido
          publicado y no responde por él.
        </p>
      </Clausula>

      <Clausula numero={9} titulo="Cancelaciones, ausencias y reputación">
        <p>
          La Plataforma ofrece mecanismos de cancelación, cuórum mínimo y
          registro de cancelaciones tardías con el fin de fomentar la buena
          conducta de la comunidad. Estos mecanismos son{" "}
          <strong>herramientas de organización entre Usuarios</strong> y no
          generan obligación legal alguna a cargo de Kappla SRL. El
          incumplimiento de un Usuario (no presentarse, cancelar a último
          momento, etc.) es responsabilidad de ese Usuario.
        </p>
      </Clausula>

      <Clausula numero={10} titulo="Propiedad intelectual">
        <p>
          La Plataforma, su marca, diseño, código y contenidos propios son
          propiedad de Kappla SRL. El Usuario conserva los derechos sobre el
          contenido que sube, pero otorga a la Plataforma una licencia no
          exclusiva y gratuita para mostrarlo dentro del servicio.
        </p>
      </Clausula>

      <Clausula numero={11} titulo="Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la legislación argentina aplicable,
          Kappla SRL <strong>no será responsable</strong> por daños directos,
          indirectos, incidentales o consecuentes derivados de: (a) el uso o la
          imposibilidad de uso de la Plataforma; (b) la conducta de cualquier
          Usuario, dentro o fuera de la Plataforma; (c) las salidas, actividades
          o encuentros coordinados a través de la Plataforma; (d) la veracidad
          de la información publicada por los Usuarios.
        </p>
      </Clausula>

      <Clausula numero={12} titulo="Indemnidad">
        <p>
          El Usuario se compromete a mantener indemne a Kappla SRL, sus socios,
          directivos y colaboradores, frente a cualquier reclamo, demanda, daño
          o gasto (incluidos honorarios legales) que surja de su uso de la
          Plataforma, de su conducta o del incumplimiento de estos Términos.
        </p>
      </Clausula>

      <Clausula numero={13} titulo="Modificaciones del servicio y de los Términos">
        <p>
          Kappla SRL podrá modificar la Plataforma o estos Términos en cualquier
          momento. Los cambios sustanciales serán comunicados a los Usuarios. El
          uso continuado tras la modificación implica aceptación de los nuevos
          términos.
        </p>
      </Clausula>

      <Clausula numero={14} titulo="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Para
          cualquier controversia, las partes se someten a la jurisdicción de los
          tribunales ordinarios de la ciudad de{" "}
          <strong>Rosario, Provincia de Santa Fe</strong>, sin perjuicio de los
          derechos irrenunciables que la Ley de Defensa del Consumidor reconozca
          al Usuario.
        </p>
      </Clausula>

      <Clausula numero={15} titulo="Contacto">
        <p>
          Consultas sobre estos Términos:{" "}
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
