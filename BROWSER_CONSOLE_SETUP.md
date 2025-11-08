# 🚀 Super Easy Browser Console Setup

Copy and paste this into your browser console while logged into your app. That's it!

---

## Step 1: Open Your App

1. Start your app: `npm run dev`
2. Open browser: `http://localhost:5173`
3. **Log in to your account**

---

## Step 2: Open Browser Console

**Chrome/Edge/Brave:**
- Press `F12` or `Ctrl+Shift+J` (Windows)
- Or `Cmd+Option+J` (Mac)

**Firefox:**
- Press `F12` or `Ctrl+Shift+K` (Windows)
- Or `Cmd+Option+K` (Mac)

**Safari:**
- Enable Developer Menu: Preferences → Advanced → "Show Develop menu"
- Press `Cmd+Option+C`

---

## Step 3: Paste This Script

Copy **ALL** of this code and paste it into the console, then press Enter:

```javascript
// 🚀 WASILAH CHAT SETUP SCRIPT
// Just paste this into your browser console while logged in!

(async function setupWasilahChat() {
  console.log('🚀 Starting Wasilah Chat Setup...');
  
  // Get Firebase from window
  const { db, auth } = window;
  
  if (!db || !auth) {
    console.error('❌ Firebase not found! Make sure you are on your app and logged in.');
    return;
  }
  
  const { collection, addDoc, doc, setDoc, getDocs } = window.firestoreExports || {};
  
  if (!collection || !addDoc) {
    console.error('❌ Firestore functions not found! Trying alternative...');
    
    // Try importing from Firebase
    try {
      const firestoreModule = await import('firebase/firestore');
      window.firestoreExports = firestoreModule;
      console.log('✅ Loaded Firestore functions');
    } catch (e) {
      console.error('❌ Could not load Firestore. Please use the AdminSetup page instead.');
      console.log('📍 Visit: http://localhost:5173/admin-setup');
      return;
    }
  }
  
  const { 
    collection: fsCollection, 
    addDoc: fsAddDoc, 
    doc: fsDoc, 
    setDoc: fsSetDoc,
    getDocs: fsGetDocs 
  } = window.firestoreExports;
  
  // Knowledge Base Data
  const KB_DATA = [
    {
      question: "What is Wasilah?",
      answer: "Wasilah is a community service organization dedicated to creating positive change through education, healthcare, environmental initiatives, and community development projects. We believe in empowering communities and creating sustainable impact through volunteer-driven programs.",
      keywords: ["wasilah", "organization", "about", "who", "what", "mission", "vision"],
      tags: ["general", "about"]
    },
    {
      question: "How can I volunteer with Wasilah?",
      answer: "You can volunteer by visiting our 'Join Us' page and filling out the volunteer application form. Our team will review your application and contact you within 3-5 business days with available opportunities that match your interests and skills. We welcome volunteers from all backgrounds and experience levels.",
      keywords: ["volunteer", "join", "help", "participate", "contribute", "apply", "signup"],
      tags: ["volunteer", "join"]
    },
    {
      question: "What types of projects does Wasilah run?",
      answer: "We run various projects including education programs (tutoring, scholarship support), healthcare initiatives (free medical camps, health awareness), environmental conservation efforts (tree planting, clean-up drives), and community development projects (infrastructure, skills training). Each project is designed to create lasting positive impact in communities across Pakistan.",
      keywords: ["projects", "programs", "initiatives", "types", "work", "activities", "services"],
      tags: ["projects", "general"]
    },
    {
      question: "How can I donate or support Wasilah?",
      answer: "You can support Wasilah through volunteering your time, spreading awareness about our cause on social media, or contributing resources and materials for specific projects. While we don't currently accept monetary donations through the website, you can contact us directly to discuss specific ways you can help make a difference in your community.",
      keywords: ["donate", "support", "help", "contribute", "give", "funding", "sponsor"],
      tags: ["support", "donate"]
    },
    {
      question: "Where is Wasilah located?",
      answer: "We have offices in Karachi, Lahore, and Islamabad. Our projects span across multiple cities in Pakistan. Karachi Office: Main Office Complex, Clifton Block 5. Lahore Office: Model Town Extension. Islamabad Office: Blue Area Sector F-6. Visit our Contact page for detailed addresses, phone numbers, and contact information.",
      keywords: ["location", "office", "address", "where", "city", "karachi", "lahore", "islamabad"],
      tags: ["contact", "location"]
    },
    {
      question: "What events does Wasilah organize?",
      answer: "We organize various community events including health fairs (free checkups and screenings), educational workshops (skills development, career guidance), environmental initiatives (tree planting drives, beach cleanups), and community gatherings (cultural events, youth programs). Check our Events page for upcoming activities, schedules, and registration details. Most events are free to attend!",
      keywords: ["events", "activities", "workshops", "programs", "calendar", "schedule", "upcoming"],
      tags: ["events", "programs"]
    },
    {
      question: "How do I contact Wasilah?",
      answer: "You can reach us through our Contact page where you'll find our email (info@wasilah.org), phone numbers (Karachi: +92-21-XXXXXXX, Lahore: +92-42-XXXXXXX, Islamabad: +92-51-XXXXXXX), and office locations. You can also use this chat widget for quick questions. Our team typically responds to emails within 24 hours during business days.",
      keywords: ["contact", "email", "phone", "reach", "communicate", "call", "message"],
      tags: ["contact", "support"]
    },
    {
      question: "Can I submit a project idea to Wasilah?",
      answer: "Yes! We welcome community-driven project ideas and believe the best initiatives come from understanding local needs. You can submit your proposal through this chat widget, or contact us directly through our Contact page. Please include details about the problem you want to solve, your proposed solution, expected impact, and resources needed. Our team reviews all submissions and responds within 7-10 business days.",
      keywords: ["submit", "idea", "proposal", "suggest", "pitch", "project idea", "initiative"],
      tags: ["projects", "submit"]
    },
    {
      question: "What are the requirements to volunteer?",
      answer: "We welcome volunteers aged 16 and above. For minors (16-17 years), parental consent is required. No prior experience is necessary as we provide orientation and training for all volunteers. What we look for: commitment to our mission, reliability, good communication skills, and a desire to make a positive impact. Some specialized projects may require specific skills, which will be mentioned in the opportunity description.",
      keywords: ["requirements", "eligibility", "qualifications", "age", "experience", "criteria"],
      tags: ["volunteer", "requirements"]
    },
    {
      question: "How often are volunteer opportunities available?",
      answer: "We have ongoing volunteer opportunities year-round! Some opportunities are one-time events (like weekend drives or special campaigns), while others are regular commitments (like weekly tutoring sessions or monthly health camps). The frequency depends on the project and your availability. You can choose opportunities that fit your schedule - whether you can volunteer once a month or multiple times per week.",
      keywords: ["frequency", "schedule", "timing", "when", "availability", "commitment", "how often"],
      tags: ["volunteer", "schedule"]
    },
    {
      question: "Does Wasilah provide volunteer certificates?",
      answer: "Yes! We provide volunteer certificates after you complete 20 hours of verified volunteer service. The certificate includes your name, total hours served, projects participated in, and is signed by our leadership team. These certificates are useful for academic requirements, job applications, and personal records. We also provide reference letters upon request for volunteers who have served for 40+ hours.",
      keywords: ["certificate", "recognition", "proof", "document", "verification", "reference"],
      tags: ["volunteer", "certificates"]
    },
    {
      question: "How can I stay updated about Wasilah's activities?",
      answer: "Stay connected with us through multiple channels: 1) Check our Events page regularly for upcoming activities 2) Follow us on social media (Facebook, Instagram, Twitter @WasilahOrg) 3) Subscribe to our newsletter via the Contact page 4) Join our WhatsApp community groups (link provided after volunteer registration). We post updates at least twice a week about new projects, event photos, impact stories, and volunteer spotlights.",
      keywords: ["updates", "news", "social media", "follow", "subscribe", "newsletter", "information"],
      tags: ["general", "contact", "updates"]
    }
  ];
  
  try {
    // Step 1: Seed Knowledge Base
    console.log('📚 Step 1: Seeding Knowledge Base...');
    
    const kbRef = fsCollection(db, 'faqs');
    const existingFaqs = await fsGetDocs(kbRef);
    
    if (existingFaqs.size > 0) {
      console.log(`⚠️  Found ${existingFaqs.size} existing FAQs. Skipping seed.`);
      console.log('   (Delete existing FAQs from Firestore if you want to re-seed)');
    } else {
      for (let i = 0; i < KB_DATA.length; i++) {
        const faq = KB_DATA[i];
        await fsAddDoc(kbRef, {
          question: faq.question,
          answer: faq.answer,
          keywords: faq.keywords,
          tags: faq.tags,
          createdAt: new Date()
        });
        console.log(`  ✅ Added FAQ ${i + 1}/${KB_DATA.length}: ${faq.question}`);
      }
      console.log(`✅ Seeded ${KB_DATA.length} FAQs successfully!`);
    }
    
    // Step 2: Make Current User Admin
    console.log('\n👤 Step 2: Setting up admin user...');
    
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ No user logged in! Please log in first.');
      return;
    }
    
    const userRef = fsDoc(db, 'users', currentUser.uid);
    await fsSetDoc(userRef, {
      email: currentUser.email,
      displayName: currentUser.displayName || currentUser.email,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    console.log(`✅ ${currentUser.email} is now an admin!`);
    
    // Success!
    console.log('\n🎉 ========================================');
    console.log('🎉 SETUP COMPLETE!');
    console.log('🎉 ========================================');
    console.log('');
    console.log('✅ Knowledge base seeded with 12 FAQs');
    console.log(`✅ ${currentUser.email} set as admin`);
    console.log('');
    console.log('📍 Next steps:');
    console.log('   1. Refresh this page (Ctrl+R or Cmd+R)');
    console.log('   2. Look for the chat widget (bottom-right)');
    console.log('   3. Click admin toggle to access admin panel');
    console.log('   4. Open "Chats" tab to manage user chats');
    console.log('');
    console.log('💬 Test it: Open chat and ask "What is Wasilah?"');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure Firestore rules are deployed');
    console.log('   • Check that you are logged in');
    console.log('   • Try using the AdminSetup page: /admin-setup');
  }
})();
```

