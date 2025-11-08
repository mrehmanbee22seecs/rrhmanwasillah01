/**
 * Auto-Learn Service - ChatGPT-like Intelligence
 * Automatically learns from website content without manual feeding
 * Uses hidden iframe to scrape all pages without navigation
 * 100% client-side, zero cost, works on Firebase Spark plan
 */

import { tokenize } from '../utils/kbMatcher';

// Configuration constants
const SCRAPING_DELAY_MS = 100; // Delay between page scrapes
const IFRAME_TIMEOUT_MS = 5000; // Timeout for iframe loading
const AUTO_LEARN_INIT_DELAY_MS = 5000; // Delay before starting auto-learning
const KB_REFRESH_THRESHOLD_DAYS = 7; // Refresh KB if older than this
const MS_PER_DAY = 1000 * 60 * 60 * 24; // Milliseconds in a day
import { 
  scrapeCurrentPage, 
  discoverSitePages, 
  saveScrapedKB, 
  loadScrapedKB,
  mergeWithKB,
  generatePageId
} from './contentScraperService';
import { getEnhancedKB } from './localKbService';

interface AutoLearnPage {
  id: string;
  url: string;
  title: string;
  content: string;
  tokens: string[];
  keywords: string[];
  headings: string[];
  lastUpdated: Date;
  source: 'auto-learned';
}

/**
 * Scrape a page using hidden iframe (no navigation needed)
 */
async function scrapePageViaIframe(url: string): Promise<AutoLearnPage | null> {
  return new Promise((resolve) => {
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);
    
    let timeoutId: number;
    
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
    
    // Timeout after configured delay
    timeoutId = setTimeout(() => {
      cleanup();
      console.warn(`Timeout scraping ${url}`);
      resolve(null);
    }, IFRAME_TIMEOUT_MS);
    
    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          cleanup();
          resolve(null);
          return;
        }
        
        // Extract content
        const title = doc.title;
        const main = doc.querySelector('main') || doc.body;
        
        if (!main) {
          cleanup();
          resolve(null);
          return;
        }
        
        // Extract text (similar to contentScraperService)
        const clone = main.cloneNode(true) as HTMLElement;
        
        // Remove unwanted elements
        const unwantedSelectors = [
          'nav', 'header', 'footer', 'script', 'style', 'iframe',
          '.nav', '.header', '.footer', '.menu', '.sidebar',
          '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
        ];
        
        unwantedSelectors.forEach(selector => {
          clone.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        let content = clone.textContent || '';
        content = content.replace(/\s+/g, ' ').trim();
        
        // Extract headings
        const headings: string[] = [];
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
          main.querySelectorAll(tag).forEach(heading => {
            const text = heading.textContent?.trim();
            if (text) headings.push(text);
          });
        });
        
        if (content.length < 50) {
          cleanup();
          resolve(null);
          return;
        }
        
        // Tokenize
        const tokens = tokenize(content);
        const keywords = headings.flatMap(h => tokenize(h));
        
        const page: AutoLearnPage = {
          id: generatePageId(url),
          url,
          title,
          content: content.substring(0, 10000),
          tokens: tokens.slice(0, 1000),
          keywords: [...new Set(keywords)].slice(0, 50),
          headings,
          lastUpdated: new Date(),
          source: 'auto-learned'
        };
        
        cleanup();
        resolve(page);
      } catch (error) {
        console.error(`Error processing iframe content for ${url}:`, error);
        cleanup();
        resolve(null);
      }
    };
    
    iframe.onerror = () => {
      cleanup();
      resolve(null);
    };
    
    // Load the page
    iframe.src = url;
  });
}

/**
 * Auto-learn from all website pages
 */
