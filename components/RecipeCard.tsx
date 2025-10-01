interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  className?: string;
}

export function RecipeCard({ recipe, mealType, className = '' }: RecipeCardProps) {
  const headerColors = {
    breakfast: 'bg-yellow-50',
    lunch: 'bg-green-50',
    dinner: 'bg-orange-50',
  };

  const headerLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className={`${headerColors[mealType]} px-4 py-2 border-b border-gray-200`}>
        <h3 className="font-semibold text-gray-900">{headerLabels[mealType]}</h3>
      </div>
      <div className="p-4">
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-40 object-cover rounded-md mb-3"
          />
        )}
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{recipe.title}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.readyInMinutes} minutes
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {recipe.servings} servings
          </div>
        </div>
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm mt-3 inline-flex items-center group"
          >
            View Recipe
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}