'use client';

import { useRouter } from 'next/navigation';
import { MealPlanForm } from '@/components/MealPlanForm';
import { useSessionStorage } from '@/hooks/useSessionStorage';

export default function Home() {
  const router = useRouter();
  const { setValue: setMealPlan } = useSessionStorage('mealPlan', null);

  const handleSuccess = (mealPlan: any) => {
    setMealPlan(mealPlan);
    router.push('/meal-plan');
  };

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mb-6 shadow-lg transform transition-transform hover:scale-105">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-3">
            Family Meal Planner
          </h1>
          <p className="text-gray-600 text-lg">
            Generate a week of delicious meals and shop effortlessly
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 transform transition-all hover:shadow-2xl">
          <MealPlanForm onSuccess={handleSuccess} />
        </div>
      </div>
    </main>
  );
}