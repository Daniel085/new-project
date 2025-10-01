import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const shoppingList = await prisma.shoppingList.findUnique({
      where: { id },
      include: {
        mealPlan: true,
      },
    });

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shoppingList: shoppingList.ingredients,
      mealPlanId: shoppingList.mealPlanId,
      createdAt: shoppingList.createdAt,
    });
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}