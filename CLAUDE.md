# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Meal Planner - A Next.js application that generates weekly meal plans using local LLMs via Ollama and automates adding ingredients to a Walmart cart using Puppeteer.

## Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
```

### Build
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Database
```bash
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio    # Open Prisma Studio GUI
```

## Environment Setup

Create a `.env` file with:
```
DATABASE_URL="file:./prisma/dev.db"
RECIPE_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
```

Install Ollama from: https://ollama.com
Then pull a model: `ollama pull llama3.2`

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS
- **AI**: Ollama (local LLM - llama3.2 or mistral)
- **Automation**: Puppeteer (Walmart cart)

### Directory Structure
```
app/
  ├── page.tsx                    # Home page with family preferences form
  ├── meal-plan/page.tsx          # Displays 7-day meal plan
  ├── shopping-list/page.tsx      # Shows aggregated ingredients
  └── api/
      ├── meal-plan/route.ts      # Generates weekly meal plan
      ├── shopping-list/route.ts  # Aggregates ingredients
      └── walmart/add-to-cart/route.ts  # Puppeteer automation
lib/
  ├── recipe-generator.ts         # Ollama LLM recipe generation service
  ├── ingredients.ts              # Ingredient aggregation logic
  ├── walmart.ts                  # Puppeteer automation service
  └── prisma.ts                   # Prisma client singleton
prisma/
  └── schema.prisma               # Database schema (User, MealPlan, ShoppingList)
```

### Data Flow
1. User enters family size and dietary restrictions
2. `/api/meal-plan` generates recipes using Ollama (7 days, one at a time)
3. Meal plan stored in SQLite database and displayed at `/meal-plan/[id]`
4. `/api/shopping-list` aggregates ingredients from all recipes
5. Shopping list normalized (units converted, duplicates merged) and saved to database
6. `/api/walmart/add-to-cart` uses Puppeteer to search and add items

### Key Features
- **Ingredient Aggregation**: Normalizes measurements (cups, tbsp, grams) and combines duplicates
- **Unit Conversion**: Converts various units to common base units for accurate aggregation
- **Walmart Automation**: Headless browser automation to add items to cart
- **Database Storage**: Persistent storage for meal plans and shopping lists in SQLite

## Key Conventions

### API Routes
- All API routes return JSON with `{ success: boolean, ... }` format
- Error responses include `{ error: string }` with appropriate HTTP status codes

### Ingredient Parsing
- Uses `normalizeIngredientName()` to match similar ingredients (e.g., "onion" = "yellow onion")
- Converts to base units (cups for volume, grams for weight) before aggregating
- Rounds amounts to user-friendly values (nearest 1/4 cup, 10g, etc.)

### Walmart Automation
- Runs in non-headless mode so users can log in if needed
- Waits 1 second between adding items to avoid rate limiting
- Returns list of failed items if some products can't be found
- **Important**: Walmart's UI may change, requiring selector updates in `lib/walmart.ts`

### Recipe Generation Performance
- **llama3.2**: ~3 minutes for full 7-day meal plan (recommended)
- **mistral**: ~5-7 minutes for full 7-day meal plan (better quality)
- Each day is generated sequentially with 2-minute timeout per day
- Uses Ollama's JSON mode for structured output
- Low temperature (0.3) for consistent formatting

## Common Issues

### Puppeteer Installation
If Puppeteer fails to install, run:
```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install puppeteer
npx puppeteer browsers install chrome
```

### Walmart Selectors Breaking
Walmart frequently updates their website. If automation fails, inspect their current HTML and update selectors in `lib/walmart.ts`:
- Search input: `input[aria-label="Search"]`
- Add to cart button: `button[data-automation-id="add-to-cart"]`
- Product list: `[data-testid="list-view"]`

### Database Not Found
Run migrations first:
```bash
npx prisma migrate dev --name init
npx prisma generate
```