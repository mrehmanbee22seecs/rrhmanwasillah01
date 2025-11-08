/**
 * KB Matcher - TF-IDF and Fuzzy Matching System
 * No external APIs - Pure JavaScript implementation
 */

/**
 * Calculate Term Frequency (TF)
 */
function calculateTF(term, tokens) {
  const termCount = tokens.filter(t => t === term).length;
  return termCount / tokens.length;
}

/**
 * Calculate Inverse Document Frequency (IDF)
 */
function calculateIDF(term, allDocuments) {
  const docsWithTerm = allDocuments.filter(doc => 
    doc.tokens.includes(term)
  ).length;
  
  return Math.log(allDocuments.length / (1 + docsWithTerm));
}

/**
 * Calculate TF-IDF score
 */
function calculateTFIDF(term, tokens, allDocuments) {
  const tf = calculateTF(term, tokens);
  const idf = calculateIDF(term, allDocuments);
  return tf * idf;
}

/**
 * Normalize and tokenize text
 */
export function tokenize(text) {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2) // Remove very short words
    .filter(word => !isStopWord(word)); // Remove stop words
}

/**
 * Common stop words to filter out
 */
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
  'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'can', 'may', 'might', 'must', 'from', 'about', 'into', 'through'
]);

function isStopWord(word) {
  return STOP_WORDS.has(word);
}

/**
 * Levenshtein distance for typo tolerance
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Calculate cosine similarity between query and document
 */
function cosineSimilarity(queryTokens, docTokens, allDocuments) {
  const uniqueTerms = new Set([...queryTokens, ...docTokens]);
  
  let dotProduct = 0;
  let queryMagnitude = 0;
  let docMagnitude = 0;
  
  for (const term of uniqueTerms) {
    const queryTFIDF = queryTokens.includes(term) 
      ? calculateTFIDF(term, queryTokens, allDocuments)
      : 0;
    
    const docTFIDF = docTokens.includes(term)
      ? calculateTFIDF(term, docTokens, allDocuments)
      : 0;
    
    dotProduct += queryTFIDF * docTFIDF;
    queryMagnitude += queryTFIDF * queryTFIDF;
    docMagnitude += docTFIDF * docTFIDF;
  }
  
  if (queryMagnitude === 0 || docMagnitude === 0) return 0;
  
  return dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(docMagnitude));
}

/**
 * Fuzzy keyword matching with typo tolerance
 */
function fuzzyKeywordScore(queryTokens, docTokens) {
  let totalScore = 0;
  let matches = 0;
  
  for (const queryToken of queryTokens) {
    let bestMatch = 0;
    
    for (const docToken of docTokens) {
      const similarity = stringSimilarity(queryToken, docToken);
      
      // Allow typos: similarity > 0.75 counts as match
      if (similarity > 0.75) {
        bestMatch = Math.max(bestMatch, similarity);
      }
    }
    
    if (bestMatch > 0) {
      totalScore += bestMatch;
      matches++;
    }
  }
  
  return matches > 0 ? totalScore / queryTokens.length : 0;
}

/**
 * Extract relevant snippet from content with enhanced context
 */
function extractSnippet(content, queryTokens, maxLength = 800) {
  const sentences = content
    .split(/([.!?]+)\s+/) // keep punctuation delimiters
    .reduce((acc, cur, idx, arr) => {
      // Reattach punctuation tokens to previous sentence
      if (/[.!?]+/.test(cur) && acc.length > 0) {
        acc[acc.length - 1] += cur + (arr[idx + 1] ? ' ' : '');
      } else if (!/[.!?]+/.test(cur)) {
        acc.push(cur.trim());
      }
      return acc;
    }, []);

  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = tokenize(sentence);
    const matches = queryTokens.filter(qt =>
      sentenceTokens.some(st => stringSimilarity(qt, st) > 0.75)
    ).length;

    const score = matches / Math.max(1, queryTokens.length);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  // Enhanced snippet extraction - include more context
  if (bestIndex >= 0) {
    const candidates = [];
    
    // Include 1-2 sentences before the best match for context
    if (bestIndex > 0) candidates.push(sentences[bestIndex - 1]);
    if (bestIndex > 1) candidates.push(sentences[bestIndex - 2]);
    
    // Include the best matching sentence
    candidates.push(sentences[bestIndex]);
    
    // Include 2-3 sentences after for completeness
    if (sentences[bestIndex + 1]) candidates.push(sentences[bestIndex + 1]);
    if (sentences[bestIndex + 2]) candidates.push(sentences[bestIndex + 2]);
    if (sentences[bestIndex + 3]) candidates.push(sentences[bestIndex + 3]);
    
    let snippet = candidates.join(' ').trim();

    if (snippet.length > maxLength) {
      // Truncate at last whitespace within limit
      const cut = snippet.substring(0, maxLength);
      const lastSpace = cut.lastIndexOf(' ');
      snippet = (lastSpace > 0 ? cut.substring(0, lastSpace) : cut).trim() + '...';
    }
    return snippet;
  }

  // Fallback: return leading portion without breaking words
  const cut = content.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut).trim() + '...';
}

