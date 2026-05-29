type Props = {
  titulo: string;
  subtitulo?: string;
};

export default function Placeholder({ titulo, subtitulo }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-noche">{titulo}</h1>
      {subtitulo ? (
        <p className="mt-3 max-w-sm text-tinta/70">{subtitulo}</p>
      ) : (
        <p className="mt-3 max-w-sm text-tinta/70">Próximamente.</p>
      )}
    </div>
  );
}
