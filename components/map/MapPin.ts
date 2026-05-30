import L from "leaflet";

// Pin de marca (rio) como divIcon — evita el problema de los assets rotos
// del marcador por defecto de Leaflet con bundlers.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path d="M15 1C7.8 1 2 6.6 2 13.6 2 22 15 37 15 37s13-15 13-23.4C28 6.6 22.2 1 15 1z" fill="#0EA5E9" stroke="#ffffff" stroke-width="2"/><circle cx="15" cy="13.5" r="4.5" fill="#ffffff"/></svg>`;

export const pinIcon = L.divIcon({
  className: "vlr-pin",
  html: PIN_SVG,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});
