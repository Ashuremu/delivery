'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import Toast from '@/components/Toast';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';

// Dynamically import the CheckoutMap component
const CheckoutMap = dynamic(() => import('@/components/CheckoutMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" />
});

interface DeliveryDetails {
  address: string;
  phoneNumber: string;
  instructions: string;
  coordinates: LatLngTuple;
}

type PaymentMethod = 'cod' | 'gcash' | 'maya' | 'card';

interface PaymentDetails {
  method: PaymentMethod;
  accountNumber?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    address: '',
    phoneNumber: '',
    instructions: '',
    coordinates: [14.5995, 120.9842] // Default to Manila coordinates
  });
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'cod'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle authentication and cart loading
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (items.length === 0) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, user, items, router]);

  // Handle success redirect
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeliveryDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (coordinates: LatLngTuple, address: string) => {
    setDeliveryDetails(prev => ({
      ...prev,
      coordinates,
      address
    }));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentDetails(prev => ({
      ...prev,
      method,
      accountNumber: undefined,
      cardNumber: undefined,
      expiryDate: undefined,
      cvv: undefined
    }));
  };

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting order placement process...');
    console.log('Current user:', user);
    console.log('Cart items:', items);
    console.log('Delivery details:', deliveryDetails);
    console.log('Payment details:', paymentDetails);
    
    try {
      if (!user) {
        console.error('No user found - user is not logged in');
        throw new Error('Please log in to place an order');
      }

      if (!items || items.length === 0) {
        console.error('Cart is empty - no items to order');
        throw new Error('Your cart is empty');
      }

      if (!deliveryDetails.coordinates || !deliveryDetails.address) {
        console.error('Missing delivery details:', deliveryDetails);
        throw new Error('Please select a delivery location on the map');
      }

      if (!deliveryDetails.phoneNumber) {
        console.error('Missing phone number');
        throw new Error('Please enter your phone number');
      }

      if (paymentDetails.method === 'card' && (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv)) {
        console.error('Invalid card payment details:', paymentDetails);
        throw new Error('Please fill in all card details');
      }

      if (paymentDetails.method === 'gcash' && !paymentDetails.accountNumber) {
        console.error('Missing GCash account number');
        throw new Error('Please enter your GCash account number');
      }

      if (paymentDetails.method === 'maya' && !paymentDetails.accountNumber) {
        console.error('Missing Maya account number');
        throw new Error('Please enter your Maya account number');
      }

      const orderId = Date.now().toString();
      console.log('Generated order ID:', orderId);

      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          restaurant: item.restaurant
        })),
        totalPrice,
        deliveryDetails: {
          address: deliveryDetails.address,
          phoneNumber: deliveryDetails.phoneNumber,
          instructions: deliveryDetails.instructions || '',
          coordinates: deliveryDetails.coordinates
        },
        paymentDetails: {
          method: paymentDetails.method,
          accountNumber: paymentDetails.accountNumber || '',
          cardNumber: paymentDetails.cardNumber || '',
          expiryDate: paymentDetails.expiryDate || '',
          cvv: paymentDetails.cvv || ''
        },
        status: 'preparing',
        createdAt: new Date().toISOString(),
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
      };

      console.log('Creating order with data:', orderData);

      const orderRef = ref(database, `orders/${user.uid}/${orderId}`);
      await set(orderRef, orderData);
      console.log('Order successfully created in database');

      // Clear cart after successful order
      clearCart();
      console.log('Cart cleared after successful order');

      setError('');
      setToastMessage('Order placed successfully!');
      setShowToast(true);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        console.log('Redirecting to orders page...');
        router.push('/orders');
      }, 2000);

    } catch (error) {
      console.error('Error placing order:', error);
      setError(error instanceof Error ? error.message : 'Failed to place order');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || items.length === 0) {
    return null;
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
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
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery and Payment Details Form */}
          <div className="space-y-8">
            {/* Delivery Details Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Details</h2>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                  {error}
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Delivery Location
                  </label>
                  <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300">
                    <CheckoutMap
                      onLocationSelect={handleLocationSelect}
                      initialLocation={deliveryDetails.coordinates}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Click on the map to set your delivery location
                  </p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    required
                    readOnly
                    value={deliveryDetails.address}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Click on the map to select your location"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    required
                    value={deliveryDetails.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    name="instructions"
                    id="instructions"
                    rows={3}
                    value={deliveryDetails.instructions}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Any special instructions for delivery?"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('cod')}
                    className={`p-4 border rounded-lg text-center ${
                      paymentDetails.method === 'cod'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('gcash')}
                    className={`p-4 border rounded-lg text-center ${
                      paymentDetails.method === 'gcash'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    <div className="font-medium">GCash</div>
                    <div className="text-sm text-gray-500">Pay with GCash</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('maya')}
                    className={`p-4 border rounded-lg text-center ${
                      paymentDetails.method === 'maya'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    <div className="font-medium">Maya</div>
                    <div className="text-sm text-gray-500">Pay with Maya</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('card')}
                    className={`p-4 border rounded-lg text-center ${
                      paymentDetails.method === 'card'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Pay with card</div>
                  </button>
                </div>

                {/* Payment Details Form */}
                {paymentDetails.method === 'gcash' && (
                  <div className="mt-4">
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                      GCash Account Number
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      id="accountNumber"
                      required
                      value={paymentDetails.accountNumber || ''}
                      onChange={handlePaymentDetailsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter your GCash number"
                    />
                  </div>
                )}

                {paymentDetails.method === 'maya' && (
                  <div className="mt-4">
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                      Maya Account Number
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      id="accountNumber"
                      required
                      value={paymentDetails.accountNumber || ''}
                      onChange={handlePaymentDetailsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter your Maya number"
                    />
                  </div>
                )}

                {paymentDetails.method === 'card' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        id="cardNumber"
                        required
                        value={paymentDetails.cardNumber || ''}
                        onChange={handlePaymentDetailsChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          id="expiryDate"
                          required
                          value={paymentDetails.expiryDate || ''}
                          onChange={handlePaymentDetailsChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                          CVV
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          id="cvv"
                          required
                          value={paymentDetails.cvv || ''}
                          onChange={handlePaymentDetailsChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 