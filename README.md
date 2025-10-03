# Family Meal Planner

A Next.js application that generates weekly meal plans using local LLMs (via Ollama) and automatically adds ingredients to your Walmart cart.

## Features

- 🍽️ Generate 7-day meal plans with breakfast, lunch, and dinner using AI
- 🤖 Powered by local LLMs via Ollama (no API keys required!)
- 👨‍👩‍👧‍👦 Customize for family size and dietary restrictions
- 🛒 Automatically add all ingredients to Walmart cart
- 📊 Smart ingredient aggregation (combines duplicates, converts units)
- 🎨 Clean, responsive UI
- 💾 SQLite database (no PostgreSQL setup needed)

## Prerequisites

**Install Ollama** (for local AI recipe generation):
```bash
# macOS
brew install ollama

# Start Ollama service
ollama serve

# Pull a model (recommended: llama3.2 for speed)
ollama pull llama3.2
```

Get Ollama at: https://ollama.com

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   The default configuration works out of the box:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   RECIPE_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="llama3.2"
   ```

3. **Set up database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. Enter your family size and dietary preferences
2. The app generates recipes using Ollama's local LLM (takes ~3 minutes for 7 days)
3. View your personalized 7-day meal plan
4. Click to see your shopping list with all ingredients aggregated
5. One click adds everything to your Walmart cart via browser automation

## Tech Stack

- **Framework**: Next.js 15 (TypeScript)
- **Database**: SQLite + Prisma
- **Styling**: Tailwind CSS
- **AI**: Ollama (local LLM - llama3.2 or mistral recommended)
- **Automation**: Puppeteer (Walmart cart)

## Configuration

### Using Different LLM Models

Edit `.env`:
```bash
# Fast but smaller model (recommended)
OLLAMA_MODEL="llama3.2"

# Or use Mistral for better quality (slower)
OLLAMA_MODEL="mistral"
```

### Performance Notes

- **llama3.2**: ~3 minutes for full meal plan (1GB model)
- **mistral**: ~5-7 minutes for full meal plan (4GB model)
- Each day is generated sequentially to avoid timeouts

## Limitations

- Recipe generation takes 2-5 minutes depending on model
- Walmart automation may break if their website changes
- Requires user to be logged into Walmart
- Requires Ollama running locally

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.