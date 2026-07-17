"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  type: "counterfeit" | "phishing" | "digital-arrest";
  severity: "low" | "medium" | "high" | "critical";
  count: number;
  location: string;
}

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;border:2px solid #fff;background:${color};box-shadow:0 0 10px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function LiveMap({
  hotspots,
  selectedHotspot,
  onSelect,
}: {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelect: (hotspot: Hotspot) => void;
}) {
  const center = useMemo<LatLngExpression>(() => {
    if (hotspots.length) {
      return [hotspots[0].lat, hotspots[0].lng] as LatLngExpression;
    }
    return [20.5937, 78.9629] as LatLngExpression;
  }, [hotspots]);

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full min-h-110 w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotspots.map((hotspot) => {
        const iconColor = hotspot.severity === "critical" ? "#ff003c" : hotspot.severity === "high" ? "#f97316" : hotspot.severity === "medium" ? "#facc15" : "#00ff66";
        return (
          <Marker
            key={hotspot.id}
            position={[hotspot.lat, hotspot.lng] as LatLngExpression}
            icon={createMarkerIcon(iconColor)}
            eventHandlers={{ click: () => onSelect(hotspot) }}
          >
            <Popup>
              <div className="space-y-1 text-sm text-slate-800">
                <p className="font-semibold">{hotspot.location}</p>
                <p className="capitalize">{hotspot.type.replace("-", " ")}</p>
                <p>Reports: {hotspot.count}</p>
                <p>Severity: {hotspot.severity}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {selectedHotspot && (
        <Marker position={[selectedHotspot.lat, selectedHotspot.lng] as LatLngExpression} icon={createMarkerIcon("#00f3ff")} />
      )}
    </MapContainer>
  );
}
