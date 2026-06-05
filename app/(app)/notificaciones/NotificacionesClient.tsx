"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  aceptarSolicitudDesdeNotif,
  marcarNotificacionesLeidasAction,
  rechazarSolicitudDesdeNotif,
} from "./actions";

type Rel<T> = T | T[] | null;

export type NotifItem = {
  id: string;
  tipo: string;
  leida: boolean;
  created_at: string;
  salida_id: string | null;
  participacion_id: string | null;
  salida: Rel<{ titulo: string | null }>;
  actor: Rel<{ nombre: string | null }>;
  participacion: Rel<{ estado: string }>;
};

function unwrap<T>(v: Rel<T>): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificacionesClient({ items }: { items: NotifItem[] }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Congelamos qué estaba sin leer en este render: aunque marquemos leídas y
  // refresquemos (para bajar el badge), el resaltado de "nuevo" se mantiene.
  const [noLeidasIniciales] = useState(
    () => new Set(items.filter((i) => !i.leida).map((i) => i.id)),
  );

  useEffect(() => {
    if (items.some((i) => !i.leida)) {
      marcarNotificacionesLeidasAction()
        .then(() => router.refresh())
        .catch(() => {});
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function responder(
    fn: (p: string, s: string) => Promise<{ ok: true } | { error: string }>,
    participacionId: string | null,
    salidaId: string | null,
  ) {
    if (!participacionId || !salidaId) return;
    setError(null);
    startTransition(async () => {
      const r = await fn(participacionId, salidaId);
      if (r && "error" in r) setError(r.error);
      else router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-10 text-center">
        <p className="text-sm text-tinta/60">
          No tenés notificaciones todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {error ? (
        <p className="rounded-xl bg-arena/15 px-4 py-3 text-sm text-arena">
          {error}
        </p>
      ) : null}

      {items.map((item) => {
        const salida = unwrap(item.salida);
        const actor = unwrap(item.actor);
        const part = unwrap(item.participacion);
        const tituloSalida = salida?.titulo ?? "una salida";
        const nombre = actor?.nombre ?? "Alguien";
        const nuevo = noLeidasIniciales.has(item.id);
        const href = item.salida_id
          ? `/salida/${item.salida_id}${item.tipo === "chat" ? "?tab=chat" : ""}`
          : "/feed";

        const pendienteDeResponder =
          item.tipo === "solicitud_recibida" && part?.estado === "pendiente";

        let texto: React.ReactNode;
        switch (item.tipo) {
          case "solicitud_recibida":
            texto = (
              <>
                <strong className="font-semibold text-noche">{nombre}</strong>{" "}
                quiere sumarse a{" "}
                <strong className="font-semibold text-noche">
                  {tituloSalida}
                </strong>
                {!pendienteDeResponder && part?.estado ? (
                  <span className="text-tinta/50">
                    {" "}
                    ·{" "}
                    {part.estado === "aceptado"
                      ? "la aceptaste"
                      : part.estado === "rechazado"
                        ? "la rechazaste"
                        : part.estado}
                  </span>
                ) : null}
              </>
            );
            break;
          case "solicitud_aceptada":
            texto = (
              <>
                Te aceptaron en{" "}
                <strong className="font-semibold text-noche">
                  {tituloSalida}
                </strong>
                . 🎉
              </>
            );
            break;
          case "solicitud_rechazada":
            texto = (
              <>
                Tu solicitud a{" "}
                <strong className="font-semibold text-noche">
                  {tituloSalida}
                </strong>{" "}
                fue rechazada.
              </>
            );
            break;
          case "chat":
            texto = (
              <>
                {nombre !== "Alguien" ? (
                  <strong className="font-semibold text-noche">{nombre}</strong>
                ) : (
                  "Hay mensajes nuevos"
                )}
                {nombre !== "Alguien" ? " y la tripulación escribieron en " : " en "}
                <strong className="font-semibold text-noche">
                  {tituloSalida}
                </strong>
                . 💬
              </>
            );
            break;
          case "cancelacion":
            texto = (
              <>
                Se canceló{" "}
                <strong className="font-semibold text-noche">
                  {tituloSalida}
                </strong>
                .
              </>
            );
            break;
          default:
            texto = <>{item.tipo}</>;
        }

        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 ${
              nuevo
                ? "border-rio/30 bg-rio/5"
                : "border-tinta/10 bg-white"
            }`}
          >
            <Link href={href} className="block">
              <div className="flex items-start gap-3">
                {nuevo ? (
                  <span
                    aria-label="No leída"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rio"
                  />
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-tinta/80">
                    {texto}
                  </p>
                  <p className="mt-1 text-xs text-tinta/45">
                    {tiempoRelativo(item.created_at)}
                  </p>
                </div>
              </div>
            </Link>

            {pendienteDeResponder ? (
              <div className="mt-3 flex gap-2 pl-5">
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    responder(
                      aceptarSolicitudDesdeNotif,
                      item.participacion_id,
                      item.salida_id,
                    )
                  }
                  className="rounded-xl bg-rio px-4 py-2 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-60"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    responder(
                      rechazarSolicitudDesdeNotif,
                      item.participacion_id,
                      item.salida_id,
                    )
                  }
                  className="rounded-xl border border-tinta/15 px-4 py-2 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
