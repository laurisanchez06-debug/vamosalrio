"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { pinIcon } from "./MapPin";

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
      </MapContainer>
    </div>
  );
}
