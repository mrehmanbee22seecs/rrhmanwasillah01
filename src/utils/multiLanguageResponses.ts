/**
 * Multi-Language Response System
 * Provides responses in English, Urdu, and Roman Urdu
 * Optimized for speed and accuracy
 */

export type SupportedLanguage = 'en' | 'ur' | 'ur-roman';

/**
 * Detect language from text
 * Optimized for fast detection
 */
export function detectLanguage(text: string): SupportedLanguage {
  const cleanText = text.toLowerCase().trim();
  
  // Fast Urdu script detection (Arabic-based characters)
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ur';
  }
  
  // Roman Urdu detection - common words and patterns
  const romanUrduPatterns = [
    /\b(kya|kia|hai|kaise|kesay|kahan|kidhar|kab|madad|rabta|raabta|shamil|haan|han|nahi|shukriya|shukria|khuda|hafiz)\b/i,
    /\b(volunteer|join|apply)\s+(kar|kare|karna|karna|ho|hoon)\b/i,
    /\b(kaise|kesay|kahan|kidhar|kya|kia)\s+(wasilah|waseela|wasila)\b/i // Only detect wasilah with Roman Urdu context words
  ];
  
  if (romanUrduPatterns.some(pattern => pattern.test(cleanText))) {
    return 'ur-roman';
  }
  
  // Default to English
  return 'en';
}

/**
 * Multi-language response templates
 * Organized by response type for fast lookup
 */
export const responses = {
  greeting: {
    en: "Hello! I'm here to help with Wasilah. What would you like to know?",
    'ur-roman': "Hello! Main Wasilah ke baare mein madad ke liye hazir hoon. Aap kya jaanna chahte hain?",
    ur: "السلام علیکم! میں وسیلہ کی مدد کے لیے حاضر ہوں۔ آپ کس بارے میں جاننا چاہتے ہیں؟"
  },
  
  thanks: {
    en: "You're welcome! Let me know if you need anything else.",
    'ur-roman': "Khush rahein! Agar aur koi madad chahiye to batayein.",
    ur: "خوش رہیں! مزید مدد چاہیے تو بتائیں۔"
  },
  
  goodbye: {
    en: "Goodbye! Have a great day.",
    'ur-roman': "Khuda hafiz! Aap ka din khushgwar rahe.",
    ur: "خدا حافظ! آپ کا دن خوشگوار رہے۔"
  },
  
  notFound: {
    en: "I couldn't find specific information about that. I can help you with:\n\n• Projects & events\n• How to volunteer\n• Contact information\n• About Wasilah\n\nWhat would you like to know?",
    'ur-roman': "Mujhe is topic ke baare mein specific information nahi mili. Main aap ki madad kar sakta hoon:\n\n• Projects aur events\n• Volunteer kaise karein\n• Rabta ki maloomat\n• Wasilah ke baare mein\n\nAap kya jaanna chahte hain?",
    ur: "مجھے اس موضوع کے بارے میں specific معلومات نہیں ملیں۔ میں آپ کی مدد کر سکتا ہوں:\n\n• پروجیکٹس اور ایونٹس\n• رضاکارانہ خدمات کیسے کریں\n• رابطہ معلومات\n• وسیلہ کے بارے میں\n\nآپ کیا جاننا چاہتے ہیں؟"
  },
  
  adminOffer: {
    en: "If that didn't answer your question, would you like to talk to an admin? Reply 'yes' and we'll connect you shortly.",
    'ur-roman': "Agar aap ka sawal hal nahi hua to kya aap admin se baat karna chahenge? 'Haan' likhein, hum foran rabta karwa denge.",
    ur: "اگر آپ کا سوال حل نہیں ہوا تو کیا آپ ایڈمن سے بات کرنا چاہیں گے؟ 'ہاں' لکھیں، ہم فوراً رابطہ کروا دیں گے۔"
  },
  
  adminConfirm: {
    en: "Great! An admin will be with you shortly.",
    'ur-roman': "Theek hai! Ek admin jald aap ke saath hoga.",
    ur: "ٹھیک ہے! ایک ایڈمن جلد آپ کے ساتھ ہوگا۔"
  },
  
  timeout: {
    en: "Sorry, I couldn't process your question in time. Would you like to speak with an admin?",
    'ur-roman': "Maazrat, main aap ke sawal ka jawab nahi de saka. Kya aap admin se baat karna chahenge?",
    ur: "معذرت، میں آپ کے سوال کا جواب نہیں دے سکا۔ کیا آپ ایڈمن سے بات کرنا چاہیں گے؟"
  },
  
  help: {
    en: "I can help with projects, volunteering, events, or contact info. What would you like to know?",
    'ur-roman': "Main projects, volunteer, events, ya rabta ki maloomat mein madad kar sakta hoon. Aap kya jaanna chahte hain?",
    ur: "میں پروجیکٹس، رضاکارانہ خدمات، ایونٹس، یا رابطہ معلومات میں مدد کر سکتا ہوں۔ آپ کیا جاننا چاہتے ہیں؟"
  },
  
  howToVolunteer: {
    en: "To join Wasilah as a volunteer:\n\n1. Visit our Volunteer page\n2. Fill the application form with your details\n3. We'll contact you within 3-5 business days\n4. Ages 16+ welcome (minors need parental consent)\n5. Get a certificate after 20 hours of service\n\nReady to make a difference?",
    'ur-roman': "Wasilah mein volunteer ke taur par shamil hone ke liye:\n\n1. Volunteer page par jayein\n2. Application form bharein apni details ke saath\n3. 3-5 din mein hum rabta karenge\n4. 16+ saal ki umar zaruri (minors ko parental consent chahiye)\n5. 20 ghante service ke baad certificate milega\n\nTayyar hain fark laane ke liye?",
    ur: "وسیلہ میں رضاکار کے طور پر شامل ہونے کے لیے:\n\n1. Volunteer صفحہ پر جائیں\n2. Application form بھریں اپنی تفصیلات کے ساتھ\n3. 3-5 دن میں ہم رابطہ کریں گے\n4. 16+ سال کی عمر ضروری (نابالغوں کو والدین کی اجازت چاہیے)\n5. 20 گھنٹے سروس کے بعد سرٹیفکیٹ ملے گا\n\nتیار ہیں فرق لانے کے لیے؟"
  },
  
  contextualEndings: {
    volunteer: {
      en: "\n\n💡 Ready to join? Visit our Volunteer page to fill out the application form. We'll contact you within 3-5 business days!",
      'ur-roman': "\n\n💡 Tayyar hain shamil hone ke liye? Volunteer page par jayein aur application form bharein. 3-5 din mein hum rabta karenge!",
      ur: "\n\n💡 تیار ہیں شامل ہونے کے لیے؟ Volunteer صفحہ پر جائیں اور application form بھریں۔ 3-5 دن میں ہم رابطہ کریں گے!"
    },
    project: {
      en: "\n\n💡 Want to learn more? Check our Projects page to see all current initiatives and how you can get involved!",
      'ur-roman': "\n\n💡 Mazeed jaanna chahte hain? Projects page check karein tamam initiatives aur involvement ke tareeqe dekhne ke liye!",
      ur: "\n\n💡 مزید جاننا چاہتے ہیں؟ Projects صفحہ چیک کریں تمام منصوبے اور شمولیت کے طریقے دیکھنے کے لیے!"
    },
    event: {
      en: "\n\n💡 Interested? Visit our Events page to see upcoming activities and register for free!",
      'ur-roman': "\n\n💡 Dilchaspi hai? Events page par jayein upcoming activities dekhne aur free registration ke liye!",
      ur: "\n\n💡 دلچسپی ہے؟ Events صفحہ پر جائیں upcoming activities دیکھنے اور مفت رجسٹریشن کے لیے!"
    },
    contact: {
      en: "\n\n💡 Need direct contact? You can also reach us via email at info@wasilah.org or through our Contact page!",
      'ur-roman': "\n\n💡 Seedha rabta chahiye? Aap email par bhi rabta kar sakte hain info@wasilah.org ya Contact page ke zariye!",
      ur: "\n\n💡 سیدھا رابطہ چاہیے؟ آپ ای میل پر بھی رابطہ کر سکتے ہیں info@wasilah.org یا Contact صفحہ کے ذریعے!"
    }
  }
};

