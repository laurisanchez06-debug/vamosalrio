"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { pinIcon } from "./MapPin";

const ROSARIO: [number, number] = [-32.9468, -60.6393];

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

function Picker({
  pos,
  onPick,
}: {
  pos: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!pos) return null;

  return (
    <Marker
      position={pos}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const ll = e.target.getLatLng();
          onPick(ll.lat, ll.lng);
        },
      }}
    />
  );
}

export default function MapPickerInner({ lat, lng, onChange }: Props) {
  const pos: [number, number] | null =
    lat != null && lng != null ? [lat, lng] : null;

  return (
    <div className="h-56 w-full overflow-hidden rounded-2xl border border-tinta/15">
      <MapContainer
        center={pos ?? ROSARIO}
        zoom={pos ? 15 : 12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Picker pos={pos} onPick={onChange} />
      </MapContainer>
    </div>
  );
}
