'use client';

import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';

// Dynamically import the entire map component
const MapWithNoSSR = dynamic(
  () => import('./MapContent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" />
    ),
  }
);

interface MapProps {
  onLocationSelect?: (coordinates: LatLngTuple, address: string) => void;
  initialLocation?: LatLngTuple;
  restaurantLocation?: LatLngTuple;
  restaurantName?: string;
}

export default function Map(props: MapProps) {
  return <MapWithNoSSR {...props} />;
} 