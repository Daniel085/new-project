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
        <label htmlFor="familySize" className="block text-sm font-medium text-gray-900 mb-2">
          Family Size
        </label>
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
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.familySize ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p id="familySize-hint" className="text-sm text-gray-700 mt-1">
          Enter number of people (1-12)
        </p>
        {errors.familySize && (
          <p id="familySize-error" className="text-sm text-red-600 mt-1" role="alert">
            {errors.familySize}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="diet" className="block text-sm font-medium text-gray-900 mb-2">
          Dietary Restrictions
        </label>
        <select
          id="diet"
          name="diet"
          value={formData.diet}
          onChange={handleChange}
          aria-describedby="diet-hint"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">None</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten Free</option>
          <option value="dairy-free">Dairy Free</option>
        </select>
        <p id="diet-hint" className="text-sm text-gray-700 mt-1">
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