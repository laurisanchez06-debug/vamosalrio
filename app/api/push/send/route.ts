import { NextResponse } from "next/server";
import {
  enviarPushAUsuarios,
  pushConfigStatus,
  type PushPayload,
} from "@/lib/push/send";
import { pushInternalSecret } from "@/lib/push/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  user_id?: string;
  user_ids?: string[];
  payload?: PushPayload;
};

// Endpoint interno de envío. Protegido con header secreto (x-internal-secret),
// que tiene que matchear la env var PUSH_INTERNAL_SECRET. Acepta uno o varios
// destinatarios (para los eventos multi-destinatario futuros).
export async function POST(req: Request) {
  const secret = pushInternalSecret();
  const header = req.headers.get("x-internal-secret") ?? "";
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cfg = pushConfigStatus();
  if (!cfg.ok) {
    // Patrón autodelator: decir QUÉ ve presente (booleanos, nunca los valores).
    return NextResponse.json(
      {
        error: "Push no configurado",
        hasPublic: cfg.hasPublic,
        hasPrivate: cfg.hasPrivate,
        publicFrom: cfg.publicFrom,
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const userIds: string[] = [];
  if (Array.isArray(body?.user_ids)) userIds.push(...body.user_ids);
  if (typeof body?.user_id === "string") userIds.push(body.user_id);

  const payload = body?.payload;
  if (userIds.length === 0 || !payload?.titulo) {
    return NextResponse.json(
      { error: "Faltan user_id(s) o payload.titulo" },
      { status: 400 },
    );
  }

  const r = await enviarPushAUsuarios(userIds, payload);
  return NextResponse.json({ ok: true, ...r });
}
