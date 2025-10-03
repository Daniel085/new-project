'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AggregatedIngredient } from '@/types';

export default function ShoppingListPage() {
  const router = useRouter();
  const params = useParams();
  const shoppingListId = params.id as string;

  const [shoppingList, setShoppingList] = useState<AggregatedIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShoppingList = async () => {
      try {
        const response = await fetch(`/api/shopping-list/${shoppingListId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shopping list');
        }

        setShoppingList(data.ingredients);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shopping list');
        console.error('Error fetching shopping list:', err);
      } finally {
        setLoading(false);
      }
    };

    if (shoppingListId) {
      fetchShoppingList();
    }
  }, [shoppingListId]);

  const handleAddToWalmartCart = async () => {
    setAddingToCart(true);
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
        alert('Items added to Walmart cart! Please check your cart.');
      } else {
        setError(data.error || 'Failed to add items to cart');
      }
    } catch (error) {
      console.error('Error adding to Walmart cart:', error);
      setError('Failed to add items to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Loading your shopping list...</p>
        </div>
      </main>
    );
  }

  if (error || shoppingList.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping List Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">{error || 'The shopping list you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-8 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            Go to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">Your Shopping List</h1>
          <p className="text-gray-600 text-lg">All ingredients for your weekly meal plan</p>
        </header>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8">
          <ul className="space-y-3">
            {shoppingList.map((ingredient, index) => (
              <li key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-gray-900 font-medium">{ingredient.name}</span>
                <span className="text-gray-600">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Meal Plan
          </button>
          <button
            onClick={handleAddToWalmartCart}
            disabled={addingToCart}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:from-blue-300 disabled:to-blue-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center justify-center"
          >
            {addingToCart ? (
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
                Add to Walmart Cart
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
