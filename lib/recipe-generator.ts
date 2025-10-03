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

    const mealPlan: MealPlanDay[] = [];

    // Generate one day at a time to avoid timeouts
    for (let day = 0; day < daysOfWeek; day++) {
      const dayPlan = await this.generateSingleDay(familySize, diet, day);
      mealPlan.push(dayPlan);
    }

    return mealPlan;
  }

  private async generateSingleDay(familySize: number, diet: string, dayIndex: number): Promise<MealPlanDay> {
    const prompt = this.buildDayPrompt(familySize, diet, dayIndex);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 1 minute timeout per day

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2048,
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract JSON from response
      let responseText = data.response;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const dayData = JSON.parse(jsonMatch[0]);
      return this.parseSingleDay(dayData, dayIndex);
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error('Failed to generate meal plan with Ollama. Make sure Ollama is running.');
    }
  }

  private buildDayPrompt(familySize: number, diet: string, dayIndex: number): string {
    const dietConstraint = diet !== 'none' ? ` Must be ${diet}.` : '';

    return `Create 3 recipes (breakfast, lunch, dinner) for ${familySize} people.${dietConstraint}

Return JSON:
{"breakfast":{"id":1,"title":"Scrambled Eggs","image":"https://via.placeholder.com/556x370","readyInMinutes":15,"servings":${familySize},"sourceUrl":"https://example.com","summary":"Quick protein-rich breakfast","extendedIngredients":[{"id":1,"name":"eggs","original":"${familySize * 2} eggs","amount":${familySize * 2},"unit":"","aisle":"Dairy"}]},"lunch":{"id":2,"title":"Grilled Chicken Salad","image":"https://via.placeholder.com/556x370","readyInMinutes":25,"servings":${familySize},"sourceUrl":"https://example.com","summary":"Healthy lunch","extendedIngredients":[{"id":3,"name":"chicken breast","original":"${familySize} chicken breasts","amount":${familySize},"unit":"","aisle":"Meat"}]},"dinner":{"id":3,"title":"Pasta Primavera","image":"https://via.placeholder.com/556x370","readyInMinutes":30,"servings":${familySize},"sourceUrl":"https://example.com","summary":"Fresh veggie pasta","extendedIngredients":[{"id":5,"name":"pasta","original":"1 lb pasta","amount":1,"unit":"lb","aisle":"Pasta"}]}}`;
  }

  private parseSingleDay(data: any, dayIndex: number): MealPlanDay {
    const currentDate = new Date();
    const date = new Date(currentDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);

    return {
      date: date.toISOString().split('T')[0],
      breakfast: this.validateRecipe(data.breakfast),
      lunch: this.validateRecipe(data.lunch),
      dinner: this.validateRecipe(data.dinner),
    };
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
