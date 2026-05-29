import Placeholder from "@/components/Placeholder";

export default function SalidaDetallePage({ params }: { params: { id: string } }) {
  return (
    <Placeholder
      titulo="Detalle de la salida"
      subtitulo={`ID: ${params.id} — próximamente.`}
    />
  );
}
