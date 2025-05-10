'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import Image from 'next/image';
import { useState } from 'react';

const restaurantData = {
  'jollibee': {
    name: 'Jollibee',
    logo: '/assets/Jollibee/logo.png',
    description: 'Jollibee is a Filipino multinational chain of fast food restaurants.',
    menu: [
      { name: 'Chickenjoy with Coke Float', price: '₱124.00', image: '/assets/Jollibee/item-1-chickenjoy-cokefloat.png' },
      { name: 'Yum Burger with drinks', price: '₱99.00', image: '/assets/Jollibee/item-2-yumburger-cokefloat.png' },
      { name: 'Peach Mango Pie', price: '₱35.00', image: '/assets/Jollibee/item-3-peachmangopie.png' }
    ]
  },
  'mcdo': {
    name: 'McDonald\'s',
    logo: '/assets/Mcdo/logo.png',
    description: 'McDonald\'s is an American multinational fast food chain.',
    menu: [
      { name: 'Chicken Mcdo ala carte', price: '₱89.00', image: '/assets/Mcdo/item-1-chickenMcdo-alacarte.png' },
      { name: 'Chicken Mcdo with fries and drinks', price: '₱149.00', image: '/assets/Mcdo/item-2-Chicken-McDo-Drink-Fries.png' },
      { name: 'Chicken Mcdo with spaghetti', price: '₱129.00', image: '/assets/Mcdo/item-3-chicken-spaghetti.png' }
    ]
  },
  'potato-corner': {
    name: 'Potato Corner',
    logo: '/assets/PotatoCorner/logo.png',
    description: 'Potato Corner is a Filipino fast food chain specializing in flavored french fries.',
    menu: [
      { name: 'Jumbo Fries', price: '₱45.00', image: '/assets/PotatoCorner/item-1-jumbo.png' },
      { name: 'Mega Fries', price: '₱75.00', image: '/assets/PotatoCorner/item-2-mega.png' },
      { name: 'Giga Pack', price: '₱120.00', image: '/assets/PotatoCorner/item-3-giga.png' }
    ]
  },
  'gong-cha': {
    name: 'Gong Cha',
    logo: '/assets/GongCha/logo.png',
    description: 'Gong Cha is a Taiwanese bubble tea chain.',
    menu: [
      { name: 'Milk Tea with pearl', price: '₱120.00', image: '/assets/GongCha/item-1-Milk-Tea-with-Pearl.png' },
      { name: 'Wintermelon Milk Tea', price: '₱110.00', image: '/assets/GongCha/item-2-Milk-Tea.png' },
      { name: 'Brown Sugar Milk Tea', price: '₱130.00', image: '/assets/GongCha/item-3-brownsugar.png' }
    ]
  }
};

export default function RestaurantPage() {
  const { name } = useParams();
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const restaurant = restaurantData[name as keyof typeof restaurantData];
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});

  const filteredMenu = restaurant?.menu.filter(item =>
    item.name.toLowerCase().includes(menuSearchQuery.toLowerCase())
  );

  const handleQuantityChange = (itemName: string, change: number) => {
    setItemQuantities(prev => {
      const currentQuantity = prev[itemName] || 1;
      const newQuantity = Math.max(1, currentQuantity + change);
      return { ...prev, [itemName]: newQuantity };
    });
  };

  const handleAddToCart = (item: typeof restaurant.menu[0]) => {
    const quantity = itemQuantities[item.name] || 1;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: `${restaurant.name}-${item.name}`,
        name: item.name,
        price: item.price,
        image: item.image,
        restaurant: restaurant.name
      });
    }
    setToastMessage(`${quantity}x ${item.name} added to cart`);
    setShowToast(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Please login to view restaurant details</h1>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Restaurant not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-64 w-full">
            <Image
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              fill
              className="object-contain p-8"
            />
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{restaurant.name}</h1>
            <p className="text-gray-600 mb-8">{restaurant.description}</p>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Menu</h2>
              <div className="w-full max-w-md mx-auto mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenu?.map((item) => (
                  <div key={item.name} className="bg-gray-50 rounded-lg p-4">
                    <div className="relative h-48 w-full mb-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <p className="text-gray-600">{item.price}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.name, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">
                          {itemQuantities[item.name] || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.name, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredMenu?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No menu items found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 