export async function autoLearnFromWebsite(
  onProgress?: (current: number, total: number, url: string) => void
): Promise<AutoLearnPage[]> {
  console.log('🧠 Starting auto-learning from website...');
  
  // Discover pages
  const pages = discoverSitePages();
  const learned: AutoLearnPage[] = [];
  
  console.log(`📚 Discovered ${pages.length} pages to learn from`);
  
  // Scrape current page first (no iframe needed)
  const currentPage = scrapeCurrentPage();
  if (currentPage) {
    learned.push({
      id: currentPage.id,
      url: currentPage.url,
      title: currentPage.title,
      content: currentPage.content,
      tokens: currentPage.tokens,
      keywords: currentPage.keywords,
      headings: currentPage.headings,
      lastUpdated: new Date(),
      source: 'auto-learned'
    });
  }
  
  // Scrape other pages via iframe
  for (let i = 0; i < pages.length; i++) {
    const url = pages[i];
    
    // Skip current page (already scraped)
    if (url === window.location.pathname) continue;
    
    if (onProgress) {
      onProgress(i + 1, pages.length, url);
    }
    
    try {
      const page = await scrapePageViaIframe(url);
      if (page) {
        learned.push(page);
        console.log(`✓ Learned: ${url} (${page.tokens.length} tokens)`);
      } else {
        console.log(`⏭️ Skipped: ${url} (no content)`);
      }
      
      // Small delay between requests to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, SCRAPING_DELAY_MS));
    } catch (error) {
      console.error(`Error learning from ${url}:`, error);
    }
  }
  
  console.log(`✅ Auto-learning complete! Learned from ${learned.length}/${pages.length} pages`);
  
  // Save to localStorage (convert to PageContent format)
  const pageContents = learned.map(page => ({
    id: page.id,
    url: page.url,
    title: page.title,
    content: page.content,
    tokens: page.tokens,
    keywords: page.keywords,
    headings: page.headings,
    lastScraped: page.lastUpdated,
    sourceType: 'auto-scraped' as const
  }));
  saveScrapedKB(pageContents);
  
  return learned;
}

/**
 * Get smart KB that combines manual seed + auto-learned content
 */
export function getSmartKB(): any[] {
  console.log('🤖 Loading smart KB...');
  
  // Load manual seed data
  const manualKB = getEnhancedKB();
  console.log(`📖 Loaded ${manualKB.length} manual KB entries`);
  
  // Load auto-learned content
  const autoLearnedKB = loadScrapedKB();
  console.log(`🧠 Loaded ${autoLearnedKB.length} auto-learned entries`);
  
  // Merge both
  const smartKB = mergeWithKB(autoLearnedKB, manualKB);
  console.log(`✨ Smart KB ready with ${smartKB.length} total entries`);
  
  return smartKB;
}

/**
 * Check if auto-learning is needed
 */
export function needsAutoLearning(): boolean {
  const scraped = loadScrapedKB();
  
  // Need learning if no scraped data
  if (scraped.length === 0) return true;
  
  // Need learning if data is old (7+ days)
  try {
    const data = localStorage.getItem('wasilah_scraped_kb');
    if (!data) return true;
    
    const parsed = JSON.parse(data);
    const lastUpdated = new Date(parsed.lastUpdated);
    const now = new Date();
    const daysSince = (now.getTime() - lastUpdated.getTime()) / MS_PER_DAY;
    
    return daysSince > KB_REFRESH_THRESHOLD_DAYS;
  } catch {
    return true;
  }
}

/**
 * Initialize auto-learning on app start (background)
 */
export function initAutoLearning(): void {
  // Check if learning is needed
  if (!needsAutoLearning()) {
    console.log('✅ KB is up to date, skipping auto-learning');
    return;
  }
  
  console.log('🚀 Initializing background auto-learning...');
  
  // Run in background after configured delay
  setTimeout(() => {
    autoLearnFromWebsite((current, total, url) => {
      console.log(`Learning progress: ${current}/${total} - ${url}`);
    }).catch(error => {
      console.error('Auto-learning failed:', error);
    });
  }, AUTO_LEARN_INIT_DELAY_MS);
}

/**
 * Force refresh KB (called from admin panel)
 */
export async function forceRefreshKB(
  onProgress?: (current: number, total: number, url: string) => void
): Promise<number> {
  console.log('🔄 Force refreshing KB...');
  
  const learned = await autoLearnFromWebsite(onProgress);
  
  console.log(`✅ KB refreshed with ${learned.length} pages`);
  return learned.length;
}

/**
 * Get KB statistics
 */
export function getKBStatistics() {
  const manualKB = getEnhancedKB();
  const autoLearnedKB = loadScrapedKB();
  const smartKB = getSmartKB();
  
  const totalTokens = smartKB.reduce((sum, page) => sum + (page.tokens?.length || 0), 0);
  
  return {
    manualEntries: manualKB.length,
    autoLearnedEntries: autoLearnedKB.length,
    totalEntries: smartKB.length,
    totalTokens,
    averageTokensPerPage: Math.round(totalTokens / smartKB.length),
    lastUpdated: autoLearnedKB.length > 0 ? autoLearnedKB[0].lastScraped : null
  };
}