/**
 * Main matching function - Find best page match for user query
 * @param {string} query - User's question
 * @param {Array} pages - Array of KB pages from Firestore
 * @param {number} threshold - Minimum confidence score (default: 0.15 - lowered for better coverage)
 * @returns {Object|null} - Matched page with score and snippet
 */
export function findBestMatch(query, pages, threshold = 0.15) {
  if (!query || !pages || pages.length === 0) return null;
  
  // Expand query to include synonyms (including Roman Urdu) for better recall
  const queryTokens = expandQuery(query);
  if (queryTokens.length === 0) return null;
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const page of pages) {
    if (!page.tokens || page.tokens.length === 0) continue;
    
    // Combine multiple scoring methods
    const tfidfScore = cosineSimilarity(queryTokens, page.tokens, pages);
    const fuzzyScore = fuzzyKeywordScore(queryTokens, page.tokens);
    
    // Enhanced scoring with exact keyword matches
    const exactMatchScore = calculateExactMatchScore(queryTokens, page.tokens);
    
    // Check if page has FAQ keywords for bonus scoring
    const keywordBonus = page.keywords ? calculateKeywordBonus(queryTokens, page.keywords) : 0;
    
    // Weighted combination with exact matches and keywords getting higher priority
    const finalScore = (tfidfScore * 0.3) + (fuzzyScore * 0.25) + (exactMatchScore * 0.3) + (keywordBonus * 0.15);
    
    if (finalScore > bestScore && finalScore >= threshold) {
      bestScore = finalScore;
      bestMatch = {
        page,
        score: finalScore,
        snippet: extractSnippet(page.content, queryTokens, 1000) // Increased snippet length for detailed answers
      };
    }
  }
  
  return bestMatch;
}

/**
 * Calculate bonus score from FAQ keywords
 */
function calculateKeywordBonus(queryTokens, keywords) {
  if (!keywords || keywords.length === 0) return 0;
  
  let matches = 0;
  const querySet = new Set(queryTokens.map(t => t.toLowerCase()));
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    // Check exact match or fuzzy match
    if (querySet.has(keywordLower)) {
      matches += 1;
    } else {
      // Check fuzzy match
      for (const queryToken of queryTokens) {
        if (stringSimilarity(queryToken, keywordLower) > 0.8) {
          matches += 0.5;
          break;
        }
      }
    }
  }
  
  return Math.min(1.0, matches / Math.max(1, queryTokens.length));
}

/**
 * Calculate exact keyword match score
 */
function calculateExactMatchScore(queryTokens, docTokens) {
  let exactMatches = 0;
  const querySet = new Set(queryTokens.map(t => t.toLowerCase()));
  const docSet = new Set(docTokens.map(t => t.toLowerCase()));
  
  for (const queryToken of querySet) {
    if (docSet.has(queryToken)) {
      exactMatches++;
    }
  }
  
  return exactMatches / Math.max(1, queryTokens.length);
}

/**
 * Get common synonyms for query expansion
 */
