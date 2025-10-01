'use server';

import axios from 'axios';
import { recipeCache } from './cache';
import {
  Recipe,
  MealPlanDay,
  SpoonacularRandomRecipesParams,
  SpoonacularRandomRecipesResponse,
  SpoonacularRecipeInfoParams,
} from '@/types';
import { env } from './env';

const BASE_URL = 'https://api.spoonacular.com';

export class SpoonacularService {
  private apiKey: string;

  constructor(apiKey?: string) {
    // Prevent client-side instantiation
    if (typeof window !== 'undefined') {
      throw new Error('SpoonacularService can only be instantiated on the server');
    }

    // Use provided apiKey or validated environment variable
    this.apiKey = apiKey || env.SPOONACULAR_API_KEY;

    // Validate API key is present
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('SPOONACULAR_API_KEY is required but not provided');
    }
  }

  async getRandomRecipes(number: number, tags?: string[]): Promise<Recipe[]> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheParams = {
        number,
        tags: tags?.sort().join(',') || 'none',
      };

      const cached = recipeCache.get<Recipe[]>('random-recipes', cacheParams);
      if (cached) {
        console.log(`✓ Cached recipes (${Date.now() - startTime}ms)`);
        return cached;
      }

      const params: SpoonacularRandomRecipesParams = {
        apiKey: this.apiKey,
        number,
      };

      if (tags && tags.length > 0) {
        params.tags = tags.join(',');
      }

      const response = await axios.get<SpoonacularRandomRecipesResponse>(
        `${BASE_URL}/recipes/random`,
        { params }
      );
      const recipes = response.data.recipes;

      // Cache the result
      recipeCache.set('random-recipes', cacheParams, recipes);

      console.log(`✓ API fetch recipes (${Date.now() - startTime}ms)`);
      return recipes;
    } catch (error) {
      console.error('Error fetching recipes:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 401) {
            throw new Error('Invalid Spoonacular API key. Please check your API key in the environment variables.');
          } else if (status === 402) {
            throw new Error('Spoonacular API quota exceeded. You have reached your daily request limit. Please upgrade your plan or try again tomorrow.');
          } else if (status === 403) {
            throw new Error('Access forbidden. Your API key may not have permission to access this resource.');
          } else if (status === 404) {
            throw new Error('No recipes found matching your criteria. Try adjusting your dietary restrictions.');
          } else if (status === 429) {
            throw new Error('Too many requests to Spoonacular API. Please wait a moment and try again.');
          } else if (status >= 500) {
            throw new Error('Spoonacular API is currently experiencing issues. Please try again in a few minutes.');
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The Spoonacular API took too long to respond. Please try again.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('Unable to connect to Spoonacular API. Please check your internet connection.');
        }
      }

      throw new Error('Failed to fetch recipes from Spoonacular. Please try again.');
    }
  }

  async getRecipeInformation(id: number): Promise<Recipe> {
    try {
      const params: SpoonacularRecipeInfoParams = {
        apiKey: this.apiKey,
        includeNutrition: false,
      };

      const response = await axios.get<Recipe>(
        `${BASE_URL}/recipes/${id}/information`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recipe information:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 401) {
            throw new Error('Invalid Spoonacular API key. Please check your API key in the environment variables.');
          } else if (status === 402) {
            throw new Error('Spoonacular API quota exceeded. You have reached your daily request limit.');
          } else if (status === 404) {
            throw new Error(`Recipe with ID ${id} not found.`);
          } else if (status >= 500) {
            throw new Error('Spoonacular API is currently experiencing issues. Please try again in a few minutes.');
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('Unable to connect to Spoonacular API. Please check your internet connection.');
        }
      }

      throw new Error('Failed to fetch recipe information. Please try again.');
    }
  }

  async generateWeeklyMealPlan(
    familySize: number,
    diet?: string
  ): Promise<MealPlanDay[]> {
    const startTime = Date.now();
    console.log('🚀 Starting meal plan generation...');

    const tags: string[] = [];
    if (diet && diet !== '') {
      tags.push(diet);
    }

    const daysOfWeek = 7;

    try {
      // OPTIMIZATION: Fetch all recipes in parallel instead of sequentially
      // This reduces API calls from 21 sequential to 3 parallel batches
      console.log('📡 Fetching recipes in parallel batches...');

      const [breakfastBatch, lunchBatch, dinnerBatch] = await Promise.all([
        // Fetch 7 breakfasts at once
        this.getRandomRecipes(daysOfWeek, [...tags, 'breakfast']),
        // Fetch 7 lunches at once
        this.getRandomRecipes(daysOfWeek, tags),
        // Fetch 7 dinners at once
        this.getRandomRecipes(daysOfWeek, tags),
      ]);

      console.log(`✓ All recipes fetched in ${Date.now() - startTime}ms`);

      // Build meal plan from batched results
      const mealPlan: MealPlanDay[] = [];
      for (let day = 0; day < daysOfWeek; day++) {
        mealPlan.push({
          date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          breakfast: breakfastBatch[day],
          lunch: lunchBatch[day],
          dinner: dinnerBatch[day],
        });
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ Meal plan generated in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

      return mealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);

      // Re-throw the error with its original message if it's already formatted
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }
}