/**
 * Initial KB Seed Script
 * Seeds knowledge base with static content from your site
 * Run once after setup: node scripts/seedInitialKb.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Static content to seed - extracted from your pages
 * In production, the updateKb function will auto-refresh this
 */
const INITIAL_KB_PAGES = [
  {
    id: 'home',
    url: '/',
    title: 'Home - Wasilah',
    content: `Wasilah is a community service organization dedicated to creating positive change through education, healthcare, environmental initiatives, and community development projects. We believe in empowering communities and creating sustainable impact through volunteer-driven programs. Our mission is to connect people who want to make a difference with opportunities that create lasting change.`,
    tokens: ['wasilah', 'community', 'service', 'organization', 'education', 'healthcare', 'environmental', 'initiatives', 'development', 'projects', 'empowering', 'communities', 'sustainable', 'impact', 'volunteer', 'programs', 'mission', 'connect', 'people', 'difference', 'opportunities', 'change']
  },
  {
    id: 'about',
    url: '/about',
    title: 'About Us - Wasilah',
    content: `Wasilah was founded with a vision to bridge communities and create meaningful impact through collaborative service. We work across multiple sectors including education, healthcare, environmental conservation, and community development. Our team comprises dedicated volunteers, community leaders, and professionals who share a common goal: creating sustainable positive change in communities across Pakistan. We operate with transparency, accountability, and a deep commitment to serving those in need.`,
    tokens: ['wasilah', 'founded', 'vision', 'bridge', 'communities', 'meaningful', 'impact', 'collaborative', 'service', 'sectors', 'education', 'healthcare', 'environmental', 'conservation', 'community', 'development', 'team', 'volunteers', 'leaders', 'professionals', 'goal', 'sustainable', 'change', 'pakistan', 'transparency', 'accountability', 'commitment', 'serving']
  },
  {
    id: 'projects',
    url: '/projects',
    title: 'Projects - Wasilah',
    content: `Our projects span multiple areas of community impact. Education Programs: We provide tutoring, scholarship support, and educational resources to underprivileged students. Healthcare Initiatives: Free medical camps, health awareness campaigns, and preventive care programs. Environmental Conservation: Tree planting drives, beach cleanups, and sustainability workshops. Community Development: Infrastructure projects, skills training, and livelihood support programs. Each project is designed with community input and measured for sustainable impact.`,
    tokens: ['projects', 'community', 'impact', 'education', 'programs', 'tutoring', 'scholarship', 'support', 'resources', 'students', 'healthcare', 'initiatives', 'medical', 'camps', 'health', 'awareness', 'campaigns', 'preventive', 'care', 'environmental', 'conservation', 'tree', 'planting', 'beach', 'cleanups', 'sustainability', 'workshops', 'development', 'infrastructure', 'skills', 'training', 'livelihood', 'designed', 'measured', 'sustainable']
  },
  {
    id: 'volunteer',
    url: '/volunteer',
    title: 'Volunteer - Wasilah',
    content: `Join us as a volunteer and make a real difference in your community. We welcome volunteers aged 16 and above (parental consent required for minors). No prior experience necessary - we provide orientation and training. Volunteer opportunities include: event coordination, tutoring, healthcare support, environmental activities, administrative help, and social media management. You can volunteer once a month or multiple times per week based on your availability. After 20 hours of service, you'll receive a volunteer certificate. Apply through our volunteer form and we'll contact you within 3-5 business days.`,
    tokens: ['volunteer', 'join', 'difference', 'community', 'welcome', 'aged', 'experience', 'orientation', 'training', 'opportunities', 'event', 'coordination', 'tutoring', 'healthcare', 'support', 'environmental', 'activities', 'administrative', 'social', 'media', 'management', 'availability', 'hours', 'service', 'certificate', 'apply', 'form', 'contact', 'business', 'days']
  },
  {
    id: 'events',
    url: '/events',
    title: 'Events - Wasilah',
    content: `We organize regular community events to engage volunteers and create impact. Upcoming events include health fairs with free medical checkups, educational workshops for skills development, tree planting drives for environmental conservation, and community gatherings for cultural exchange. Most events are free to attend and open to the public. Check our events calendar for schedules and registration details. We typically host 2-3 events per month across Karachi, Lahore, and Islamabad. Follow us on social media for event updates and photos.`,
    tokens: ['events', 'organize', 'community', 'engage', 'volunteers', 'impact', 'health', 'fairs', 'medical', 'checkups', 'educational', 'workshops', 'skills', 'development', 'tree', 'planting', 'environmental', 'conservation', 'gatherings', 'cultural', 'exchange', 'free', 'attend', 'public', 'calendar', 'schedules', 'registration', 'details', 'month', 'karachi', 'lahore', 'islamabad', 'social', 'media', 'updates', 'photos']
  },
  {
    id: 'contact',
    url: '/contact',
    title: 'Contact - Wasilah',
    content: `Get in touch with us! We have offices in three major cities. Karachi Office: Main Office Complex, Clifton Block 5. Lahore Office: Model Town Extension. Islamabad Office: Blue Area Sector F-6. Email: info@wasilah.org. Phone numbers: Karachi +92-21-XXXXXXX, Lahore +92-42-XXXXXXX, Islamabad +92-51-XXXXXXX. You can also reach us through this chat widget for quick questions. Our team responds to emails within 24 hours during business days. Follow us on Facebook, Instagram, and Twitter @WasilahOrg for updates and stories.`,
    tokens: ['contact', 'touch', 'offices', 'cities', 'karachi', 'office', 'complex', 'clifton', 'lahore', 'model', 'town', 'islamabad', 'blue', 'area', 'sector', 'email', 'info', 'wasilah', 'phone', 'numbers', 'reach', 'chat', 'widget', 'questions', 'team', 'responds', 'hours', 'business', 'days', 'facebook', 'instagram', 'twitter', 'updates', 'stories']
  }
];

async function seedKB() {
  console.log('🌱 Starting KB seed...\n');
  
  try {
    const batch = db.batch();
    
    for (const page of INITIAL_KB_PAGES) {
      const docRef = db.collection('kb').doc('pages').collection('content').doc(page.id);
      batch.set(docRef, {
        ...page,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        source: 'initial-seed'
      });
      console.log(`✓ Prepared: ${page.title}`);
    }
    
    await batch.commit();
    
    console.log('\n✅ KB seeding complete!');
    console.log(`📚 Seeded ${INITIAL_KB_PAGES.length} pages`);
    console.log('\nNext steps:');
    console.log('1. The chatbot will now work with this initial content');
    console.log('2. Deploy the updateKb function to auto-refresh from live site');
    console.log('3. Use the admin panel to manually refresh KB anytime\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding KB:', error);
    process.exit(1);
  }
}

seedKB();
