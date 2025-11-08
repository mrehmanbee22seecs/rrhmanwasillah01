/**
 * Local Knowledge Base Service
 * Works entirely client-side with no Firestore dependency
 * Perfect for Spark plan - no Cloud Functions needed
 */

import kbSeedData from '../../kb/seed.json';
import { tokenize } from '../utils/kbMatcher';

interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
  sourceUrl?: string;
}

interface KBPage {
  id: string;
  url: string;
  title: string;
  content: string;
  tokens: string[];
  question?: string;
  answer?: string;
  keywords?: string[];
  tags?: string[];
}

/**
 * Convert FAQ format to KB page format for consistent processing
 */
function faqToKbPage(faq: FAQ, index: number): KBPage {
  const content = `${faq.question}\n\n${faq.answer}`;
  const tokens = tokenize(content);
  
  return {
    id: `faq-${index}`,
    url: faq.sourceUrl || '/faq',
    title: faq.question,
    content: faq.answer,
    tokens: tokens,
    question: faq.question,
    answer: faq.answer,
    keywords: faq.keywords,
    tags: faq.tags
  };
}

/**
 * Load KB pages from local seed data
 */
export function loadLocalKB(): KBPage[] {
  try {
    // Convert FAQ format to KB page format
    const pages: KBPage[] = (kbSeedData as FAQ[]).map((faq, index) => 
      faqToKbPage(faq, index)
    );
    
    console.log(`✅ Loaded ${pages.length} KB pages from local seed data`);
    return pages;
  } catch (error) {
    console.error('Error loading local KB:', error);
    return [];
  }
}

/**
 * Enhanced KB pages with additional static content
 * These cover common queries not in the FAQ
 */
export function getEnhancedKB(): KBPage[] {
  const baseKB = loadLocalKB();
  
  // Additional static pages for better coverage
  const additionalPages: KBPage[] = [
    {
      id: 'home',
      url: '/',
      title: 'About Wasilah',
      content: `Wasilah is a community service organization dedicated to creating positive change through education, healthcare, environmental initiatives, and community development projects. We believe in empowering communities and creating sustainable impact through volunteer-driven programs. Our mission is to connect people who want to make a difference with opportunities that create lasting change. We operate across Karachi, Lahore, and Islamabad with dedicated teams of volunteers and community leaders.`,
      tokens: tokenize('Wasilah community service organization education healthcare environmental initiatives development projects empowering communities sustainable impact volunteer programs mission connect people difference opportunities change Karachi Lahore Islamabad teams leaders')
    },
    {
      id: 'apply-process',
      url: '/volunteer',
      title: 'How to Apply and Join Wasilah',
      content: `To apply and join Wasilah as a volunteer, follow these simple steps:

1. Visit our website and navigate to the "Join Us" or "Volunteer" page
2. Fill out the volunteer application form with your details, interests, and availability
3. Submit the form - no payment or fees required
4. Our team will review your application within 3-5 business days
5. We'll contact you via email or phone with available opportunities that match your interests
6. Complete a brief orientation session (online or in-person)
7. Start making a difference in your community!

Requirements: You must be 16 years or older (parental consent needed for minors). No prior experience required - we provide full training and support. We welcome volunteers from all backgrounds and skill levels.`,
      tokens: tokenize('apply join volunteer wasilah steps visit website navigate page fill application form details interests availability submit payment fees review team business days contact email phone opportunities match orientation session online person start difference community requirements years older parental consent minors experience training support backgrounds skill levels')
    },
    {
      id: 'languages',
      url: '/faq',
      title: 'Language Support',
      content: `I can understand and respond to questions in both English and Roman Urdu (Urdu written in English letters). Feel free to ask your questions in either language, and I'll do my best to help you. Main kaise madad kar sakta hoon?`,
      tokens: tokenize('language support understand respond questions english roman urdu written letters ask kaise madad kar sakta hoon')
    }
  ];
  
  return [...baseKB, ...additionalPages];
}

/**
 * Get smart KB that auto-learns from website
 * This function is now a re-export for backward compatibility
 * The actual smart KB is loaded by autoLearnService
 */
export function getSmartKBCompat(): KBPage[] {
  // Try to load auto-learned content from localStorage
  try {
    const scraped = localStorage.getItem('wasilah_scraped_kb');
    if (scraped) {
      const data = JSON.parse(scraped);
      const scrapedPages = data.pages || [];
      
      // Merge with manual KB
      const manualKB = getEnhancedKB();
      const combined = [...manualKB];
      
      // Add scraped pages that aren't duplicates
      for (const page of scrapedPages) {
        const exists = combined.some(p => p.id === page.id || p.url === page.url);
        if (!exists) {
          combined.push(page);
        }
      }
      
      console.log(`🤖 Smart KB: ${manualKB.length} manual + ${scrapedPages.length} auto-learned = ${combined.length} total`);
      return combined;
    }
  } catch (error) {
    console.error('Error loading smart KB:', error);
  }
  
  // Fallback to manual KB
  return getEnhancedKB();
}

/**
 * Get quick stats about the KB
 */
export function getKBStats() {
  const kb = getEnhancedKB();
  const totalTokens = kb.reduce((sum, page) => sum + page.tokens.length, 0);
  
  return {
    totalPages: kb.length,
    totalTokens,
    averageTokensPerPage: Math.round(totalTokens / kb.length)
  };
}
