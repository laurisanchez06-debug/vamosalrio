"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full animate-pulse rounded-xl bg-tinta/5" />
  ),
});

export default function MapView({ lat, lng }: { lat: number; lng: number }) {
  return <Inner lat={lat} lng={lng} />;
}
