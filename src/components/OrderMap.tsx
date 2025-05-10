'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface OrderMapProps {
  restaurantLocation: LatLngTuple;
  deliveryLocation: LatLngTuple;
  currentLocation?: LatLngTuple;
}

function DeliveryRoute({ 
  restaurantLocation, 
  deliveryLocation,
  currentLocation 
}: OrderMapProps) {
  const map = useMap();
  const [routeControl, setRouteControl] = useState<L.Routing.Control | null>(null);

  useEffect(() => {
    // Initialize routing control with OSRM
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(restaurantLocation[0], restaurantLocation[1]),
        L.latLng(deliveryLocation[0], deliveryLocation[1])
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      routeWhileDragging: false,
      show: true,
      addWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [
          { 
            color: '#FF0000',
            weight: 12,
            opacity: 1.0
          }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      }
    }).addTo(map);

    // Fit the map to show the entire route
    const bounds = L.latLngBounds([
      L.latLng(restaurantLocation[0], restaurantLocation[1]),
      L.latLng(deliveryLocation[0], deliveryLocation[1])
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    setRouteControl(routingControl);

    return () => {
      if (routeControl) {
        map.removeControl(routeControl);
      }
    };
  }, [map, restaurantLocation, deliveryLocation]);

  // Update route when current location changes
  useEffect(() => {
    if (!routeControl || !currentLocation) return;

    routeControl.setWaypoints([
      L.latLng(currentLocation[0], currentLocation[1]),
      L.latLng(deliveryLocation[0], deliveryLocation[1])
    ]);

    // Update bounds to include current location
    const bounds = L.latLngBounds([
      L.latLng(currentLocation[0], currentLocation[1]),
      L.latLng(deliveryLocation[0], deliveryLocation[1])
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [currentLocation, deliveryLocation, routeControl, map]);

  return null;
}

export default function OrderMap({ 
  restaurantLocation, 
  deliveryLocation,
  currentLocation 
}: OrderMapProps) {
  // Calculate center point between restaurant and delivery location
  const center: LatLngTuple = [
    (restaurantLocation[0] + deliveryLocation[0]) / 2,
    (restaurantLocation[1] + deliveryLocation[1]) / 2
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DeliveryRoute
        restaurantLocation={restaurantLocation}
        deliveryLocation={deliveryLocation}
        currentLocation={currentLocation}
      />
    </MapContainer>
  );
} 