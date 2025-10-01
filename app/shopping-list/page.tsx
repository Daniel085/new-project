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
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping List</h1>
          <p className="text-gray-600">
            {shoppingList.length} items needed for your weekly meal plan
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {Object.entries(groupedByAisle).map(([aisle, items]) => (
            <div key={aisle} className="mb-6 last:mb-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                {aisle}
              </h2>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900">
                        <span className="font-medium">{item.name}</span>
                        {' — '}
                        <span className="text-gray-700">
                          {item.amount} {item.unit}
                        </span>
                      </div>
                      {item.originalStrings.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
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

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/meal-plan')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Back to Meal Plan
          </button>
          <button
            onClick={handleAddToWalmartCart}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding to Cart...' : '🛒 Add All to Walmart Cart'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> The Walmart automation will search for and add these items to your cart.
            You may need to log in to your Walmart account when prompted.
          </p>
        </div>
      </div>
    </main>
  );
}