export default function CapitanBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-noche px-2 py-0.5 text-[11px] font-semibold text-crema ${className}`}
      title="Capitán: host con varias salidas finalizadas y muy buena reputación"
    >
      <span aria-hidden>⚓</span> Capitán
    </span>
  );
}
