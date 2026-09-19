import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons in React bundlers
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

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  propertyId: string;
  surveyNumber: string;
  village: string;
  area: number;
  height?: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  latitude,
  longitude,
  propertyId,
  surveyNumber,
  village,
  area,
  height = '300px',
}) => {
  const position: [number, number] = [latitude, longitude];

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 z-10 relative">
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-xs space-y-1">
              <strong className="block text-blue-800">{propertyId}</strong>
              <div>Survey: #{surveyNumber}</div>
              <div>Village: {village}</div>
              <div>Area: {area} sq.ft</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
