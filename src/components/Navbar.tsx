'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Cart from './Cart';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              Delivery App
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && <Cart />}
            {user ? (
              <>
                <Link
                  href="/orders"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Orders
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-indigo-600"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 