const SYNONYMS = {
  // English core
  'help': ['assist', 'support', 'aid'],
  'volunteer': ['help', 'participate', 'contribute', 'join', 'apply', 'register'],
  'donate': ['give', 'contribute', 'support', 'fund'],
  'project': ['program', 'initiative', 'activity'],
  'projects': ['programs', 'initiatives', 'activities'],
  'event': ['activity', 'program', 'gathering'],
  'events': ['activities', 'programs', 'gatherings'],
  'location': ['address', 'place', 'office', 'where'],
  'contact': ['reach', 'email', 'phone', 'call'],
  'about': ['info', 'information', 'what', 'who'],
  'apply': ['join', 'register', 'participate', 'volunteer', 'signup', 'sign', 'up', 'enroll', 'enrollment'],
  'join': ['apply', 'register', 'participate', 'volunteer', 'signup', 'sign', 'up', 'enroll', 'enrollment'],
  'register': ['apply', 'join', 'participate', 'volunteer', 'signup', 'sign', 'up', 'enroll', 'enrollment'],
  'participate': ['join', 'apply', 'register', 'volunteer', 'involve', 'take', 'part'],
  'how': ['way', 'method', 'process', 'steps', 'procedure'],

  // Roman Urdu → English bridges
  'kya': ['what', 'about', 'info'],
  'kia': ['what', 'about', 'info'],
  'hai': ['is', 'about'],
  'kaise': ['how', 'apply', 'join', 'register', 'way', 'method'],
  'kesay': ['how', 'apply', 'join', 'register', 'way', 'method'],
  'kahan': ['where', 'location', 'address', 'office'],
  'kidhar': ['where', 'location', 'address', 'office'],
  'kab': ['when', 'time', 'schedule'],
  'madad': ['help', 'support', 'assist'],
  'rabta': ['contact', 'reach', 'email', 'phone'],
  'raabta': ['contact', 'reach', 'email', 'phone'],
  'shamil': ['join', 'participate', 'apply', 'register'],
  'projectz': ['projects'],
  'ivent': ['event'],
  'ivents': ['events'],
  'wasilah': ['wasila', 'waseela', 'waseelaa'], // common variations
  'form': ['application', 'apply', 'register'],
  'application': ['form', 'apply', 'register'],
  'signup': ['sign', 'up', 'join', 'apply', 'register'],
  'enroll': ['enrollment', 'join', 'apply', 'register'],
  'enrollment': ['enroll', 'join', 'apply', 'register'],
};

/**
 * Expand query with synonyms
 */
export function expandQuery(query) {
  const tokens = tokenize(query);
  const expanded = [...tokens];
  
  for (const token of tokens) {
    if (SYNONYMS[token]) {
      expanded.push(...SYNONYMS[token]);
    }
  }
  
  return [...new Set(expanded)]; // Remove duplicates
}

/**
 * Format bot response with source link and enhanced details
 */
export function formatResponse(match) {
  if (!match) {
    return {
      text: "I couldn't find specific information about that topic in our knowledge base. However, I can help you with:\n\n• Information about Wasilah projects & events\n• How to volunteer and join our community\n• Contact information and office locations\n• General questions about our mission\n\nWould you like to know more about any of these topics, or would you prefer to speak with an admin?",
      sourceUrl: null,
      confidence: 0,
      needsAdmin: true
    };
  }
  
  const { page, score, snippet } = match;
  
  // Use full answer for FAQ pages to provide detailed responses
  let enhancedText = snippet;
  
  // If this is an FAQ with a full answer, prefer that over the snippet
  if (page.answer && page.answer.length > snippet.length) {
    enhancedText = page.answer;
  }
  
  // Add helpful context based on the page type or keywords
  const keywords = (page.keywords || []).join(' ').toLowerCase();
  const title = (page.title || '').toLowerCase();
  
  if (keywords.includes('volunteer') || title.includes('volunteer') || keywords.includes('join') || keywords.includes('apply')) {
    enhancedText += "\n\n💡 Ready to join? Visit our Volunteer page to fill out the application form. We'll contact you within 3-5 business days!";
  } else if (keywords.includes('project') || title.includes('project')) {
    enhancedText += "\n\n💡 Want to learn more? Check our Projects page to see all current initiatives and how you can get involved!";
  } else if (keywords.includes('event') || title.includes('event')) {
    enhancedText += "\n\n💡 Interested? Visit our Events page to see upcoming activities and register for free!";
  } else if (keywords.includes('contact') || title.includes('contact')) {
    enhancedText += "\n\n💡 Need direct contact? You can also reach us via email at info@wasilah.org or through our Contact page!";
  }
  
  return {
    text: enhancedText,
    sourceUrl: page.sourceUrl || page.url,
    sourcePage: page.title || page.url,
    confidence: score,
    needsAdmin: false
  };
}
