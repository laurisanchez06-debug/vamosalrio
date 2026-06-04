import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Contacto · vamosalrio",
  description: "Escribinos: comercial@kapplasrl.com",
};

export default function ContactoPage() {
  return (
    <LegalShell titulo="Contacto">
      <section className="space-y-4 text-pretty leading-relaxed text-tinta/75">
        <p>
          ¿Tenés una duda, una sugerencia o algo para reportar? Escribinos y te
          respondemos.
        </p>
        <p>
          Mail:{" "}
          <a
            href="mailto:comercial@kapplasrl.com"
            className="font-semibold text-rio"
          >
            comercial@kapplasrl.com
          </a>
        </p>
        <a
          href="mailto:comercial@kapplasrl.com"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
        >
          Escribinos →
        </a>
      </section>
    </LegalShell>
  );
}
