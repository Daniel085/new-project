import { z } from 'zod';

/**
 * Validation schema for Ingredient objects from Spoonacular
 */
export const IngredientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, 'Ingredient name is required'),
  original: z.string().min(1, 'Original ingredient string is required'),
  amount: z.number().nonnegative('Amount must be non-negative'),
  unit: z.string(),
  aisle: z.string(),
});

/**
 * Validation schema for Recipe objects
 */
export const RecipeSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, 'Recipe title is required'),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  readyInMinutes: z.number().int().positive('Ready time must be positive'),
  servings: z.number().int().positive('Servings must be positive'),
  sourceUrl: z.string().url('Invalid source URL').optional().or(z.literal('')),
  summary: z.string(),
  extendedIngredients: z.array(IngredientSchema),
});

/**
 * Validation schema for a single day in the meal plan
 */
export const MealPlanDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  breakfast: RecipeSchema,
  lunch: RecipeSchema,
  dinner: RecipeSchema,
});

/**
 * Common dietary restrictions supported by Spoonacular
 */
export const SUPPORTED_DIETS = [
  'gluten free',
  'ketogenic',
  'vegetarian',
  'lacto-vegetarian',
  'ovo-vegetarian',
  'vegan',
  'pescetarian',
  'paleo',
  'primal',
  'low fodmap',
  'whole30',
] as const;

/**
 * Validation schema for POST /api/meal-plan requests
 */
export const MealPlanRequestSchema = z.object({
  familySize: z
    .number()
    .int('Family size must be a whole number')
    .min(1, 'Family size must be at least 1')
    .max(12, 'Family size cannot exceed 12'),
  diet: z
    .enum([...SUPPORTED_DIETS, ''] as [string, ...string[]])
    .optional()
    .or(z.literal(''))
    .transform(val => val || undefined),
});

export type MealPlanRequest = z.infer<typeof MealPlanRequestSchema>;

/**
 * Validation schema for aggregated ingredients in shopping list
 */
export const AggregatedIngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().positive('Amount must be positive'),
  unit: z.string(),
  aisle: z.string(),
  originalStrings: z.array(z.string()).min(1, 'Must have at least one original string'),
});

/**
 * Validation schema for POST /api/shopping-list requests
 */
export const ShoppingListRequestSchema = z.object({
  mealPlanId: z.string().min(1, 'Meal plan ID is required'),
  mealPlan: z
    .array(MealPlanDaySchema)
    .min(1, 'Meal plan must contain at least one day')
    .max(7, 'Meal plan cannot exceed 7 days'),
});

export type ShoppingListRequest = z.infer<typeof ShoppingListRequestSchema>;

/**
 * Validation schema for individual ingredient items for Walmart
 */
export const WalmartIngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(200, 'Ingredient name too long'),
  amount: z.number().positive('Amount must be positive'),
  unit: z.string().max(50, 'Unit name too long'),
});

/**
 * Validation schema for POST /api/walmart/add-to-cart requests
 */
export const WalmartAddToCartSchema = z.object({
  ingredients: z
    .array(WalmartIngredientSchema)
    .min(1, 'Must provide at least one ingredient')
    .max(100, 'Cannot add more than 100 ingredients at once'),
});

export type WalmartAddToCartRequest = z.infer<typeof WalmartAddToCartSchema>;

/**
 * Helper function to validate request body with detailed error messages
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[]; details: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract user-friendly error messages
  const errors = result.error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });

  return {
    success: false,
    errors,
    details: result.error.errors,
  };
}