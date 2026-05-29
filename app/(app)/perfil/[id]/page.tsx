import Placeholder from "@/components/Placeholder";

export default function PerfilOtroPage({ params }: { params: { id: string } }) {
  return (
    <Placeholder
      titulo="Perfil"
      subtitulo={`Usuario ${params.id} — próximamente.`}
    />
  );
}
