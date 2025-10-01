'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
}

interface MealPlanDay {
  date: string;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
}

export default function MealPlanPage() {
  const router = useRouter();
  const params = useParams();
  const mealPlanId = params.id as string;

  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingList, setGeneratingList] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await fetch(`/api/meal-plan/${mealPlanId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load meal plan');
        }

        setMealPlan(data.mealPlan);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meal plan');
        console.error('Error fetching meal plan:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mealPlanId) {
      fetchMealPlan();
    }
  }, [mealPlanId]);

  const handleViewShoppingList = async () => {
    setGeneratingList(true);
    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealPlanId, mealPlan }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/shopping-list/${data.shoppingListId}`);
      } else {
        setError(data.error || 'Failed to generate shopping list');
      }
    } catch (error) {
      console.error('Error generating shopping list:', error);
      setError('Failed to generate shopping list');
    } finally {
      setGeneratingList(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal plan...</p>
        </div>
      </main>
    );
  }

  if (error || mealPlan.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Meal Plan Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The meal plan you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Weekly Meal Plan</h1>
          <p className="text-gray-700">Here are your meals for the week</p>
        </header>

        {/* ARIA live region for loading state */}
        {generatingList && (
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Generating shopping list, please wait...
          </div>
        )}

        <section className="space-y-8" aria-label="Weekly meal schedule">
          {mealPlan.map((day, index) => (
            <article key={index} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Breakfast */}
                <section className="border border-gray-200 rounded-lg overflow-hidden" aria-labelledby={`breakfast-${index}`}>
                  <div className="bg-yellow-50 px-4 py-2 border-b border-gray-200">
                    <h3 id={`breakfast-${index}`} className="font-semibold text-gray-900">Breakfast</h3>
                  </div>
                  <div className="p-4">
                    {day.breakfast.image && (
                      <div className="relative w-full h-40 mb-3">
                        <Image
                          src={day.breakfast.image}
                          alt={`${day.breakfast.title} - breakfast recipe photo showing the prepared dish`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover rounded-md"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900 mb-2">{day.breakfast.title}</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="sr-only">Preparation time:</span><span aria-hidden="true">⏱️</span> {day.breakfast.readyInMinutes} minutes</p>
                      <p><span className="sr-only">Servings:</span><span aria-hidden="true">🍽️</span> {day.breakfast.servings} servings</p>
                    </div>
                    {day.breakfast.sourceUrl && (
                      <a
                        href={day.breakfast.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View full recipe for ${day.breakfast.title} (opens in new tab)`}
                        className="text-blue-600 hover:text-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 text-sm mt-2 inline-block"
                      >
                        View Recipe →
                      </a>
                    )}
                  </div>
                </section>

                {/* Lunch */}
                <section className="border border-gray-200 rounded-lg overflow-hidden" aria-labelledby={`lunch-${index}`}>
                  <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
                    <h3 id={`lunch-${index}`} className="font-semibold text-gray-900">Lunch</h3>
                  </div>
                  <div className="p-4">
                    {day.lunch.image && (
                      <div className="relative w-full h-40 mb-3">
                        <Image
                          src={day.lunch.image}
                          alt={`${day.lunch.title} - lunch recipe photo showing the prepared dish`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover rounded-md"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900 mb-2">{day.lunch.title}</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="sr-only">Preparation time:</span><span aria-hidden="true">⏱️</span> {day.lunch.readyInMinutes} minutes</p>
                      <p><span className="sr-only">Servings:</span><span aria-hidden="true">🍽️</span> {day.lunch.servings} servings</p>
                    </div>
                    {day.lunch.sourceUrl && (
                      <a
                        href={day.lunch.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View full recipe for ${day.lunch.title} (opens in new tab)`}
                        className="text-blue-600 hover:text-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 text-sm mt-2 inline-block"
                      >
                        View Recipe →
                      </a>
                    )}
                  </div>
                </section>

                {/* Dinner */}
                <section className="border border-gray-200 rounded-lg overflow-hidden" aria-labelledby={`dinner-${index}`}>
                  <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                    <h3 id={`dinner-${index}`} className="font-semibold text-gray-900">Dinner</h3>
                  </div>
                  <div className="p-4">
                    {day.dinner.image && (
                      <div className="relative w-full h-40 mb-3">
                        <Image
                          src={day.dinner.image}
                          alt={`${day.dinner.title} - dinner recipe photo showing the prepared dish`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover rounded-md"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900 mb-2">{day.dinner.title}</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="sr-only">Preparation time:</span><span aria-hidden="true">⏱️</span> {day.dinner.readyInMinutes} minutes</p>
                      <p><span className="sr-only">Servings:</span><span aria-hidden="true">🍽️</span> {day.dinner.servings} servings</p>
                    </div>
                    {day.dinner.sourceUrl && (
                      <a
                        href={day.dinner.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View full recipe for ${day.dinner.title} (opens in new tab)`}
                        className="text-blue-600 hover:text-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 text-sm mt-2 inline-block"
                      >
                        View Recipe →
                      </a>
                    )}
                  </div>
                </section>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </button>
          <button
            onClick={handleViewShoppingList}
            disabled={generatingList}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300"
          >
            {generatingList ? 'Generating List...' : 'View Shopping List →'}
          </button>
        </div>
      </div>
    </main>
  );
}