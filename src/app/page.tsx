'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { useState } from 'react';

const restaurants = [
  {
    name: 'Jollibee',
    imagePath: '/assets/Jollibee/logo.png'
  },
  {
    name: 'Mcdo',
    imagePath: '/assets/Mcdo/logo.png'
  },
  {
    name: 'Potato Corner',
    imagePath: '/assets/PotatoCorner/logo.png'
  },
  {
    name: 'Gong Cha',
    imagePath: '/assets/GongCha/logo.png'
  }
];

export default function Home() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold mb-6">Welcome to Delivery App</h1>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h2 className="text-lg font-semibold mb-2">User Information</h2>
                  <p className="text-gray-600">Email: {user.email}</p>
                  <p className="text-gray-600">User ID: {user.uid}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Available Restaurants</h2>
              <SearchBar onSearch={setSearchQuery} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.name}
                    name={restaurant.name}
                    imagePath={restaurant.imagePath}
                  />
                ))}
              </div>
              {filteredRestaurants.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No restaurants found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Delivery App
            </h1>
            <p className="text-xl text-gray-600">
              Please login or register to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
