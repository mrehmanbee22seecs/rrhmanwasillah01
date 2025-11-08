/**
 * Content Scraper Service - Auto-learn from website
 * Extracts content from all pages automatically
 * Zero cost - runs entirely client-side
 * Makes chatbot smart like ChatGPT without manual feeding
 */

import { tokenize } from '../utils/kbMatcher';

// Configuration constants
const MAX_CONTENT_LENGTH = 10000; // Maximum content length to store
const MAX_TOKENS = 1000; // Maximum tokens to store
const MAX_KEYWORDS = 50; // Maximum keywords to extract
const MIN_CONTENT_LENGTH = 50; // Minimum content length to be valid

interface PageContent {
  id: string;
  url: string;
  title: string;
  content: string;
  tokens: string[];
  headings: string[];
  keywords: string[];
  lastScraped: Date;
  sourceType: 'auto-scraped';
}

/**
 * Extract meaningful text content from HTML element
 * Filters out navigation, footers, scripts, styles
 */
function extractTextContent(element: HTMLElement): string {
  // Clone to avoid modifying the actual page
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove unwanted elements
  const unwantedSelectors = [
    'nav', 'header', 'footer', 'script', 'style', 'iframe',
    '.nav', '.header', '.footer', '.menu', '.sidebar',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
  ];
  
  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Get text content
  let text = clone.textContent || '';
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  return text;
}

/**
 * Extract headings for better context understanding
 */
function extractHeadings(element: HTMLElement): string[] {
  const headings: string[] = [];
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  
  headingTags.forEach(tag => {
    element.querySelectorAll(tag).forEach(heading => {
      const text = heading.textContent?.trim();
      if (text && text.length > 0) {
        headings.push(text);
      }
    });
  });
  
  return headings;
}

/**
 * Extract keywords from meta tags
 */
function extractMetaKeywords(): string[] {
  const keywords: string[] = [];
  
  // Meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const content = metaKeywords.getAttribute('content');
    if (content) {
      keywords.push(...content.split(',').map(k => k.trim()));
    }
  }
  
  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const content = metaDesc.getAttribute('content');
    if (content) {
      keywords.push(...tokenize(content));
    }
  }
  
  // OG tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content');
    if (content) {
      keywords.push(...tokenize(content));
    }
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Generate page ID from URL
 * Shared utility for consistent ID generation
 */
export function generatePageId(url: string): string {
  return url
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase() || 'home';
}

/**
 * Scrape current page content
 */
export function scrapeCurrentPage(): PageContent | null {
  try {
    const url = window.location.pathname;
    const title = document.title;
    
    // Get main content area (try common selectors)
    const contentSelectors = [
      'main',
      '[role="main"]',
      '#main-content',
      '.main-content',
      'article',
      '.content',
      'body'
    ];
    
    let mainElement: HTMLElement | null = null;
    for (const selector of contentSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement) break;
    }
    
    if (!mainElement) {
      console.warn('Could not find main content element');
      return null;
    }
    
    const content = extractTextContent(mainElement);
    const headings = extractHeadings(mainElement);
    const metaKeywords = extractMetaKeywords();
    
    if (content.length < MIN_CONTENT_LENGTH) {
      console.warn('Content too short, skipping page:', url);
      return null;
    }
    
    // Tokenize content
    const tokens = tokenize(content);
    
    // Extract keywords from content + headings
    const headingTokens = headings.flatMap(h => tokenize(h));
    const keywords = [...new Set([...metaKeywords, ...headingTokens])];
    
    return {
      id: generatePageId(url),
      url,
      title,
      content: content.substring(0, MAX_CONTENT_LENGTH),
      tokens: tokens.slice(0, MAX_TOKENS),
      headings,
      keywords: keywords.slice(0, MAX_KEYWORDS),
      lastScraped: new Date(),
      sourceType: 'auto-scraped'
    };
  } catch (error) {
    console.error('Error scraping page:', error);
    return null;
  }
}

