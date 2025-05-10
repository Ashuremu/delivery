'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';

// Dynamically import the Map component
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" />
});

interface OrderItem {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  restaurant: string;
}

interface DeliveryDetails {
  address: string;
  phoneNumber: string;
  instructions: string;
  coordinates: LatLngTuple;
}

interface PaymentDetails {
  method: 'cod' | 'gcash' | 'maya' | 'card';
  accountNumber?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

interface Order {
  items: OrderItem[];
  totalPrice: number;
  deliveryDetails: DeliveryDetails;
  paymentDetails: PaymentDetails;
  status: 'preparing' | 'on_route' | 'delivered';
  createdAt: string;
  userId: string;
  estimatedDeliveryTime?: string;
  currentLocation?: LatLngTuple;
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && params.orderId) {
      const orderRef = ref(database, `orders/${user.uid}/${params.orderId}`);
      const unsubscribe = onValue(orderRef, (snapshot) => {
        if (snapshot.exists()) {
          setOrder(snapshot.val());
        } else {
          setError('Order not found');
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [authLoading, user, params.orderId, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600">{error || 'Order not found'}</p>
          </div>
        </main>
      </div>
    );
  }

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
        return 'Preparing your order';
      case 'on_route':
        return 'On the way to you';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Order Status</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                  <span className="text-lg font-medium">{getStatusText(order.status)}</span>
                </div>
                {order.estimatedDeliveryTime && (
                  <p className="text-gray-600">
                    Estimated delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Order Details</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative h-16 w-16 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.restaurant}</p>
                      <p className="text-sm font-medium">
                        {item.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      ₱{(parseFloat(item.price.replace('₱', '')) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₱{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Details</h2>
              <div className="space-y-4">
                <p className="text-gray-600">{order.deliveryDetails.address}</p>
                <p className="text-gray-600">{order.deliveryDetails.phoneNumber}</p>
                {order.deliveryDetails.instructions && (
                  <div className="mt-4">
                    <h3 className="font-medium">Delivery Instructions:</h3>
                    <p className="text-gray-600">{order.deliveryDetails.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Route Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Delivery Route</h2>
            <div className="h-[600px] rounded-lg overflow-hidden border border-gray-300">
              <Map
                onLocationSelect={() => {}}
                initialLocation={order.deliveryDetails.coordinates}

              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 