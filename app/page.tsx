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
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Family Meal Planner
        </h1>
        <p className="text-gray-700 mb-8">
          Generate a week of meals and add ingredients to your Walmart cart
        </p>

        <MealPlanForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
}