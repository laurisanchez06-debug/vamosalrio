// Notificaciones por mail vía Resend (REST, sin SDK extra).
// Todo es fire-and-forget y a prueba de fallos: si falta RESEND_API_KEY o el
// envío falla, NUNCA lanza — la server action que la llama sigue normal.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "Vamosalrio <hola@vamosalrio.com>";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send(to: string, subject: string, html: string) {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key || !to) return; // sin API key o sin destinatario: no-op
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch {
    // fire-and-forget: jamás rompe la acción
  }
}

function layout({
  titulo,
  cuerpo,
  ctaText,
  ctaHref,
}: {
  titulo: string;
  cuerpo: string;
  ctaText: string;
  ctaHref: string;
}) {
  // Estilos inline (los clientes de mail no soportan clases). Paleta de marca.
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#FBFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBFAF7;padding:24px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(17,24,39,0.06);">
            <tr>
              <td style="background:#0EA5E9;padding:18px 24px;">
                <span style="color:#FBFAF7;font-size:18px;font-weight:700;letter-spacing:-0.02em;">⚓ vamosalrio</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <h1 style="margin:0 0 12px;color:#0C4A6E;font-size:22px;line-height:1.25;font-weight:700;">${titulo}</h1>
                <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">${cuerpo}</p>
                <a href="${ctaHref}" style="display:inline-block;background:#0EA5E9;color:#FBFAF7;text-decoration:none;font-size:15px;font-weight:600;padding:13px 24px;border-radius:14px;">${ctaText}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">Salidas al río con gente que ya sabés quién es.<br/>Recibís este mail porque tenés una cuenta en vamosalrio.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function emailNuevaSolicitud(p: {
  to: string;
  solicitante: string;
  titulo: string;
  salidaId: string;
}) {
  await send(
    p.to,
    `Alguien quiere sumarse a "${p.titulo}"`,
    layout({
      titulo: "Nueva solicitud para tu salida",
      cuerpo: `<strong>${esc(p.solicitante)}</strong> quiere sumarse a tu salida <strong>"${esc(p.titulo)}"</strong>. Mirá su presentación y decidí si lo sumás a la tripulación.`,
      ctaText: "Ver solicitud",
      ctaHref: `${appUrl()}/salida/${p.salidaId}`,
    }),
  );
}

export async function emailSolicitudAceptada(p: {
  to: string;
  titulo: string;
  salidaId: string;
}) {
  await send(
    p.to,
    `¡Te aceptaron en "${p.titulo}"!`,
    layout({
      titulo: "¡Estás adentro! 🎉",
      cuerpo: `Te aceptaron en <strong>"${esc(p.titulo)}"</strong>. Coordiná con la tripulación por el chat y preparate para el río.`,
      ctaText: "Ver la salida",
      ctaHref: `${appUrl()}/salida/${p.salidaId}`,
    }),
  );
}

export async function emailSolicitudRechazada(p: {
  to: string;
  titulo: string;
}) {
  await send(
    p.to,
    `Sobre tu solicitud a "${p.titulo}"`,
    layout({
      titulo: "Esta vez no quedó lugar",
      cuerpo: `No quedó lugar en <strong>"${esc(p.titulo)}"</strong> esta vez. ¡No te desanimes! Hay un montón de salidas esperándote.`,
      ctaText: "Explorar salidas",
      ctaHref: `${appUrl()}/feed`,
    }),
  );
}

export async function emailSalidaFinalizada(p: {
  to: string;
  titulo: string;
  salidaId: string;
}) {
  await send(
    p.to,
    `Calificá tu salida "${p.titulo}"`,
    layout({
      titulo: "¿Cómo estuvo la salida?",
      cuerpo: `Terminó <strong>"${esc(p.titulo)}"</strong>. Dejá tu calificación y una referencia a la tripulación, así todos salen más tranquilos la próxima.`,
      ctaText: "Calificar la salida",
      ctaHref: `${appUrl()}/salida/${p.salidaId}/calificar`,
    }),
  );
}

export async function emailSalidaCancelada(p: { to: string; titulo: string }) {
  await send(
    p.to,
    `Se canceló "${p.titulo}"`,
    layout({
      titulo: "Se canceló la salida",
      cuerpo: `El organizador canceló <strong>"${esc(p.titulo)}"</strong>. Disculpá las molestias. Buscá otra salida para sumarte al río.`,
      ctaText: "Ver otras salidas",
      ctaHref: `${appUrl()}/feed`,
    }),
  );
}

// Recordatorio automático 24hs antes de la salida (Vercel Cron).
// misAportes: lo que ESTE usuario reclamó llevar. cadaUno: aportes "cada uno
// trae lo suyo" (fallback si no reclamó nada). quorumNota: solo para el host.
export async function emailRecordatorio(p: {
  to: string;
  titulo: string;
  fechaTexto: string;
  punto: string | null;
  salidaId: string;
  misAportes: string[];
  cadaUno: string[];
  notaHost?: string | null;
}) {
  const lineas: string[] = [`📅 <strong>${esc(p.fechaTexto)}</strong>`];
  if (p.punto) lineas.push(`📍 ${esc(p.punto)}`);
  // notaHost ya viene formateada (emojis + <br/>) y con contenido controlado.
  if (p.notaHost) lineas.push(p.notaHost);
  if (p.misAportes.length) {
    lineas.push(`🎒 Llevás vos: <strong>${p.misAportes.map(esc).join(", ")}</strong>`);
  } else if (p.cadaUno.length) {
    lineas.push(
      `🎒 Acordate de llevar lo tuyo: ${p.cadaUno.map(esc).join(", ")}`,
    );
  }
  await send(
    p.to,
    `¡Mañana es la salida! 🌊 ${p.titulo}`,
    layout({
      titulo: "¡Mañana salís al río!",
      cuerpo: lineas.join("<br/><br/>"),
      ctaText: "Ver la salida",
      ctaHref: `${appUrl()}/salida/${p.salidaId}`,
    }),
  );
}

// Avisa al host que un invitado aceptado se bajó de la salida.
export async function emailInvitadoSeBajo(p: {
  to: string;
  invitado: string;
  titulo: string;
  salidaId: string;
}) {
  await send(
    p.to,
    `${p.invitado} se bajó de "${p.titulo}"`,
    layout({
      titulo: "Un tripulante se bajó",
      cuerpo: `<strong>${esc(p.invitado)}</strong> ya no va a <strong>"${esc(p.titulo)}"</strong>. Se liberó un lugar, así que podés aceptar a alguien de la lista de espera.`,
      ctaText: "Ver la salida",
      ctaHref: `${appUrl()}/salida/${p.salidaId}`,
    }),
  );
}
