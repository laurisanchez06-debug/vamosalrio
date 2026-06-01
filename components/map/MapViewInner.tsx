"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { pinIcon } from "./MapPin";

// Leaflet a veces calcula tamaño 0 cuando el contenedor recién aparece
// (carga dinámica / dentro de una tab) y no pinta los tiles hasta un resize.
// Forzamos un recálculo apenas monta el mapa.
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapViewInner({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="h-44 w-full overflow-hidden rounded-xl border border-tinta/10">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
        <InvalidateOnMount />
      </MapContainer>
    </div>
  );
}
