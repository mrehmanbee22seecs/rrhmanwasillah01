/**
 * Chat Enhancements - Additional features to improve chatbot intelligence
 * 100% free, client-side, Spark-compatible
 */

/**
 * Response Cache - Cache common responses in localStorage
 * Provides instant responses for frequently asked questions
 */
class ResponseCache {
  private static readonly CACHE_KEY = 'wasilah_chat_cache';
  private static readonly MAX_CACHE_SIZE = 50;
  private static readonly CACHE_EXPIRY_DAYS = 7;

  static set(query: string, response: string, language: string): void {
    try {
      const cache = this.getCache();
      const normalizedQuery = query.toLowerCase().trim();
      
      cache[normalizedQuery] = {
        response,
        language,
        timestamp: Date.now(),
        hitCount: (cache[normalizedQuery]?.hitCount || 0) + 1
      };

      // Limit cache size
      const entries = Object.entries(cache);
      if (entries.length > this.MAX_CACHE_SIZE) {
        // Remove least frequently used
        entries.sort((a, b) => (a[1].hitCount || 0) - (b[1].hitCount || 0));
        const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => delete cache[key]);
      }

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  static get(query: string, language: string): string | null {
    try {
      const cache = this.getCache();
      const normalizedQuery = query.toLowerCase().trim();
      const cached = cache[normalizedQuery];

      if (!cached) return null;

      // Check if cache is expired
      const age = Date.now() - cached.timestamp;
      const maxAge = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        delete cache[normalizedQuery];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      // Check if language matches
      if (cached.language !== language) return null;

      // Increment hit count
      cached.hitCount = (cached.hitCount || 0) + 1;
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));

      return cached.response;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  private static getCache(): Record<string, any> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  static clear(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  static getStats() {
    const cache = this.getCache();
    const entries = Object.values(cache);
    return {
      totalEntries: entries.length,
      totalHits: entries.reduce((sum: number, e: any) => sum + (e.hitCount || 0), 0),
      avgHits: entries.length > 0 ? entries.reduce((sum: number, e: any) => sum + (e.hitCount || 0), 0) / entries.length : 0
    };
  }
}

/**
 * Conversation Context - Remember recent messages for context-aware responses
 */
export class ConversationContext {
  private static readonly MAX_CONTEXT_MESSAGES = 5;
  private static context: Array<{query: string; response: string; timestamp: number}> = [];

  static add(query: string, response: string): void {
    this.context.push({
      query,
      response,
      timestamp: Date.now()
    });

    // Keep only recent messages
    if (this.context.length > this.MAX_CONTEXT_MESSAGES) {
      this.context = this.context.slice(-this.MAX_CONTEXT_MESSAGES);
    }
  }

  static getRecentTopics(): string[] {
    return this.context.map(c => c.query);
  }

  static hasRecentlyAskedAbout(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return this.context.some(c => 
      c.query.toLowerCase().includes(lowerTopic)
    );
  }

  static clear(): void {
    this.context = [];
  }

  static getContext(): string {
    return this.context.map(c => c.query).join(' ');
  }
}

/**
 * Suggested Questions - Smart follow-up suggestions
 */
export const suggestedQuestions = {
  en: {
    general: [
      "What is Wasilah?",
      "How can I volunteer?",
      "Tell me about your projects",
      "Upcoming events?",
      "How to contact you?"
    ],
    afterVolunteer: [
      "What are the requirements?",
      "How often should I volunteer?",
      "Will I get a certificate?",
      "Can I choose my project?"
    ],
    afterProjects: [
      "How can I join a project?",
      "Are there any fees?",
      "What skills do I need?",
      "Project locations?"
    ],
    afterEvents: [
      "How to register?",
      "Are events free?",
      "Event schedule?",
      "Can I bring friends?"
    ],
    afterContact: [
      "Office hours?",
      "Social media links?",
      "Volunteer opportunities?",
      "Donation options?"
    ]
  },
  'ur-roman': {
    general: [
      "Wasilah kya hai?",
      "Volunteer kaise karein?",
      "Projects ke baare mein batayein",
      "Upcoming events?",
      "Rabta kaise karein?"
    ],
    afterVolunteer: [
      "Requirements kya hain?",
      "Kitni baar volunteer karna hoga?",
      "Certificate milega?",
      "Project choose kar sakte hain?"
    ],
    afterProjects: [
      "Project join kaise karein?",
      "Koi fees hai?",
      "Skills chahiye?",
      "Projects kahan hain?"
    ],
    afterEvents: [
      "Register kaise karein?",
      "Events free hain?",
      "Schedule kya hai?",
      "Dost la sakte hain?"
    ],
    afterContact: [
      "Office timing?",
      "Social media links?",
      "Volunteer opportunities?",
      "Donation kaise karein?"
    ]
  }
};

/**
 * Get contextual suggestions based on last query
 */
export function getSmartSuggestions(lastQuery: string, language: 'en' | 'ur-roman' = 'en'): string[] {
  const lowerQuery = lastQuery.toLowerCase();
  const suggestions = suggestedQuestions[language] || suggestedQuestions.en;

  if (lowerQuery.includes('volunteer') || lowerQuery.includes('join') || lowerQuery.includes('shamil')) {
    return suggestions.afterVolunteer;
  } else if (lowerQuery.includes('project') || lowerQuery.includes('program')) {
    return suggestions.afterProjects;
  } else if (lowerQuery.includes('event') || lowerQuery.includes('activity')) {
    return suggestions.afterEvents;
  } else if (lowerQuery.includes('contact') || lowerQuery.includes('rabta') || lowerQuery.includes('office')) {
    return suggestions.afterContact;
  }

  return suggestions.general;
}

/**
 * Typo Correction - Common misspellings
 */
const COMMON_TYPOS: Record<string, string> = {
  'volun teer': 'volunteer',
  'volunteeer': 'volunteer',
  'volnteer': 'volunteer',
  'wasilha': 'wasilah',
  'wasila': 'wasilah',
  'wasillah': 'wasilah',
  'waseela': 'wasilah',
  'projekt': 'project',
  'proyect': 'project',
  'evnt': 'event',
  'eveent': 'event',
  'contat': 'contact',
  'contac': 'contact',
  'donatiom': 'donation',
  'donat': 'donate',
  'applly': 'apply',
  'aply': 'apply',
  'regester': 'register',
  'registr': 'register'
};

export function correctTypos(query: string): string {
  let corrected = query;
  
  for (const [typo, correct] of Object.entries(COMMON_TYPOS)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correct);
  }
  
  return corrected;
}

/**
 * Sentiment Detection - Understand user mood
 */
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'urgent';

export function detectSentiment(query: string): Sentiment {
  const lowerQuery = query.toLowerCase();
  
  // Urgent patterns
  const urgentPatterns = [
    /\b(urgent|emergency|asap|immediately|now|help me|please help)\b/i,
    /[!]{2,}/, // Multiple exclamation marks
    /\b(quickly|fast|hurry)\b/i
  ];
  
  if (urgentPatterns.some(p => p.test(query))) {
    return 'urgent';
  }
  
  // Negative patterns
  const negativePatterns = [
    /\b(not|no|never|can't|cannot|won't|don't|doesn't)\b/i,
    /\b(problem|issue|error|wrong|bad|disappointed|frustrated)\b/i,
    /\b(confused|don't understand|unclear)\b/i
  ];
  
  if (negativePatterns.some(p => p.test(query))) {
    return 'negative';
  }
  
  // Positive patterns
  const positivePatterns = [
    /\b(thanks|thank you|great|awesome|good|excellent|perfect|love|appreciate)\b/i,
    /\b(yes|sure|okay|ok|definitely|absolutely)\b/i,
    /[😊😃😄👍❤️]/
  ];
  
  if (positivePatterns.some(p => p.test(query))) {
    return 'positive';
  }
  
  return 'neutral';
}

/**
 * Enhance response based on sentiment
 */
export function enhanceResponseBySentiment(response: string, sentiment: Sentiment, language: string): string {
  if (sentiment === 'urgent') {
    const urgentPrefix = language === 'ur' || language === 'ur-roman'
      ? "Samajh gaya, jaldi madad karta hoon. "
      : "I understand this is urgent. Let me help you right away. ";
    return urgentPrefix + response;
  }
  
  if (sentiment === 'negative') {
    const sympathyPrefix = language === 'ur' || language === 'ur-roman'
      ? "Main samajh sakta hoon. Chalo aap ki madad karte hain. "
      : "I understand your concern. Let me help clarify this for you. ";
    return sympathyPrefix + response;
  }
  
  return response;
}

/**
 * Quick Reply Buttons - Context-aware quick actions
 */
export interface QuickReply {
  text: string;
  action: string;
}

export function getQuickReplies(lastResponse: string, language: 'en' | 'ur-roman' = 'en'): QuickReply[] {
  const lowerResponse = lastResponse.toLowerCase();
  
  // After volunteer info
  if (lowerResponse.includes('volunteer') || lowerResponse.includes('application form')) {
    return language === 'ur-roman' ? [
      { text: "Requirements?", action: "volunteer requirements" },
      { text: "Apply kaise karein?", action: "how to apply" },
      { text: "Certificate milega?", action: "volunteer certificate" }
    ] : [
      { text: "Requirements?", action: "volunteer requirements" },
      { text: "How to apply?", action: "how to apply" },
      { text: "Get certificate?", action: "volunteer certificate" }
    ];
  }
  
  // After project info
  if (lowerResponse.includes('project') || lowerResponse.includes('program')) {
    return language === 'ur-roman' ? [
      { text: "Projects list", action: "list of projects" },
      { text: "Kaise join karein?", action: "join project" },
      { text: "Locations?", action: "project locations" }
    ] : [
      { text: "View all projects", action: "list of projects" },
      { text: "How to join?", action: "join project" },
      { text: "Locations?", action: "project locations" }
    ];
  }
  
  // After event info
  if (lowerResponse.includes('event') || lowerResponse.includes('activity')) {
    return language === 'ur-roman' ? [
      { text: "Events list", action: "upcoming events" },
      { text: "Register kaise karein?", action: "register for event" },
      { text: "Free hain?", action: "are events free" }
    ] : [
      { text: "View events", action: "upcoming events" },
      { text: "How to register?", action: "register for event" },
      { text: "Are they free?", action: "are events free" }
    ];
  }
  
  // After admin offer
  if (lowerResponse.includes('admin') || lowerResponse.includes('connect')) {
    return language === 'ur-roman' ? [
      { text: "Haan", action: "yes" },
      { text: "Nahi", action: "no" },
      { text: "Mazeed maloomat", action: "more information" }
    ] : [
      { text: "Yes, connect me", action: "yes" },
      { text: "No, thanks", action: "no" },
      { text: "More info first", action: "more information" }
    ];
  }
  
  // Default quick replies
  return language === 'ur-roman' ? [
    { text: "Volunteer?", action: "how to volunteer" },
    { text: "Projects?", action: "tell me about projects" },
    { text: "Contact?", action: "contact information" }
  ] : [
    { text: "Volunteer?", action: "how to volunteer" },
    { text: "Projects?", action: "tell me about projects" },
    { text: "Contact?", action: "contact information" }
  ];
}

export { ResponseCache };
