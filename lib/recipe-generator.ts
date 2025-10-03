import { Recipe, MealPlanDay, Ingredient } from '@/types';

/**
 * LLM-based recipe generator that creates ingredient-optimized meal plans.
 * Supports both Ollama (local) and Google Gemini (cloud) backends.
 */

interface LLMRecipeRequest {
  familySize: number;
  diet?: string;
  daysOfWeek?: number;
}

interface LLMProvider {
  generateMealPlan(request: LLMRecipeRequest): Promise<MealPlanDay[]>;
}

/**
 * Ollama provider for local LLM inference
 */
class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateMealPlan(request: LLMRecipeRequest): Promise<MealPlanDay[]> {
    const { familySize, diet = 'none', daysOfWeek = 7 } = request;

    const prompt = this.buildPrompt(familySize, diet, daysOfWeek);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const mealPlanData = JSON.parse(data.response);

      return this.parseMealPlan(mealPlanData);
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error('Failed to generate meal plan with Ollama. Make sure Ollama is running.');
    }
  }

  private buildPrompt(familySize: number, diet: string, days: number): string {
    const dietConstraint = diet !== 'none' ? `dietary restriction: ${diet}` : 'no dietary restrictions';

    return `You are a meal planning assistant. Generate a ${days}-day meal plan for ${familySize} people with ${dietConstraint}.

IMPORTANT: Maximize ingredient overlap across meals to minimize grocery shopping and waste. For example:
- If you use chicken, use it in 3-4 different meals
- If you buy carrots, incorporate them into multiple recipes
- Buy ingredients in bulk (like olive oil, garlic, onions) and use throughout the week

Generate creative, practical recipes that share common ingredients.

For each day, provide breakfast, lunch, and dinner with:
- Recipe title
- Ready time in minutes (realistic)
- Servings (should serve ${familySize} people)
- Full ingredient list with amounts and units
- Brief summary (2-3 sentences)

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "mealPlan": [
    {
      "date": "2024-01-01",
      "breakfast": {
        "id": 1,
        "title": "Recipe Name",
        "image": "https://via.placeholder.com/556x370",
        "readyInMinutes": 30,
        "servings": ${familySize},
        "sourceUrl": "https://example.com",
        "summary": "Brief description of the recipe",
        "extendedIngredients": [
          {
            "id": 1,
            "name": "ingredient name",
            "original": "1 cup ingredient name",
            "amount": 1,
            "unit": "cup",
            "aisle": "Produce"
          }
        ]
      },
      "lunch": { ... },
      "dinner": { ... }
    }
  ]
}`;
  }

  private parseMealPlan(data: any): MealPlanDay[] {
    if (!data.mealPlan || !Array.isArray(data.mealPlan)) {
      throw new Error('Invalid meal plan structure from LLM');
    }

    return data.mealPlan.map((day: any) => {
      const currentDate = new Date();
      const dayIndex = data.mealPlan.indexOf(day);
      const date = new Date(currentDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);

      return {
        date: date.toISOString().split('T')[0],
        breakfast: this.validateRecipe(day.breakfast),
        lunch: this.validateRecipe(day.lunch),
        dinner: this.validateRecipe(day.dinner),
      };
    });
  }

  private validateRecipe(recipe: any): Recipe {
    // Ensure all required fields exist with defaults
    return {
      id: recipe.id || Math.floor(Math.random() * 1000000),
      title: recipe.title || 'Untitled Recipe',
      image: recipe.image || 'https://via.placeholder.com/556x370',
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 4,
      sourceUrl: recipe.sourceUrl || 'https://example.com',
      summary: recipe.summary || 'A delicious recipe',
      extendedIngredients: (recipe.extendedIngredients || []).map((ing: any, idx: number) => ({
        id: ing.id || idx,
        name: ing.name || 'unknown',
        original: ing.original || `${ing.amount} ${ing.unit} ${ing.name}`,
        amount: ing.amount || 1,
        unit: ing.unit || 'unit',
        aisle: ing.aisle || 'Other',
      })),
    };
  }
}

/**
 * Google Gemini provider for cloud-based LLM inference
 * (Future implementation - fallback for production)
 */
class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(request: LLMRecipeRequest): Promise<MealPlanDay[]> {
    // TODO: Implement Gemini API integration
    throw new Error('Gemini provider not yet implemented. Use Ollama for now.');
  }
}

/**
 * Recipe generator service with LLM backend selection
 */
export class RecipeGeneratorService {
  private provider: LLMProvider;

  constructor(providerType: 'ollama' | 'gemini' = 'ollama', config?: any) {
    if (providerType === 'ollama') {
      this.provider = new OllamaProvider(config?.ollamaUrl, config?.model);
    } else if (providerType === 'gemini') {
      if (!config?.geminiApiKey) {
        throw new Error('Gemini API key required');
      }
      this.provider = new GeminiProvider(config.geminiApiKey);
    } else {
      throw new Error(`Unknown provider: ${providerType}`);
    }
  }

  async generateWeeklyMealPlan(
    familySize: number,
    diet?: string
  ): Promise<MealPlanDay[]> {
    const startTime = Date.now();
    console.log('🚀 Starting LLM-based meal plan generation...');

    try {
      const mealPlan = await this.provider.generateMealPlan({
        familySize,
        diet,
        daysOfWeek: 7,
      });

      const totalTime = Date.now() - startTime;
      console.log(`✅ Meal plan generated in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

      return mealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }
}