/**
 * Get response in detected language
 * Optimized for speed with direct object access
 */
export function getResponse(key: keyof typeof responses, lang: SupportedLanguage): string {
  const responseSet = responses[key];
  if (!responseSet) return responses.notFound[lang];
  return responseSet[lang] || responseSet.en;
}

/**
 * Get contextual ending based on topic and language
 */
export function getContextualEnding(
  topic: 'volunteer' | 'project' | 'event' | 'contact' | null,
  lang: SupportedLanguage
): string {
  if (!topic) return '';
  const ending = responses.contextualEndings[topic];
  return ending ? ending[lang] || ending.en : '';
}

/**
 * Translate answer to user's language if needed
 * For auto-learned content that's in English
 */
export function adaptAnswerToLanguage(
  englishAnswer: string,
  lang: SupportedLanguage
): string {
  // If already in requested language or English, return as-is
  if (lang === 'en') return englishAnswer;
  
  // For Urdu and Roman Urdu, add a language indicator prefix
  if (lang === 'ur' || lang === 'ur-roman') {
    // Check if answer already has Urdu/Roman Urdu content
    const hasUrduScript = /[\u0600-\u06FF]/.test(englishAnswer);
    const hasRomanUrdu = /(kya|kaise|kahan|madad|shamil)/i.test(englishAnswer);
    
    if (hasUrduScript || hasRomanUrdu) {
      return englishAnswer; // Already has multilingual content
    }
    
    // For pure English content, keep it but add a note
    // (Full translation would require an API which we want to avoid for zero cost)
    return englishAnswer;
  }
  
  return englishAnswer;
}

/**
 * Quick language-aware keyword matching
 * Returns true if query matches topic keywords in any language
 */
export function matchesTopicInAnyLanguage(
  query: string,
  topic: 'volunteer' | 'project' | 'event' | 'contact'
): boolean {
  const lowerQuery = query.toLowerCase();
  
  const topicKeywords = {
    volunteer: ['volunteer', 'join', 'apply', 'register', 'shamil', 'volunteer', 'kaise', 'how to'],
    project: ['project', 'program', 'initiative', 'activity', 'projects', 'ivent'],
    event: ['event', 'activity', 'program', 'gathering', 'events', 'ivent'],
    contact: ['contact', 'reach', 'email', 'phone', 'call', 'rabta', 'raabta', 'kahan', 'office']
  };
  
  const keywords = topicKeywords[topic] || [];
  return keywords.some(keyword => lowerQuery.includes(keyword));
}
