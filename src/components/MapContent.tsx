'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet';

interface MapContentProps {
  onLocationSelect?: (coordinates: LatLngTuple, address: string) => void;
  initialLocation?: LatLngTuple;
  restaurantLocation?: LatLngTuple;
  restaurantName?: string;
}

function LocationMarker({ onLocationSelect, restaurantLocation, restaurantName }: { 
  onLocationSelect?: (coordinates: LatLngTuple, address: string) => void;
  restaurantLocation?: LatLngTuple;
  restaurantName?: string;
}) {
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [markerIcon, setMarkerIcon] = useState<L.Icon | null>(null);
  const [restaurantIcon, setRestaurantIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    // Initialize marker icons
    const icon = new L.Icon({
      iconUrl: '/assets/marker-icon.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const restaurantMarkerIcon = new L.Icon({
      iconUrl: '/assets/restaurant-icon.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    setMarkerIcon(icon);
    setRestaurantIcon(restaurantMarkerIcon);
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
          if (onLocationSelect) {
            onLocationSelect(newPosition, address);
          }
        })
        .catch(error => {
          console.error('Error fetching address:', error);
          if (onLocationSelect) {
            onLocationSelect(newPosition, 'Selected Location');
          }
        });
    },
  });

  if (!markerIcon || !restaurantIcon) return null;

  return (
    <>
      {restaurantLocation && (
        <Marker position={restaurantLocation} icon={restaurantIcon}>
          <Popup>{restaurantName || 'Restaurant Location'}</Popup>
        </Marker>
      )}
      {position && (
        <Marker position={position} icon={markerIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>
      )}
      {restaurantLocation && position && (
        <Polyline
          positions={[restaurantLocation, position]}
          color="#4F46E5"
          weight={3}
          opacity={0.7}
        />
      )}
    </>
  );
}

export default function MapContent({ 
  onLocationSelect, 
  initialLocation = [14.5995, 120.9842],
  restaurantLocation,
  restaurantName
}: MapContentProps) {
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
      <LocationMarker 
        onLocationSelect={onLocationSelect}
        restaurantLocation={restaurantLocation}
        restaurantName={restaurantName}
      />
    </MapContainer>
  );
} 