'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet';

interface CheckoutMapProps {
  onLocationSelect: (coordinates: LatLngTuple, address: string) => void;
  initialLocation?: LatLngTuple;
}

function LocationMarker({ onLocationSelect }: { 
  onLocationSelect: (coordinates: LatLngTuple, address: string) => void;
}) {
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [markerIcon, setMarkerIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    // Initialize marker icon
    const icon = new L.Icon({
      iconUrl: '/assets/marker-icon.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
    setMarkerIcon(icon);
  }, []);

  const map = useMapEvents({
    click(e) {
      const newPosition: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      
      // Fetch address using Nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(response => response.json())
        .then(data => {
          const address = data.display_name;
          onLocationSelect(newPosition, address);
        })
        .catch(error => {
          console.error('Error fetching address:', error);
          onLocationSelect(newPosition, 'Selected Location');
        });
    },
  });

  if (!markerIcon) return null;

  return position === null ? null : (
    <Marker position={position} icon={markerIcon}>
      <Popup>Selected Delivery Location</Popup>
    </Marker>
  );
}

export default function CheckoutMap({ onLocationSelect, initialLocation = [14.5995, 120.9842] }: CheckoutMapProps) {
  return (
    <MapContainer
      center={initialLocation}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
} 