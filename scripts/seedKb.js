const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Load KB data from seed.json
const kbDataPath = path.join(__dirname, '..', 'kb', 'seed.json');
const kbData = JSON.parse(fs.readFileSync(kbDataPath, 'utf8'));

async function seedKnowledgeBase() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Checking existing FAQs...');
    const kbRef = collection(db, 'faqs');
    const existingDocs = await getDocs(kbRef);

    if (existingDocs.size > 0) {
      console.log(`Found ${existingDocs.size} existing FAQs. Skipping seed.`);
      console.log('To re-seed, delete existing FAQs first.');
      return;
    }

    console.log('Seeding knowledge base...');
    let count = 0;

    for (const faq of kbData) {
      await addDoc(collection(db, 'faqs'), {
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        tags: faq.tags,
        createdAt: new Date()
      });
      count++;
      console.log(`Added FAQ ${count}/${kbData.length}: ${faq.question}`);
    }

    console.log(`\nSuccessfully seeded ${count} FAQs!`);
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
    process.exit(1);
  }
}

seedKnowledgeBase();
