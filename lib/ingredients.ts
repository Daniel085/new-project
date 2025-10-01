import { Ingredient, MealPlanDay, AggregatedIngredient } from '@/types';

/**
 * Normalizes ingredient names for better matching by removing preparation descriptors
 *
 * This function standardizes ingredient names to improve matching when aggregating
 * ingredients from multiple recipes. It removes common preparation terms that don't
 * affect the actual ingredient needed.
 *
 * @param name - The original ingredient name (e.g., "fresh minced garlic")
 * @returns Normalized name without preparation descriptors (e.g., "garlic")
 *
 * @example
 * normalizeIngredientName("fresh chopped onion") // returns "onion"
 * normalizeIngredientName("diced tomatoes") // returns "tomatoes"
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(fresh|dried|chopped|minced|sliced|diced)\s+/g, '')
    .replace(/\s+(fresh|dried|chopped|minced|sliced|diced)$/g, '');
}

/**
 * Converts various units to a common base unit abbreviation
 *
 * Standardizes unit names to their abbreviated forms for consistent processing.
 * This is the first step before converting to base measurement units.
 *
 * @param unit - The unit name to normalize (e.g., "tablespoons", "cups", "grams")
 * @returns Standardized unit abbreviation (e.g., "tbsp", "cup", "g")
 *
 * @example
 * normalizeUnit("tablespoons") // returns "tbsp"
 * normalizeUnit("ounces") // returns "oz"
 */
function normalizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'cup': 'cup',
    'cups': 'cup',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lb',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
    'clove': 'clove',
    'cloves': 'clove',
    'slice': 'slice',
    'slices': 'slice',
  };

  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || normalized;
}

/**
 * Converts units to a common measurement system for aggregation
 *
 * This is the core unit conversion logic that enables adding ingredients together.
 * It converts all volume measurements to cups and all weight measurements to grams.
 * Units that can't be converted (like "clove" or "slice") are returned unchanged.
 *
 * Conversion factors:
 * - Volume: All converted to cups (1 cup = 16 tbsp = 48 tsp = 240 ml)
 * - Weight: All converted to grams (1 g = base, 1 oz = 28.35g, 1 lb = 453.59g)
 *
 * @param amount - The numeric quantity of the ingredient
 * @param unit - The unit of measurement (should be pre-normalized)
 * @returns Object with converted amount and base unit ("cup" or "g" typically)
 *
 * @example
 * convertToBaseUnit(2, "tbsp") // returns { amount: 0.125, unit: "cup" }
 * convertToBaseUnit(1, "lb") // returns { amount: 453.59, unit: "g" }
 * convertToBaseUnit(3, "clove") // returns { amount: 3, unit: "clove" }
 */
function convertToBaseUnit(amount: number, unit: string): { amount: number; unit: string } {
  const normalizedUnit = normalizeUnit(unit);

  // Volume conversions to cups (base unit for volume)
  // Formula: multiply by ratio to get cups
  // Example: 2 tbsp → 2 * (1/16) = 0.125 cups
  const volumeConversions: { [key: string]: number } = {
    'tbsp': 1/16,    // 1 tablespoon = 1/16 cup
    'tsp': 1/48,     // 1 teaspoon = 1/48 cup
    'cup': 1,        // 1 cup = 1 cup (base unit)
    'ml': 1/240,     // 1 milliliter = 1/240 cup
    'l': 4.227,      // 1 liter = 4.227 cups
  };

  // Weight conversions to grams (base unit for weight)
  // Formula: multiply by grams per unit
  // Example: 2 oz → 2 * 28.35 = 56.7 grams
  const weightConversions: { [key: string]: number } = {
    'oz': 28.35,     // 1 ounce = 28.35 grams
    'lb': 453.59,    // 1 pound = 453.59 grams
    'g': 1,          // 1 gram = 1 gram (base unit)
    'kg': 1000,      // 1 kilogram = 1000 grams
  };

  // Try to convert volume measurements first
  if (volumeConversions[normalizedUnit]) {
    return {
      amount: amount * volumeConversions[normalizedUnit],
      unit: 'cup',
    };
  }

  // Try to convert weight measurements
  if (weightConversions[normalizedUnit]) {
    return {
      amount: amount * weightConversions[normalizedUnit],
      unit: 'g',
    };
  }

  // Return unchanged if no conversion is available (e.g., "clove", "slice", "pinch")
  // These units can't be meaningfully combined across recipes
  return { amount, unit: normalizedUnit };
}

/**
 * Rounds amounts to reasonable, user-friendly values
 *
 * Converts precise calculated amounts to practical shopping quantities.
 * Different rounding strategies are used based on the unit type.
 *
 * @param amount - The precise calculated amount
 * @param unit - The unit of measurement
 * @returns Rounded amount suitable for shopping lists
 *
 * @example
 * roundAmount(0.85, "cup") // returns 1 (rounds to nearest 1/4 cup)
 * roundAmount(127, "g") // returns 130 (rounds to nearest 10g)
 * roundAmount(2.3, "clove") // returns 3 (rounds up for countable items)
 */
