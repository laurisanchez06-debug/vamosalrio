export default function FeedLoading() {
  return (
    <div className="px-6 pb-6 pt-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-noche">
          Salidas al río
        </h1>
        <p className="mt-2 text-tinta/70">Sumate a una o armá la tuya.</p>
      </header>

      <div className="mt-6 flex gap-2">
        <div className="h-7 w-16 animate-pulse rounded-full bg-tinta/10" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-tinta/10" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-tinta/10" />
      </div>

      <ul className="mt-5 space-y-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-tinta/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-tinta/10" />
                <div className="h-2 w-1/5 animate-pulse rounded bg-tinta/10" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-tinta/10" />
            </div>
            <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-tinta/10" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-1/2 animate-pulse rounded bg-tinta/10" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-tinta/10" />
            </div>
            <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-tinta/10" />
          </li>
        ))}
      </ul>
    </div>
  );
}
