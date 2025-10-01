import { NextRequest, NextResponse } from 'next/server';
import { WalmartService } from '@/lib/walmart';
import { WalmartAddToCartSchema } from '@/lib/validations';
import { handleApiError, ApiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('\n🔵 API /walmart/add-to-cart - Request received');

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = WalmartAddToCartSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });

      console.log(`❌ Validation failed: ${errors.join(', ')}`);
      throw ApiError.validation('Invalid request data', { errors });
    }

    const { ingredients } = validation.data;
    console.log(`   Processing ${ingredients.length} ingredients`);

    const walmartService = new WalmartService();

    try {
      const walmartStartTime = Date.now();
      const result = await walmartService.addIngredientsToCart(ingredients);
      const walmartTime = Date.now() - walmartStartTime;

      console.log(`   Walmart automation: ${walmartTime}ms`);
      console.log(`   Items added: ${result.added}, Failed: ${result.failed?.length || 0}`);

      const totalTime = Date.now() - startTime;
      console.log(`✅ API /walmart/add-to-cart - Completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)\n`);

      return NextResponse.json({
        success: true,
        ...result,
        timing: {
          total: totalTime,
          walmart: walmartTime,
        },
      });
    } finally {
      await walmartService.close();
    }
  } catch (error) {
    console.error('Error adding to Walmart cart:', error);
    console.log(`❌ API /walmart/add-to-cart - Failed in ${Date.now() - startTime}ms\n`);
    return handleApiError(error);
  }
}

export const maxDuration = 300; // 5 minutes for Puppeteer operations