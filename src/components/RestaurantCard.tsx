'use client';

import Image from 'next/image';
import Link from 'next/link';

interface RestaurantCardProps {
  name: string;
  imagePath: string;
}

export default function RestaurantCard({ name, imagePath }: RestaurantCardProps) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link href={`/restaurant/${slug}`}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48 w-full">
          <Image
            src={imagePath}
            alt={`${name} logo`}
            fill
            className="object-contain p-4"
          />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold text-center">{name}</h3>
        </div>
      </div>
    </Link>
  );
} 