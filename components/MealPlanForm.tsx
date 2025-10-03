'use client';

import { useState } from 'react';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';

interface MealPlanFormProps {
  onSuccess: (mealPlan: any) => void;
}

interface FormData {
  familySize: number;
  diet: string;
}

interface FormErrors {
  familySize?: string;
  diet?: string;
}

export function MealPlanForm({ onSuccess }: MealPlanFormProps) {
  const [formData, setFormData] = useState<FormData>({
    familySize: 4,
    diet: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateField = (name: keyof FormData, value: string | number): string | undefined => {
    if (name === 'familySize') {
      const size = Number(value);
      if (isNaN(size) || size < 1) {
        return 'Family size must be at least 1';
      }
      if (size > 12) {
        return 'Family size cannot exceed 12';
      }
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    const fieldValue = name === 'familySize' ? parseInt(value) || 0 : value;

    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));

    // Clear error for this field
    setErrors(prev => ({ ...prev, [fieldName]: undefined }));

    // Validate on change
    const error = validateField(fieldName, fieldValue);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    // Validate all fields
    const newErrors: FormErrors = {};
    const familySizeError = validateField('familySize', formData.familySize);
    if (familySizeError) {
      newErrors.familySize = familySizeError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meal plan');
      }

      onSuccess(data.mealPlan);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Meal plan preferences">
      {apiError && (
        <ErrorMessage
          message={apiError}
          onDismiss={() => setApiError('')}
        />
      )}

      <div>
        <label htmlFor="familySize" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Family Size
        </label>
        <div className="relative">
          <input
            type="number"
            id="familySize"
            name="familySize"
            min="1"
            max="12"
            value={formData.familySize}
            onChange={handleChange}
            aria-describedby="familySize-hint familySize-error"
            aria-invalid={!!errors.familySize}
            required
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all ${
              errors.familySize ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-orange-300'
            }`}
          />
        </div>
        <p id="familySize-hint" className="text-sm text-gray-600 mt-2 ml-1">
          Enter number of people (1-12)
        </p>
        {errors.familySize && (
          <p id="familySize-error" className="text-sm text-red-600 mt-2 ml-1 flex items-center" role="alert">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.familySize}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="diet" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Dietary Restrictions
        </label>
        <div className="relative">
          <select
            id="diet"
            name="diet"
            value={formData.diet}
            onChange={handleChange}
            aria-describedby="diet-hint"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 hover:border-orange-300 transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="">None</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten Free</option>
            <option value="dairy-free">Dairy Free</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p id="diet-hint" className="text-sm text-gray-600 mt-2 ml-1">
          Optional dietary preferences
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={loading}
        loadingText="Generating..."
        fullWidth
      >
        Generate Meal Plan
      </Button>
    </form>
  );
}