/**
 * Discover all pages on the website by analyzing navigation and links
 */
export function discoverSitePages(): string[] {
  const pages = new Set<string>();
  
  // Get all internal links
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Only internal links
    if (href.startsWith('/') && !href.startsWith('//')) {
      // Clean up URL
      const cleanUrl = href.split('?')[0].split('#')[0];
      if (cleanUrl && !cleanUrl.includes('.') && cleanUrl !== '/') {
        pages.add(cleanUrl);
      }
    }
  });
  
  // Add current page
  pages.add(window.location.pathname);
  
  // Add common pages
  const commonPages = [
    '/',
    '/about',
    '/projects',
    '/events',
    '/volunteer',
    '/contact'
  ];
  
  commonPages.forEach(page => pages.add(page));
  
  return Array.from(pages).sort();
}

/**
 * Scrape multiple pages by navigating to them
 * Returns a promise that resolves when scraping is complete
 */
export async function scrapeAllPages(
  onProgress?: (current: number, total: number, url: string) => void
): Promise<PageContent[]> {
  const pages = discoverSitePages();
  const scrapedPages: PageContent[] = [];
  const currentUrl = window.location.pathname;
  
  console.log(`🕷️ Discovered ${pages.length} pages to scrape`);
  
  for (let i = 0; i < pages.length; i++) {
    const url = pages[i];
    
    try {
      if (onProgress) {
        onProgress(i + 1, pages.length, url);
      }
      
      // If not current page, we need to navigate (handled externally)
      // For now, just scrape current page if it matches
      if (url === currentUrl) {
        const content = scrapeCurrentPage();
        if (content) {
          scrapedPages.push(content);
          console.log(`✓ Scraped: ${url}`);
        }
      } else {
        console.log(`⏭️ Skipped (not current page): ${url}`);
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
  }
  
  console.log(`✅ Scraped ${scrapedPages.length}/${pages.length} pages`);
  return scrapedPages;
}

/**
 * Merge scraped content with existing KB
 */
export function mergeWithKB(
  scrapedPages: PageContent[],
  existingKB: any[]
): any[] {
  const merged = [...existingKB];
  
  for (const scraped of scrapedPages) {
    // Check if page already exists in KB
    const existingIndex = merged.findIndex(
      page => page.id === scraped.id || page.url === scraped.url
    );
    
    if (existingIndex >= 0) {
      // Update existing page
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...scraped,
        // Merge keywords
        keywords: [
          ...(merged[existingIndex].keywords || []),
          ...(scraped.keywords || [])
        ]
      };
    } else {
      // Add new page
      merged.push(scraped);
    }
  }
  
  return merged;
}

/**
 * Save scraped content to localStorage for persistence
 */
export function saveScrapedKB(pages: PageContent[]): void {
  try {
    const data = {
      pages,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('wasilah_scraped_kb', JSON.stringify(data));
    console.log(`💾 Saved ${pages.length} scraped pages to localStorage`);
  } catch (error) {
    console.error('Error saving scraped KB:', error);
  }
}

/**
 * Load scraped content from localStorage
 */
export function loadScrapedKB(): PageContent[] {
  try {
    const data = localStorage.getItem('wasilah_scraped_kb');
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    console.log(`📂 Loaded ${parsed.pages?.length || 0} scraped pages from localStorage`);
    return parsed.pages || [];
  } catch (error) {
    console.error('Error loading scraped KB:', error);
    return [];
  }
}

/**
 * Check if KB needs refresh (older than 7 days)
 */
export function needsRefresh(): boolean {
  try {
    const data = localStorage.getItem('wasilah_scraped_kb');
    if (!data) return true;
    
    const parsed = JSON.parse(data);
    const lastUpdated = new Date(parsed.lastUpdated);
    const now = new Date();
    const daysSince = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSince > 7;
  } catch (error) {
    return true;
  }
}
