/**
 * Firebase Function to update Knowledge Base from website content
 * Scrapes Firebase Hosting pages and stores in Firestore
 * 100% Spark Plan compatible - no external APIs
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Pages to scrape from your website
 * Add more pages as needed
 */
const PAGES_TO_SCRAPE = [
  { url: '/', title: 'Home' },
  { url: '/about', title: 'About Us' },
  { url: '/projects', title: 'Projects' },
  { url: '/events', title: 'Events' },
  { url: '/volunteer', title: 'Volunteer' },
  { url: '/contact', title: 'Contact' }
];

/**
 * Fetch page content from your own Firebase Hosting
 */
async function fetchPageContent(url) {
  return new Promise((resolve, reject) => {
    // Get your Firebase Hosting URL from environment
    const baseUrl = process.env.FIREBASE_HOSTING_URL || functions.config().hosting?.url;
    
    if (!baseUrl) {
      console.warn('FIREBASE_HOSTING_URL not set, using relative path');
      resolve(''); // Return empty if can't fetch
      return;
    }
    
    const fullUrl = baseUrl + url;
    
    https.get(fullUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      console.error(`Error fetching ${url}:`, err);
      resolve(''); // Return empty on error, don't fail
    });
  });
}

/**
 * Extract text content from HTML
 * Simple parser - no external libraries
 */
function extractTextFromHTML(html) {
  if (!html) return '';
  
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#039;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Tokenize text for storage
 */
function tokenize(text) {
  if (!text) return [];
  
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.has(word));
}

/**
 * HTTP Callable Function - Manual KB Refresh
 * Can be called from admin panel
 */
exports.refreshKnowledgeBase = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }
  
  console.log('Starting KB refresh...');
  
  const results = {
    success: [],
    failed: [],
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
  
  for (const page of PAGES_TO_SCRAPE) {
    try {
      console.log(`Scraping ${page.url}...`);
      
      const html = await fetchPageContent(page.url);
      const content = extractTextFromHTML(html);
      
      if (!content || content.length < 100) {
        console.warn(`No content found for ${page.url}`);
        results.failed.push({
          url: page.url,
          reason: 'No content extracted'
        });
        continue;
      }
      
      const tokens = tokenize(content);
      
      // Store in Firestore
      const pageId = page.url.replace(/\//g, '_') || 'home';
      await db.collection('kb').doc('pages').collection('content').doc(pageId).set({
        url: page.url,
        title: page.title,
        content: content.substring(0, 5000), // Limit content size
        tokens: tokens.slice(0, 500), // Limit tokens
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        source: 'auto-scraper'
      });
      
      results.success.push({
        url: page.url,
        title: page.title,
        contentLength: content.length,
        tokenCount: tokens.length
      });
      
      console.log(`✓ Processed ${page.url}`);
      
    } catch (error) {
      console.error(`Error processing ${page.url}:`, error);
      results.failed.push({
        url: page.url,
        reason: error.message
      });
    }
  }
  
  // Log refresh in system
  await db.collection('system').doc('kb_updates').collection('history').add({
    ...results,
    triggeredBy: context.auth.uid,
    triggeredAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('KB refresh complete:', results);
  return results;
});

/**
 * Scheduled Function - Weekly KB Update
 * Runs every Sunday at 2 AM
 */
exports.scheduledKbUpdate = functions.pubsub
  .schedule('0 2 * * 0') // Every Sunday at 2 AM
  .timeZone('Asia/Karachi')
  .onRun(async (context) => {
    console.log('Starting scheduled KB update...');
    
    for (const page of PAGES_TO_SCRAPE) {
      try {
        const html = await fetchPageContent(page.url);
        const content = extractTextFromHTML(html);
        
        if (!content) continue;
        
        const tokens = tokenize(content);
        const pageId = page.url.replace(/\//g, '_') || 'home';
        
        await db.collection('kb').doc('pages').collection('content').doc(pageId).set({
          url: page.url,
          title: page.title,
          content: content.substring(0, 5000),
          tokens: tokens.slice(0, 500),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          source: 'scheduled'
        });
        
        console.log(`✓ Updated ${page.url}`);
        
      } catch (error) {
        console.error(`Error updating ${page.url}:`, error);
      }
    }
    
    console.log('Scheduled KB update complete');
    return null;
  });

/**
 * HTTP Function - Simple page content updater
 * Alternative if callable functions don't work
 */
exports.updateKbHttp = functions.https.onRequest(async (req, res) => {
  // Simple token-based auth for security
  const authToken = req.get('Authorization');
  const expectedToken = functions.config().kb?.update_token || 'your-secret-token';
  
  if (authToken !== `Bearer ${expectedToken}`) {
    res.status(403).send('Unauthorized');
    return;
  }
  
  try {
    const results = [];
    
    for (const page of PAGES_TO_SCRAPE) {
      const html = await fetchPageContent(page.url);
      const content = extractTextFromHTML(html);
      
      if (!content) continue;
      
      const tokens = tokenize(content);
      const pageId = page.url.replace(/\//g, '_') || 'home';
      
      await db.collection('kb').doc('pages').collection('content').doc(pageId).set({
        url: page.url,
        title: page.title,
        content: content.substring(0, 5000),
        tokens: tokens.slice(0, 500),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        source: 'http-trigger'
      });
      
      results.push({ url: page.url, status: 'updated' });
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('KB update error:', error);
    res.status(500).json({ error: error.message });
  }
});
