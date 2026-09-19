import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

const LocationMarker: React.FC<{
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  onSelect: (lat: number, lng: number) => void;
}> = ({ position, setPosition, onSelect }) => {
  useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} />;
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  height = '320px',
}) => {
  const [position, setPosition] = useState<[number, number]>([
    latitude || 12.9716, // Default Bangalore
    longitude || 77.5946,
  ]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Click on the map to pinpoint cadastral parcel coordinates:</span>
        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
          Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
        </span>
      </div>
      <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-300 z-10 relative">
        <MapContainer
          center={position}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onSelect={onLocationSelect}
          />
        </MapContainer>
      </div>
    </div>
  );
};
