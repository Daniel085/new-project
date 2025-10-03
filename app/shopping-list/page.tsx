'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AggregatedIngredient } from '@/types';

export default function ShoppingListPage() {
  const router = useRouter();
  const [shoppingList, setShoppingList] = useState<AggregatedIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedList = sessionStorage.getItem('shoppingList');
    if (storedList) {
      setShoppingList(JSON.parse(storedList));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleAddToWalmartCart = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/walmart/add-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients: shoppingList }),
      });

      const data = await response.json();

      if (response.ok) {
        // Open Walmart cart in new tab
        if (data.cartUrl) {
          window.open(data.cartUrl, '_blank');
        }
        alert('Items added to Walmart cart! Check the new tab.');
      } else {
        setError(data.error || 'Failed to add items to cart');
      }
    } catch (err) {
      setError('Failed to add items to Walmart cart. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group items by aisle
  const groupedByAisle = shoppingList.reduce((acc, item) => {
    if (!acc[item.aisle]) {
      acc[item.aisle] = [];
    }
    acc[item.aisle].push(item);
    return acc;
  }, {} as Record<string, AggregatedIngredient[]>);

  if (shoppingList.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent mb-3">Shopping List</h1>
          <p className="text-gray-600 text-lg">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-bold mr-2">
              {shoppingList.length}
            </span>
            items needed for your weekly meal plan
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl flex items-start">
            <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 mb-6 hover:shadow-2xl transition-shadow">
          {Object.entries(groupedByAisle).map(([aisle, items]) => (
            <div key={aisle} className="mb-8 last:mb-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gradient-to-r from-orange-200 to-green-200 flex items-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </span>
                {aisle}
              </h2>
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start group hover:bg-orange-50/50 p-3 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 mr-3 h-5 w-5 text-green-600 rounded-md focus:ring-2 focus:ring-green-500 border-2 border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900">
                        <span className="font-semibold">{item.name}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600 font-medium">
                          {item.amount} {item.unit}
                        </span>
                      </div>
                      {item.originalStrings.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Used in: {item.originalStrings.slice(0, 2).join(', ')}
                          {item.originalStrings.length > 2 && ' ...'}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => router.push('/meal-plan')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Meal Plan
          </button>
          <button
            onClick={handleAddToWalmartCart}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:from-blue-300 disabled:to-blue-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center justify-center group"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Adding to Cart...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add All to Walmart Cart
              </>
            )}
          </button>
        </div>

        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900 mb-1">How it works</p>
              <p className="text-sm text-blue-800">
                The Walmart automation will search for and add these items to your cart.
                You may need to log in to your Walmart account when prompted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}