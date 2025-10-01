# Family Meal Planner

A Next.js application that generates weekly meal plans and automatically adds ingredients to your Walmart cart.

## Features

- 🍽️ Generate 7-day meal plans with breakfast, lunch, and dinner
- 👨‍👩‍👧‍👦 Customize for family size and dietary restrictions
- 🛒 Automatically add all ingredients to Walmart cart
- 📊 Smart ingredient aggregation (combines duplicates, converts units)
- 🎨 Clean, responsive UI

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/meal_planner"
   SPOONACULAR_API_KEY="your_api_key"
   ```

   Get a free Spoonacular API key: https://spoonacular.com/food-api

3. **Set up database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. Enter your family size and dietary preferences
2. The app fetches recipes from Spoonacular API
3. View your personalized 7-day meal plan
4. Click to see your shopping list with all ingredients aggregated
5. One click adds everything to your Walmart cart via browser automation

## Tech Stack

- **Framework**: Next.js 15 (TypeScript)
- **Database**: PostgreSQL + Prisma
- **Styling**: Tailwind CSS
- **APIs**: Spoonacular (recipes)
- **Automation**: Puppeteer (Walmart cart)

## Limitations

- Spoonacular free tier: 150 API calls/day (≈7 meal plans)
- Walmart automation may break if their website changes
- Requires user to be logged into Walmart

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.