---

## Step 4: Watch the Magic! ✨

You'll see output like:
```
🚀 Starting Wasilah Chat Setup...
📚 Step 1: Seeding Knowledge Base...
  ✅ Added FAQ 1/12: What is Wasilah?
  ✅ Added FAQ 2/12: How can I volunteer...
  ...
✅ Seeded 12 FAQs successfully!

👤 Step 2: Setting up admin user...
✅ user@example.com is now an admin!

🎉 SETUP COMPLETE!
```

---

## Step 5: Refresh & Test

1. **Refresh the page** (F5 or Ctrl+R)
2. Look for the **chat widget** (bottom-right corner)
3. Click it and ask: "What is Wasilah?"
4. Bot should respond!
5. Click **Admin Toggle** to see admin features

---

## Alternative: Even Simpler!

If the console script doesn't work, just:

1. Visit: `http://localhost:5173/admin-setup`
2. Click "Seed Knowledge Base"
3. Click "Make Me Admin"
4. Done! 🎉

---

## Troubleshooting

### Error: "Firebase not found"
- Make sure you're on your app's page
- Make sure you're logged in
- Try the `/admin-setup` page instead

### Error: "Permission denied"
- Deploy Firestore rules first
- Rules location: `firestore.rules` file
- Deploy via Firebase Console → Firestore → Rules

### It worked but I don't see admin features
- **Refresh the page** (hard refresh: Ctrl+Shift+R)
- Log out and log back in
- Check Firestore Console → users/{your-uid} → isAdmin = true

---

## What This Script Does

1. ✅ Checks if FAQs exist (won't duplicate)
2. ✅ Adds 12 FAQs to Firestore `faqs` collection
3. ✅ Gets your current logged-in user
4. ✅ Sets `isAdmin: true` in your user document
5. ✅ Shows success messages

**Total time: 30 seconds!** ⚡

---

## Need Help?

1. **Can't get console script to work?** → Use `/admin-setup` page
2. **That doesn't work either?** → Read `FIREBASE_CONSOLE_SETUP.md`
3. **Still stuck?** → Check `WASILAH_CHAT_README.md`

---

✨ **This is literally the easiest way possible!** Just copy-paste into console and you're done!
