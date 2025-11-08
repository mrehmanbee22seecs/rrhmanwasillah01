export type DetectedLanguage = 'ur' | 'en';

export function detectLanguage(text: string): DetectedLanguage {
  const hasUrdu = /[\u0600-\u06FF]/.test(text);
  return hasUrdu ? 'ur' : 'en';
}

interface Intent {
  id: string;
  patterns: RegExp[];
  reply: (lang: DetectedLanguage) => string;
}

const intents: Intent[] = [
  {
    id: 'greeting',
    patterns: [/^(hi|hello|hey|salam|salaam|as\s*sal(am|aam)\s*alaikum)/i, /السلام|السلام علیکم/i],
    reply: (lang) =>
      lang === 'ur'
        ? 'وعلیکم السلام! میں وسیلہ کی مدد کے لیے حاضر ہوں۔ آپ کس بارے میں جاننا چاہتے ہیں؟'
        : "Hello! I'm here to help with Wasilah. What would you like to know?",
  },
  {
    id: 'what-is-wasilah',
    patterns: [/^(what\s+is\s+)?w(asilah|aseela|asila)(\s+kya\s+hai)?\??$/i, /(وسیلہ)\s+(کیا|ہے)/i, /wasilah\s+kya\s+hai/i],
    reply: (lang) =>
      lang === 'ur'
        ? 'وسیلہ ایک کمیونٹی سروس تنظیم ہے جو تعلیم، صحت، ماحولیات اور کمیونٹی ڈیولپمنٹ کے منصوبوں کے ذریعے مثبت تبدیلی لاتی ہے۔'
        : 'Wasilah is a community-service organization creating impact through projects in education, healthcare, environment, and community development.',
  },
  {
    id: 'thanks',
    patterns: [/^(thanks|thank you|shukriya|shukria)/i, /شکریہ/i],
    reply: (lang) => (lang === 'ur' ? 'خوش رہیں! مزید مدد چاہیے تو بتائیں۔' : 'You’re welcome! Let me know if you need anything else.'),
  },
  {
    id: 'goodbye',
    patterns: [/^(bye|goodbye|khuda hafiz|khudahafiz)/i, /خدا حافظ/i],
    reply: (lang) => (lang === 'ur' ? 'خدا حافظ! آپ کا دن خوشگوار رہے۔' : 'Goodbye! Have a great day.'),
  },
  {
    id: 'help',
    patterns: [/help|madad|assist|support/i, /مدد/i],
    reply: (lang) =>
      lang === 'ur'
        ? 'میں مدد کیلئے حاضر ہوں: پروجیکٹس، رضاکارانہ خدمات، ایونٹس، یا رابطہ معلومات کے بارے میں پوچھیں۔'
        : 'I can help with projects, volunteering, events, or contact info. What would you like to know?',
  },
  // Enhanced apply/join patterns to catch both "how to apply" and "apply"
  {
    id: 'how-to-apply',
    patterns: [
      /how\s+to\s+apply/i,
      /how\s+to\s+join/i,
      /how\s+to\s+register/i,
      /how\s+to\s+volunteer/i,
      /apply\s+for/i,
      /join\s+us/i,
      /register\s+for/i,
      /volunteer\s+for/i,
      /kaise\s+apply\s+kare/i,
      /kaise\s+join\s+kare/i,
      /kaise\s+shamil\s+ho/i,
      /apply/i,
      /join/i,
      /register/i,
      /volunteer/i,
      /shamil/i
    ],
    reply: (lang) =>
      lang === 'ur'
        ? 'وسیلہ میں شامل ہونے کے لیے: 1) Volunteer صفحہ پر جائیں 2) Application form بھریں 3) آپ کی skills اور availability بتائیں 4) 3-5 دن میں ہم رابطہ کریں گے۔ 16+ عمر کے افراد شامل ہو سکتے ہیں۔ 20 گھنٹے service کے بعد certificate ملے گا۔'
        : 'To join Wasilah: 1) Visit the Volunteer page 2) Complete the application form with your details, skills, and availability 3) We will contact you within 3-5 business days for orientation 4) Volunteers aged 16+ are welcome (minors need parental consent) 5) You will receive a certificate after 20 hours of service.',
  },
  // Enhanced project/event application patterns
  {
    id: 'project-event-apply',
    patterns: [
      /apply\s+for\s+(project|event)/i,
      /join\s+(project|event)/i,
      /register\s+for\s+(project|event)/i,
      /project\s+apply/i,
      /event\s+apply/i,
      /project\s+join/i,
      /event\s+join/i,
      /project\s+register/i,
      /event\s+register/i,
      /projec/i,
      /event/i,
      /activity/i,
      /program/i
    ],
    reply: (lang) =>
      lang === 'ur'
        ? 'Projects اور Events کے لیے apply کرنے کے لیے: 1) Projects یا Events صفحہ کھولیں 2) اپنی interest کے مطابق opportunity چنیں 3) Apply یا Register پر کلک کریں 4) Form میں اپنا background اور motivation لکھیں 5) Email confirmation ملے گی اور approved applicants کو logistics کی details ملیں گی۔'
        : 'To apply for projects or events: 1) Open the Projects or Events page 2) Choose an opportunity that matches your interests 3) Click Apply or Register 4) Fill in the form with your background and motivation 5) You will receive confirmation by email and approved applicants will get logistics and next steps.',
  },
];

export function matchIntent(text: string): { handled: boolean; reply?: string } {
  const lang = detectLanguage(text);
  for (const intent of intents) {
    if (intent.patterns.some((re) => re.test(text))) {
      return { handled: true, reply: intent.reply(lang) };
    }
  }
  return { handled: false };
}

export function adminOfferMessage(lang: DetectedLanguage) {
  return lang === 'ur'
    ? "اگر آپ کا سوال حل نہیں ہوا تو کیا آپ ایڈمن سے بات کرنا چاہیں گے؟ 'ہاں' لکھیں، ہم فوراً رابطہ کروا دیں گے۔"
    : "If that didn’t answer your question, would you like to talk to an admin? Reply 'yes' and we’ll connect you shortly.";
}

export function adminConfirmMessage(lang: DetectedLanguage) {
  return lang === 'ur'
    ? 'ٹھیک ہے! ایک ایڈمن جلد آپ کے ساتھ ہوگا۔'
    : 'Great! An admin will be with you shortly.';
}