function roundAmount(amount: number, unit: string): number {
  if (unit === 'cup') {
    // Round to nearest 1/4 cup
    return Math.ceil(amount * 4) / 4;
  } else if (unit === 'g') {
    // Round to nearest 10g
    return Math.ceil(amount / 10) * 10;
  } else if (unit === 'lb') {
    // Round to nearest 0.25 lb
    return Math.ceil(amount * 4) / 4;
  } else if (unit === 'clove' || unit === 'slice' || unit === '') {
    // Round up for countable items
    return Math.ceil(amount);
  }

  return Math.ceil(amount * 100) / 100;
}

/**
 * Aggregates ingredients from a weekly meal plan into a unified shopping list
 *
 * This is the main export function that processes a 7-day meal plan and combines
 * all ingredients intelligently. It performs the following operations:
 * 1. Normalizes ingredient names (e.g., "fresh onion" → "onion")
 * 2. Converts all measurements to base units (cups for volume, grams for weight)
 * 3. Combines duplicate ingredients by adding their amounts
 * 4. Rounds amounts to practical shopping values
 * 5. Converts large quantities to more convenient units (e.g., 8 cups → 2 quarts)
 * 6. Sorts by grocery store aisle for efficient shopping
 *
 * @param mealPlan - Array of 7 days, each containing breakfast, lunch, and dinner recipes
 * @returns Array of aggregated ingredients with combined amounts, sorted by aisle
 *
 * @example
 * const mealPlan = [
 *   { date: "2024-01-01", breakfast: {...}, lunch: {...}, dinner: {...} },
 *   // ... 6 more days
 * ];
 * const shoppingList = aggregateIngredients(mealPlan);
 * // Returns: [{ name: "onion", amount: 3, unit: "lb", aisle: "Produce", ... }, ...]
 */
export function aggregateIngredients(mealPlan: MealPlanDay[]): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  // Extract all ingredients from all meals
  mealPlan.forEach(day => {
    [day.breakfast, day.lunch, day.dinner].forEach(recipe => {
      if (!recipe.extendedIngredients) return;

      recipe.extendedIngredients.forEach((ingredient: Ingredient) => {
        // Normalize the ingredient name for deduplication
        // Example: "fresh minced garlic" and "garlic cloves" both become "garlic"
        const normalizedName = normalizeIngredientName(ingredient.name);
        const key = normalizedName;

        if (ingredientMap.has(key)) {
          // This ingredient already exists in our map - we need to combine amounts
          const existing = ingredientMap.get(key)!;

          // Convert both existing and new amounts to their base units for addition
          // This ensures we're adding compatible measurements (e.g., tbsp + tsp → both to cups)
          const existingBase = convertToBaseUnit(existing.amount, existing.unit);
          const newBase = convertToBaseUnit(ingredient.amount, ingredient.unit);

          // Check if both converted to the same base unit (both volume or both weight)
          if (existingBase.unit === newBase.unit) {
            // Safe to add: both are in same unit system
            // Example: 0.5 cup + 0.25 cup = 0.75 cup
            existing.amount = existingBase.amount + newBase.amount;
            existing.unit = existingBase.unit;
          } else {
            // Units don't match (e.g., one is volume, one is weight)
            // This shouldn't happen often, but we'll add them anyway
            // The user will need to manually resolve this edge case
            existing.amount = existingBase.amount + newBase.amount;
          }

          // Keep track of all original ingredient strings for reference
          existing.originalStrings.push(ingredient.original);
        } else {
          // First time seeing this ingredient - add it to the map
          const converted = convertToBaseUnit(ingredient.amount, ingredient.unit);
          ingredientMap.set(key, {
            name: ingredient.name,
            amount: converted.amount,
            unit: converted.unit,
            aisle: ingredient.aisle || 'Other',
            originalStrings: [ingredient.original],
          });
        }
      });
    });
  });

  // Round amounts and convert back to user-friendly units if needed
  const aggregated = Array.from(ingredientMap.values()).map(ing => {
    // Convert cups back to larger units if appropriate
    if (ing.unit === 'cup' && ing.amount >= 4) {
      return {
        ...ing,
        amount: roundAmount(ing.amount / 4, 'qt'),
        unit: 'quarts',
      };
    }

    // Convert grams to pounds if large amount
    if (ing.unit === 'g' && ing.amount >= 453.59) {
      return {
        ...ing,
        amount: roundAmount(ing.amount / 453.59, 'lb'),
        unit: 'lb',
      };
    }

    return {
      ...ing,
      amount: roundAmount(ing.amount, ing.unit),
    };
  });

  // Sort by aisle for easier shopping
  return aggregated.sort((a, b) => a.aisle.localeCompare(b.aisle));
}