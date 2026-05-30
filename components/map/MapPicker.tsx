"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./MapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full animate-pulse items-center justify-center rounded-2xl bg-tinta/5 text-sm text-tinta/40">
      Cargando mapa…
    </div>
  ),
});

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

export default function MapPicker({ lat, lng, onChange }: Props) {
  return <Inner lat={lat} lng={lng} onChange={onChange} />;
}
