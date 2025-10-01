import puppeteer, { Browser, Page } from 'puppeteer';
import { WalmartIngredient, WalmartCartResult } from '@/types';

export class WalmartService {
  private browser: Browser | null = null;

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: false, // Show browser so user can log in if needed
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (error) {
      console.error('Failed to initialize browser:', error);

      if (error instanceof Error) {
        if (error.message.includes('Could not find') || error.message.includes('not find Chrome')) {
          throw new Error('Puppeteer browser not found. Please run: npx puppeteer browsers install chrome');
        } else if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Unable to connect to browser. Please check your system configuration.');
        }
      }

      throw new Error('Failed to initialize Walmart automation browser. Please try again.');
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Search for a product on Walmart and add the first result to cart
   * OPTIMIZED: Stays on search page, reduced waits
   */
  async addProductToCart(page: Page, searchQuery: string, isFirstSearch: boolean = false): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Only navigate if this is the first search
      if (isFirstSearch) {
        await page.goto('https://www.walmart.com/grocery', {
          waitUntil: 'domcontentloaded', // Changed from networkidle2 for faster load
        });
      }

      // Wait for and use the search input
      await page.waitForSelector('input[aria-label="Search"]', { timeout: 10000 });

      // Clear previous search and type new query
      await page.click('input[aria-label="Search"]', { clickCount: 3 }); // Select all
      await page.type('input[aria-label="Search"]', searchQuery);

      // Submit search
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // Faster than networkidle2

      // Wait for search results
      await page.waitForSelector('[data-testid="list-view"]', { timeout: 10000 });

      // Find and click first "Add to cart" or "Add" button
      const addButton = await page.$('button[data-automation-id="add-to-cart"]');
      if (addButton) {
        await addButton.click();
        await page.waitForTimeout(500); // Reduced from 1000ms
        console.log(`✓ Added "${searchQuery}" (${Date.now() - startTime}ms)`);
        return true;
      }

      // Alternative: Look for "Add" button
      const addButtons = await page.$$('button[aria-label*="Add"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await page.waitForTimeout(500); // Reduced from 1000ms
        console.log(`✓ Added "${searchQuery}" (${Date.now() - startTime}ms)`);
        return true;
      }

      console.log(`✗ Could not find add button for: ${searchQuery} (${Date.now() - startTime}ms)`);
      return false;
    } catch (error) {
      console.error(`✗ Error adding ${searchQuery} to cart (${Date.now() - startTime}ms):`, error);

      // Provide specific error messages for common Puppeteer issues
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          console.error(`Timeout: Walmart page took too long to load or respond for "${searchQuery}"`);
        } else if (error.message.includes('Navigation') || error.message.includes('navigation')) {
          console.error(`Navigation error: Failed to navigate to search results for "${searchQuery}"`);
        } else if (error.message.includes('Session') || error.message.includes('Target closed')) {
          console.error(`Browser session error: Connection to browser was lost`);
        }
      }

      return false;
    }
  }

  /**
   * Add multiple ingredients to Walmart cart
   */
  async addIngredientsToCart(ingredients: WalmartIngredient[]): Promise<WalmartCartResult> {
    const startTime = Date.now();
    console.log(`\n🛒 Starting Walmart cart automation (${ingredients.length} items)`);

    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    const failedItems: string[] = [];
    let addedCount = 0;

    try {
      // Navigate to Walmart once
      await page.goto('https://www.walmart.com', {
        waitUntil: 'domcontentloaded', // Faster than networkidle2
      });

      // Give user time to log in if needed
      console.log('⏳ Please log in to Walmart if prompted (5 seconds)...');
      await page.waitForTimeout(5000);

      // Add each ingredient (staying on search page)
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        console.log(`\n[${i + 1}/${ingredients.length}] Processing: ${ingredient.name}`);

        const success = await this.addProductToCart(page, ingredient.name, i === 0);
        if (success) {
          addedCount++;
        } else {
          failedItems.push(ingredient.name);
        }

        // Reduced delay between items (500ms instead of 1000ms)
        // Still safe to avoid rate limiting
        if (i < ingredients.length - 1) {
          await page.waitForTimeout(500);
        }
      }

      // Navigate to cart
      console.log('\n📦 Navigating to cart...');
      await page.goto('https://www.walmart.com/cart', {
        waitUntil: 'domcontentloaded',
      });

      const cartUrl = page.url();
      const totalTime = Date.now() - startTime;

      console.log(`\n✅ Walmart automation completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`   Added: ${addedCount}/${ingredients.length} items`);
      if (failedItems.length > 0) {
        console.log(`   Failed: ${failedItems.join(', ')}`);
      }

      return {
        success: true,
        cartUrl,
        addedCount,
        failedItems,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`\n❌ Walmart automation failed after ${(totalTime / 1000).toFixed(2)}s:`, error);

      // Provide detailed error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          throw new Error('Walmart automation timed out. The Walmart website may be slow or unresponsive. Please try again.');
        } else if (error.message.includes('Navigation') || error.message.includes('ERR_')) {
          throw new Error('Failed to navigate to Walmart. Please check your internet connection and try again.');
        } else if (error.message.includes('Session') || error.message.includes('Target closed')) {
          throw new Error('Browser session was interrupted. Please try again.');
        } else if (error.message.includes('selector')) {
          throw new Error('Walmart website layout has changed. The automation may need to be updated. Please contact support.');
        }
      }

      throw new Error('Failed to add items to Walmart cart. Please try again or add items manually.');
    } finally {
      await page.close();
    }
  }
}