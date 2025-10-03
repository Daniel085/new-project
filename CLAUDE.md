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

### Directory Structure
```
app/
  ├── page.tsx                    # Home page with family preferences form
  ├── meal-plan/[id]/page.tsx     # Displays 7-day meal plan
  ├── shopping-list/[id]/page.tsx # Shows aggregated ingredients
  └── api/
      ├── meal-plan/route.ts      # Generates weekly meal plan
      ├── meal-plan/[id]/route.ts # Fetches meal plan by ID
      ├── shopping-list/route.ts  # Aggregates ingredients
      └── shopping-list/[id]/route.ts  # Fetches shopping list by ID
lib/
  ├── recipe-generator.ts         # Ollama LLM recipe generation service
  └── prisma.ts                   # Prisma client singleton
prisma/
  └── schema.prisma               # Database schema (User, MealPlan, ShoppingList)
```

### Data Flow
1. User enters family size and dietary restrictions
2. `/api/meal-plan` generates recipes using Ollama (7 days, one at a time)
3. Meal plan stored in SQLite database and displayed at `/meal-plan/[id]`
4. `/api/shopping-list` aggregates ingredients from all recipes
5. Shopping list normalized and saved to database at `/shopping-list/[id]`

### Key Features
- **AI Recipe Generation**: Uses local LLM via Ollama to generate creative meal plans
- **Database Storage**: Persistent storage for meal plans and shopping lists in SQLite
- **Sequential Generation**: Generates one day at a time to avoid timeouts
- **JSON Mode**: Uses Ollama's JSON format option for consistent structured output

## Key Conventions

### API Routes
- All API routes return JSON with `{ success: boolean, ... }` format
- Error responses include `{ error: string }` with appropriate HTTP status codes



### Recipe Generation Performance
- **llama3.2**: ~3 minutes for full 7-day meal plan (recommended)
- **mistral**: ~5-7 minutes for full 7-day meal plan (better quality)
- Each day is generated sequentially with 2-minute timeout per day
- Uses Ollama's JSON mode for structured output
- Low temperature (0.3) for consistent formatting

## Common Issues

### Ollama Not Running
If recipe generation fails with "Failed to generate meal plan with Ollama":
```bash
# Start Ollama service
ollama serve

# In another terminal, verify it's running
curl http://localhost:11434/api/tags
```

### Model Not Installed
If you get timeout errors, make sure you've pulled a model:
```bash
ollama pull llama3.2
# Or for better quality:
ollama pull mistral
```

### Database Not Found
Run migrations first:
```bash
npx prisma migrate dev
npx prisma generate
```