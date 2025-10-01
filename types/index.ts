/**
 * Core type definitions for the Family Meal Planner application.
 * This file contains all shared interfaces and types used across the application.
 */

/**
 * Represents a single ingredient from the Spoonacular API.
 */
export interface Ingredient {
  /** Unique identifier for the ingredient */
  id: number;
  /** Name of the ingredient */
  name: string;
  /** Original ingredient string as provided by the API */
  original: string;
  /** Quantity of the ingredient */
  amount: number;
  /** Unit of measurement (e.g., "cup", "tbsp", "grams") */
  unit: string;
  /** Aisle/category where the ingredient is typically found */
  aisle: string;
}

/**
 * Represents a complete recipe with all its details.
 */
export interface Recipe {
  /** Unique identifier for the recipe */
  id: number;
  /** Recipe title/name */
  title: string;
  /** URL to recipe image */
  image: string;
  /** Time required to prepare the recipe in minutes */
  readyInMinutes: number;
  /** Number of servings the recipe yields */
  servings: number;
  /** URL to the original recipe source */
  sourceUrl: string;
  /** HTML summary/description of the recipe */
  summary: string;
  /** List of all ingredients needed for the recipe */
  extendedIngredients: Ingredient[];
}

/**
 * Represents a single day in the meal plan with three meals.
 */
export interface MealPlanDay {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Breakfast recipe */
  breakfast: Recipe;
  /** Lunch recipe */
  lunch: Recipe;
  /** Dinner recipe */
  dinner: Recipe;
}

/**
 * Represents an ingredient that has been aggregated from multiple recipes.
 * Includes the combined amount and references to original ingredient strings.
 */
export interface AggregatedIngredient {
  /** Name of the ingredient */
  name: string;
  /** Total amount needed (after aggregation) */
  amount: number;
  /** Unit of measurement (normalized) */
  unit: string;
  /** Aisle/category where the ingredient is typically found */
  aisle: string;
  /** Original ingredient strings from all recipes where this ingredient appears */
  originalStrings: string[];
}

/**
 * Spoonacular API request parameters for fetching random recipes.
 */
export interface SpoonacularRandomRecipesParams {
  /** Spoonacular API key */
  apiKey: string;
  /** Number of random recipes to fetch */
  number: number;
  /** Optional comma-separated tags for filtering (e.g., "vegetarian,breakfast") */
  tags?: string;
}

/**
 * Spoonacular API response for random recipes endpoint.
 */
export interface SpoonacularRandomRecipesResponse {
  /** Array of recipe objects */
  recipes: Recipe[];
}

/**
 * Spoonacular API request parameters for fetching recipe information.
 */
export interface SpoonacularRecipeInfoParams {
  /** Spoonacular API key */
  apiKey: string;
  /** Whether to include nutrition information */
  includeNutrition: boolean;
}

/**
 * Request body for generating a weekly meal plan.
 */
export interface MealPlanRequest {
  /** Number of people in the family (1-12) */
  familySize: number;
  /** Optional dietary restriction/preference (e.g., "vegetarian", "vegan", "gluten free") */
  diet?: string;
}

/**
 * Response from the meal plan API endpoint.
 */
export interface MealPlanResponse {
  /** Whether the request was successful */
  success: boolean;
  /** The generated 7-day meal plan */
  mealPlan?: MealPlanDay[];
  /** Error message if the request failed */
  error?: string;
}

/**
 * Request body for generating a shopping list.
 */
export interface ShoppingListRequest {
  /** The meal plan to aggregate ingredients from */
  mealPlan: MealPlanDay[];
}

/**
 * Response from the shopping list API endpoint.
 */
export interface ShoppingListResponse {
  /** Whether the request was successful */
  success: boolean;
  /** The aggregated shopping list */
  shoppingList?: AggregatedIngredient[];
  /** Error message if the request failed */
  error?: string;
}

/**
 * Simplified ingredient format for Walmart cart automation.
 */
export interface WalmartIngredient {
  /** Name of the ingredient */
  name: string;
  /** Quantity needed */
  amount: number;
  /** Unit of measurement */
  unit: string;
}

/**
 * Request body for adding items to Walmart cart.
 */
export interface WalmartAddToCartRequest {
  /** List of ingredients to add to cart */
  ingredients: WalmartIngredient[];
}

/**
 * Response from the Walmart add-to-cart API endpoint.
 */
export interface WalmartAddToCartResponse {
  /** Whether the request was successful */
  success: boolean;
  /** URL to the Walmart cart */
  cartUrl?: string;
  /** Number of items successfully added */
  addedCount?: number;
  /** List of items that failed to be added */
  failedItems?: string[];
  /** Error message if the request failed */
  error?: string;
  /** Additional error details */
  details?: string;
}

/**
 * Result returned by WalmartService.addIngredientsToCart method.
 */
export interface WalmartCartResult {
  /** Whether the operation was successful */
  success: boolean;
  /** URL to the Walmart cart */
  cartUrl: string;
  /** Number of items successfully added */
  addedCount: number;
  /** List of items that failed to be added */
  failedItems: string[];
}

/**
 * Standard API error response format.
 */
export interface ApiErrorResponse {
  /** Error message */
  error: string;
  /** Additional error details (optional) */
  details?: string;
}