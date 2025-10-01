import { NextRequest, NextResponse } from 'next/server';
import { aggregateIngredients } from '@/lib/ingredients';
import { prisma } from '@/lib/prisma';
import { ShoppingListRequestSchema } from '@/lib/validations';
import { handleApiError, ApiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('\n🔵 API /shopping-list - Request received');

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = ShoppingListRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });

      console.log(`❌ Validation failed: ${errors.join(', ')}`);
      throw ApiError.validation('Invalid request data', { errors });
    }

    const { mealPlanId, mealPlan } = validation.data;
    console.log(`   Processing ${mealPlan.length} days of meals`);

    const aggregationStartTime = Date.now();
    const shoppingList = aggregateIngredients(mealPlan);
    const aggregationTime = Date.now() - aggregationStartTime;

    console.log(`   Ingredient aggregation: ${aggregationTime}ms`);
    console.log(`   Total ingredients: ${shoppingList.length}`);

    // Save shopping list to database
    const dbStartTime = Date.now();
    const savedShoppingList = await prisma.shoppingList.create({
      data: {
        mealPlanId,
        ingredients: shoppingList,
      },
    });
    console.log(`   Database save: ${Date.now() - dbStartTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ API /shopping-list - Completed in ${totalTime}ms\n`);

    return NextResponse.json({
      success: true,
      shoppingListId: savedShoppingList.id,
      shoppingList,
      timing: {
        total: totalTime,
        aggregation: aggregationTime,
      },
    });
  } catch (error) {
    console.error('Error generating shopping list:', error);
    console.log(`❌ API /shopping-list - Failed in ${Date.now() - startTime}ms\n`);
    return handleApiError(error);
  }
}