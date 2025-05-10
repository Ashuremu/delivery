'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  restaurant: string;
}

interface Order {
  items: OrderItem[];
  totalPrice: number;
  deliveryDetails: {
    address: string;
    phoneNumber: string;
    instructions: string;
  };
  paymentDetails: {
    method: 'cod' | 'gcash' | 'maya' | 'card';
  };
  status: 'preparing' | 'on_route' | 'delivered';
  createdAt: string;
  userId: string;
  estimatedDeliveryTime?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<{ [key: string]: Order }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      const ordersRef = ref(database, `orders/${user.uid}`);
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          setOrders(snapshot.val());
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [authLoading, user, router]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return 'bg-yellow-500';
      case 'on_route':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return 'Preparing';
      case 'on_route':
        return 'On the way';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  if (loading || authLoading) {
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
        <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
        {Object.keys(orders).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">You haven't placed any orders yet.</p>
            <Link
              href="/"
              className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(orders)
              .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(([orderId, order]) => (
                <Link
                  key={orderId}
                  href={`/orders/${orderId}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                        <span className="font-medium">{getStatusText(order.status)}</span>
                      </div>
                      <span className="text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={order.items[0].image}
                          alt={order.items[0].name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {order.items.map(item => item.name).join(', ')}
                        </p>
                      </div>
                      <div className="text-lg font-bold">
                        ₱{order.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </main>
    </div>
  );
} 