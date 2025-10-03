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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading your meal plan...</p>
        </div>
      </main>
    );
  }

  if (error || mealPlan.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Meal Plan Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">{error || 'The meal plan you are looking for does not exist.'}</p>
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
    <main id="main-content" className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-3">Your Weekly Meal Plan</h1>
          <p className="text-gray-600 text-lg">7 days of delicious, curated meals for your family</p>
        </header>

        {/* ARIA live region for loading state */}
        {generatingList && (
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Generating shopping list, please wait...
          </div>
        )}

        <section className="space-y-8" aria-label="Weekly meal schedule">
          {mealPlan.map((day, index) => (
            <article key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl mr-3 text-white text-sm font-bold">
                  {index + 1}
                </span>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Breakfast */}
                <section className="group border-2 border-yellow-200 rounded-xl overflow-hidden hover:border-yellow-300 transition-all hover:shadow-lg bg-gradient-to-b from-yellow-50/50 to-white" aria-labelledby={`breakfast-${index}`}>
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 px-4 py-3 border-b-2 border-yellow-200">
                    <h3 id={`breakfast-${index}`} className="font-bold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Breakfast
                    </h3>
                  </div>
                  <div className="p-5">
                    {day.breakfast.image && (
                      <div className="relative w-full h-44 mb-4 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                        <Image
                          src={day.breakfast.image}
                          alt={`${day.breakfast.title} - breakfast recipe photo showing the prepared dish`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">{day.breakfast.title}</h4>
                    <div className="text-sm text-gray-600 space-y-2 mb-3">
                      <p className="flex items-center">
                        <span className="sr-only">Preparation time:</span>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {day.breakfast.readyInMinutes} min
                      </p>
                      <p className="flex items-center">
                        <span className="sr-only">Servings:</span>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {day.breakfast.servings} servings
                      </p>
                    </div>
                    {day.breakfast.sourceUrl && (
                      <a
                        href={day.breakfast.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View full recipe for ${day.breakfast.title} (opens in new tab)`}
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm group/link"
                      >
                        View Recipe
                        <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>
                </section>

                {/* Lunch */}
                <section className="group border-2 border-green-200 rounded-xl overflow-hidden hover:border-green-300 transition-all hover:shadow-lg bg-gradient-to-b from-green-50/50 to-white" aria-labelledby={`lunch-${index}`}>
                  <div className="bg-gradient-to-r from-green-100 to-green-50 px-4 py-3 border-b-2 border-green-200">
                    <h3 id={`lunch-${index}`} className="font-bold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Lunch
                    </h3>
                  </div>
                  <div className="p-5">
                    {day.lunch.image && (
                      <div className="relative w-full h-44 mb-4 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                        <Image
                          src={day.lunch.image}
                          alt={`${day.lunch.title} - lunch recipe photo showing the prepared dish`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">{day.lunch.title}</h4>
                    <div className="text-sm text-gray-600 space-y-2 mb-3">
                      <p className="flex items-center">
                        <span className="sr-only">Preparation time:</span>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {day.lunch.readyInMinutes} min
                      </p>
                      <p className="flex items-center">
                        <span className="sr-only">Servings:</span>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {day.lunch.servings} servings
                      </p>
                    </div>
                    {day.lunch.sourceUrl && (
                      <a
                        href={day.lunch.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View full recipe for ${day.lunch.title} (opens in new tab)`}
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm group/link"
                      >
                        View Recipe
                        <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>
                </section>

                {/* Dinner */}
                <section className="group border-2 border-orange-200 rounded-xl overflow-hidden hover:border-orange-300 transition-all hover:shadow-lg bg-gradient-to-b from-orange-50/50 to-white" aria-labelledby={`dinner-${index}`}>
                  <div className="bg-gradient-to-r from-orange-100 to-orange-50 px-4 py-3 border-b-2 border-orange-200">
                    <h3 id={`dinner-${index}`} className="font-bold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Dinner
                    </h3>
                  </div>
                  <div className="p-5">
                    {day.dinner.image && (
                      <div className="relative w-full h-44 mb-4 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                        <Image
                          src={day.dinner.image}
                          alt={`${day.dinner.title} - dinner recipe photo showing the prepared dish`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">{day.dinner.title}</h4>
                    <div className="text-sm text-gray-600 space-y-2 mb-3">
                      <p className="flex items-center">
                        <span className="sr-only">Preparation time:</span>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {day.dinner.readyInMinutes} min
                      </p>
                      <p className="flex items-center">
                        <span className="sr-only">Servings:</span>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {day.dinner.servings} servings
                      </p>
                    </div>
                    {day.dinner.sourceUrl && (
                      <a
                        href={day.dinner.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View full recipe for ${day.dinner.title} (opens in new tab)`}
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm group/link"
                      >
                        View Recipe
                        <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>
                </section>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <button
            onClick={handleViewShoppingList}
            disabled={generatingList}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold disabled:from-green-300 disabled:to-green-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center justify-center group"
          >
            {generatingList ? (
              <>
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generating List...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                View Shopping List
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}