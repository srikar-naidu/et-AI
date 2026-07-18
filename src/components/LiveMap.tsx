"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  type: "counterfeit" | "phishing" | "digital-arrest";
  severity: "low" | "medium" | "high" | "critical";
  count: number;
  location: string;
  district: string;
  latestReportAt: string;
  source: "sample" | "live" | "dataset";
}

function HeatLayer({ hotspots, visible }: { hotspots: Hotspot[]; visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !hotspots.length) return;

    const heatPoints = hotspots.map((hotspot) => [hotspot.lat, hotspot.lng, Math.max(0.2, hotspot.count / 10)]) as [number, number, number][];
    const heatLayer = (L as typeof L & {
      heatLayer: (points: [number, number, number][], options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void; remove: () => void };
    }).heatLayer(heatPoints, {
      radius: 26,
      blur: 20,
      maxZoom: 10,
      gradient: {
        0.2: "#00ff66",
        0.45: "#facc15",
        0.7: "#f97316",
        1.0: "#ff003c",
      },
    });

    heatLayer.addTo(map);

    return () => {
      heatLayer.remove();
    };
  }, [hotspots, map, visible]);

  return null;
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
  showHeatmap,
}: {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelect: (hotspot: Hotspot) => void;
  showHeatmap: boolean;
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
      <HeatLayer hotspots={hotspots} visible={showHeatmap} />
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
