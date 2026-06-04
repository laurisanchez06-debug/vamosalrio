import "server-only";

// Rate limiter en memoria (best-effort). En serverless cada instancia tiene su
// propio mapa y se reinicia en cold start, así que no es un límite duro; sirve
// como freno básico contra abuso/bots, combinado con el honeypot. Para un
// límite estricto haría falta un store compartido (ej. Upstash/Redis).
const buckets = new Map<string, number[]>();

const UNA_HORA_MS = 60 * 60 * 1000;

export function rateLimit(
  key: string,
  max = 5,
  windowMs = UNA_HORA_MS,
): { ok: boolean; restantes: number } {
  const ahora = Date.now();
  const previos = (buckets.get(key) ?? []).filter((t) => ahora - t < windowMs);

  if (previos.length >= max) {
    buckets.set(key, previos);
    return { ok: false, restantes: 0 };
  }

  previos.push(ahora);
  buckets.set(key, previos);

  // Limpieza oportunista para que el mapa no crezca indefinidamente.
  if (buckets.size > 5000) {
    buckets.forEach((v, k) => {
      const vivos = v.filter((t) => ahora - t < windowMs);
      if (vivos.length === 0) buckets.delete(k);
      else buckets.set(k, vivos);
    });
  }

  return { ok: true, restantes: max - previos.length };
}
