import { NextRequest, NextResponse } from 'next/server';
import { RecipeGeneratorService } from '@/lib/recipe-generator';
import { prisma } from '@/lib/prisma';
import { MealPlanRequestSchema } from '@/lib/validations';
import { handleApiError, ApiError } from '@/lib/api-error';
import { MealPlanResponse } from '@/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('\n🔵 API /meal-plan - Request received');

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = MealPlanRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });

      console.log(`❌ Validation failed: ${errors.join(', ')}`);
      throw ApiError.validation('Invalid request data', { errors });
    }

    const { familySize, diet } = validation.data;
    console.log(`   Family size: ${familySize}, Diet: ${diet || 'none'}`);

    // Generate meal plan using LLM
    const provider = process.env.RECIPE_PROVIDER || 'ollama';
    const config = {
      ollamaUrl: process.env.OLLAMA_BASE_URL,
      model: process.env.OLLAMA_MODEL,
      geminiApiKey: process.env.GEMINI_API_KEY,
    };

    const recipeGenerator = new RecipeGeneratorService(
      provider as 'ollama' | 'gemini',
      config
    );

    const mealPlanStartTime = Date.now();
    const mealPlan = await recipeGenerator.generateWeeklyMealPlan(familySize, diet);
    console.log(`   Meal plan generation: ${Date.now() - mealPlanStartTime}ms`);

    // Save meal plan to database
    const dbStartTime = Date.now();
    const savedMealPlan = await prisma.mealPlan.create({
      data: {
        recipes: mealPlan,
        familySize,
        diet: diet || null,
        weekOf: new Date(),
      },
    });
    console.log(`   Database save: ${Date.now() - dbStartTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ API /meal-plan - Completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)\n`);

    return NextResponse.json({
      success: true,
      mealPlanId: savedMealPlan.id,
      mealPlan,
      timing: {
        total: totalTime,
        mealPlanGeneration: Date.now() - mealPlanStartTime,
        databaseSave: Date.now() - dbStartTime,
      },
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    console.log(`❌ API /meal-plan - Failed in ${Date.now() - startTime}ms\n`);
    return handleApiError(error);
  }
}