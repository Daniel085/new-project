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
      console.log(`📅 Generating day ${dayIndex + 1}/7 with ${this.model}...`);
      const startTime = Date.now();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout per day

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
          options: {
            temperature: 0.3,
            num_predict: 1200,
            num_ctx: 2048,
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✓ Day ${dayIndex + 1} generated in ${Date.now() - startTime}ms`);

      // Extract JSON from response
      let responseText = data.response;
      console.log(`Raw response preview: ${responseText.substring(0, 200)}...`);

      // Clean up common JSON issues from LLMs
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Full response:', responseText);
        throw new Error('No JSON found in LLM response');
      }

      let jsonText = jsonMatch[0];

      // Fix common LLM JSON issues
      jsonText = jsonText
        .trim()
        .split('\n')[0]  // Take only first line if multi-line
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/\.\.\./g, '')  // Remove ellipsis
        .replace(/},\s*{"/g, ',"');  // Fix },{"lunch": to ,"lunch":

      let dayData;
      try {
        dayData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Attempted to parse:', jsonText.substring(0, 500));
        console.error('Full text length:', jsonText.length);
        throw new Error('Invalid JSON from LLM');
      }

      return this.parseSingleDay(dayData, dayIndex);
    } catch (error) {
      console.error(`Ollama generation error (day ${dayIndex + 1}):`, error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout generating day ${dayIndex + 1}. Try using a faster model like llama3.2`);
      }
      throw error;
    }
  }

  private buildDayPrompt(familySize: number, diet: string, dayIndex: number): string {
    const dietNote = diet !== 'none' ? ` (${diet})` : '';

    return `Generate 3 meals for ${familySize} people${dietNote}. Reply with JSON only:
{"breakfast":{"id":1,"title":"Omelette","readyInMinutes":20,"servings":${familySize},"summary":"Eggs with veggies","extendedIngredients":[{"id":1,"name":"eggs","original":"4 eggs","amount":4,"unit":"","aisle":"Dairy"}]},"lunch":{"id":2,"title":"Chicken Wrap","readyInMinutes":15,"servings":${familySize},"summary":"Grilled chicken wrap","extendedIngredients":[{"id":2,"name":"chicken","original":"2 chicken breasts","amount":2,"unit":"","aisle":"Meat"}]},"dinner":{"id":3,"title":"Spaghetti","readyInMinutes":30,"servings":${familySize},"summary":"Pasta with sauce","extendedIngredients":[{"id":3,"name":"pasta","original":"1 lb pasta","amount":1,"unit":"lb","aisle":"Pasta"}]}}`;
  }

  private parseSingleDay(data: any, dayIndex: number): MealPlanDay {
    const currentDate = new Date();
    const date = new Date(currentDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);

    // Handle both formats: {"breakfast": {}, "lunch": {}, "dinner": {}} and {"meals": [...]}
    let breakfast, lunch, dinner;

    if (data.breakfast && data.lunch && data.dinner) {
      breakfast = data.breakfast;
      lunch = data.lunch;
      dinner = data.dinner;
    } else if (data.meals && Array.isArray(data.meals)) {
      breakfast = data.meals[0];
      lunch = data.meals[1];
      dinner = data.meals[2];
    } else {
      throw new Error('Invalid meal plan format from LLM');
    }

    return {
      date: date.toISOString().split('T')[0],
      breakfast: this.validateRecipe(breakfast),
      lunch: this.validateRecipe(lunch),
      dinner: this.validateRecipe(dinner),
    };
  }

  private validateRecipe(recipe: any): Recipe {
    if (!recipe) {
      throw new Error('Recipe is null or undefined');
    }

    // Ensure all required fields exist with defaults
    return {
      id: recipe.id || Math.floor(Math.random() * 1000000),
      title: recipe.title || 'Untitled Recipe',
      image: recipe.image || '',  // Empty string instead of placeholder
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 4,
      sourceUrl: recipe.sourceUrl || '',
      summary: recipe.summary || 'A delicious recipe',
      extendedIngredients: (recipe.extendedIngredients || recipe.ingredients || []).map((ing: any, idx: number) => ({
        id: ing.id || idx,
        name: ing.name || ing.ingredient || 'unknown',
        original: ing.original || `${ing.amount || 1} ${ing.unit || ''} ${ing.name || ing.ingredient || ''}`.trim(),
        amount: ing.amount || 1,
        unit: ing.unit || '',
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
