import React, { useState } from 'react';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Loader, AlertCircle, Users, Database } from 'lucide-react';

// Import KB seed data
const KB_SEED_DATA = [
  {
    "question": "What is Wasilah?",
    "answer": "Wasilah is a community service organization dedicated to creating positive change through education, healthcare, environmental initiatives, and community development projects. We believe in empowering communities and creating sustainable impact through volunteer-driven programs.",
    "keywords": ["wasilah", "organization", "about", "who", "what", "mission", "vision"],
    "tags": ["general", "about"]
  },
  {
    "question": "How can I volunteer with Wasilah?",
    "answer": "You can volunteer by visiting our 'Join Us' page and filling out the volunteer application form. Our team will review your application and contact you within 3-5 business days with available opportunities that match your interests and skills. We welcome volunteers from all backgrounds and experience levels.",
    "keywords": ["volunteer", "join", "help", "participate", "contribute", "apply", "signup"],
    "tags": ["volunteer", "join"]
  },
  {
    "question": "What types of projects does Wasilah run?",
    "answer": "We run various projects including education programs (tutoring, scholarship support), healthcare initiatives (free medical camps, health awareness), environmental conservation efforts (tree planting, clean-up drives), and community development projects (infrastructure, skills training). Each project is designed to create lasting positive impact in communities across Pakistan.",
    "keywords": ["projects", "programs", "initiatives", "types", "work", "activities", "services"],
    "tags": ["projects", "general"]
  },
  {
    "question": "How can I donate or support Wasilah?",
    "answer": "You can support Wasilah through volunteering your time, spreading awareness about our cause on social media, or contributing resources and materials for specific projects. While we don't currently accept monetary donations through the website, you can contact us directly to discuss specific ways you can help make a difference in your community.",
    "keywords": ["donate", "support", "help", "contribute", "give", "funding", "sponsor"],
    "tags": ["support", "donate"]
  },
  {
    "question": "Where is Wasilah located?",
    "answer": "We have offices in Karachi, Lahore, and Islamabad. Our projects span across multiple cities in Pakistan. Karachi Office: Main Office Complex, Clifton Block 5. Lahore Office: Model Town Extension. Islamabad Office: Blue Area Sector F-6. Visit our Contact page for detailed addresses, phone numbers, and contact information.",
    "keywords": ["location", "office", "address", "where", "city", "karachi", "lahore", "islamabad"],
    "tags": ["contact", "location"]
  },
  {
    "question": "What events does Wasilah organize?",
    "answer": "We organize various community events including health fairs (free checkups and screenings), educational workshops (skills development, career guidance), environmental initiatives (tree planting drives, beach cleanups), and community gatherings (cultural events, youth programs). Check our Events page for upcoming activities, schedules, and registration details. Most events are free to attend!",
    "keywords": ["events", "activities", "workshops", "programs", "calendar", "schedule", "upcoming"],
    "tags": ["events", "programs"]
  },
  {
    "question": "How do I contact Wasilah?",
    "answer": "You can reach us through our Contact page where you'll find our email (info@wasilah.org), phone numbers (Karachi: +92-21-XXXXXXX, Lahore: +92-42-XXXXXXX, Islamabad: +92-51-XXXXXXX), and office locations. You can also use this chat widget for quick questions. Our team typically responds to emails within 24 hours during business days.",
    "keywords": ["contact", "email", "phone", "reach", "communicate", "call", "message"],
    "tags": ["contact", "support"]
  },
  {
    "question": "Can I submit a project idea to Wasilah?",
    "answer": "Yes! We welcome community-driven project ideas and believe the best initiatives come from understanding local needs. You can submit your proposal through this chat widget, or contact us directly through our Contact page. Please include details about the problem you want to solve, your proposed solution, expected impact, and resources needed. Our team reviews all submissions and responds within 7-10 business days.",
    "keywords": ["submit", "idea", "proposal", "suggest", "pitch", "project idea", "initiative"],
    "tags": ["projects", "submit"]
  },
  {
    "question": "What are the requirements to volunteer?",
    "answer": "We welcome volunteers aged 16 and above. For minors (16-17 years), parental consent is required. No prior experience is necessary as we provide orientation and training for all volunteers. What we look for: commitment to our mission, reliability, good communication skills, and a desire to make a positive impact. Some specialized projects may require specific skills, which will be mentioned in the opportunity description.",
    "keywords": ["requirements", "eligibility", "qualifications", "age", "experience", "criteria"],
    "tags": ["volunteer", "requirements"]
  },
  {
    "question": "How often are volunteer opportunities available?",
    "answer": "We have ongoing volunteer opportunities year-round! Some opportunities are one-time events (like weekend drives or special campaigns), while others are regular commitments (like weekly tutoring sessions or monthly health camps). The frequency depends on the project and your availability. You can choose opportunities that fit your schedule - whether you can volunteer once a month or multiple times per week.",
    "keywords": ["frequency", "schedule", "timing", "when", "availability", "commitment", "how often"],
    "tags": ["volunteer", "schedule"]
  },
  {
    "question": "Does Wasilah provide volunteer certificates?",
    "answer": "Yes! We provide volunteer certificates after you complete 20 hours of verified volunteer service. The certificate includes your name, total hours served, projects participated in, and is signed by our leadership team. These certificates are useful for academic requirements, job applications, and personal records. We also provide reference letters upon request for volunteers who have served for 40+ hours.",
    "keywords": ["certificate", "recognition", "proof", "document", "verification", "reference"],
    "tags": ["volunteer", "certificates"]
  },
  {
    "question": "How can I stay updated about Wasilah's activities?",
    "answer": "Stay connected with us through multiple channels: 1) Check our Events page regularly for upcoming activities 2) Follow us on social media (Facebook, Instagram, Twitter @WasilahOrg) 3) Subscribe to our newsletter via the Contact page 4) Join our WhatsApp community groups (link provided after volunteer registration). We post updates at least twice a week about new projects, event photos, impact stories, and volunteer spotlights.",
    "keywords": ["updates", "news", "social media", "follow", "subscribe", "newsletter", "information"],
    "tags": ["general", "contact", "updates"]
  }
];

const AdminSetup = () => {
  const { currentUser } = useAuth();
  const [kbStatus, setKbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [kbMessage, setKbMessage] = useState('');
  const [kbCount, setKbCount] = useState(0);
  
  const [adminStatus, setAdminStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [adminMessage, setAdminMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Seed Knowledge Base
  const seedKnowledgeBase = async () => {
    setKbStatus('loading');
    setKbMessage('Checking existing FAQs...');
    
    try {
      // Check if FAQs already exist
      const kbSnapshot = await getDocs(collection(db, 'faqs'));
      
      if (kbSnapshot.size > 0) {
        setKbStatus('error');
        setKbMessage(`Found ${kbSnapshot.size} existing FAQs. Delete them first to re-seed, or skip this step.`);
        return;
      }

      setKbMessage('Seeding knowledge base...');
      let count = 0;

      for (const faq of KB_SEED_DATA) {
        await addDoc(collection(db, 'faqs'), {
          question: faq.question,
          answer: faq.answer,
          keywords: faq.keywords,
          tags: faq.tags,
          createdAt: new Date()
        });
        count++;
        setKbCount(count);
        setKbMessage(`Added ${count}/${KB_SEED_DATA.length} FAQs...`);
      }

      setKbStatus('success');
      setKbMessage(`Successfully seeded ${count} FAQs! 🎉`);
    } catch (error: any) {
      setKbStatus('error');
      setKbMessage(`Error: ${error.message}`);
      console.error('Seed error:', error);
    }
  };

  // Make current user admin
  const makeCurrentUserAdmin = async () => {
    if (!currentUser) {
      setAdminStatus('error');
      setAdminMessage('You must be logged in to make yourself admin');
      return;
    }

    setAdminStatus('loading');
    setAdminMessage('Setting admin privileges...');

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      setAdminStatus('success');
      setAdminMessage(`✅ You (${currentUser.email}) are now an admin! Refresh the page to see admin features.`);
    } catch (error: any) {
      setAdminStatus('error');
      setAdminMessage(`Error: ${error.message}`);
      console.error('Admin setup error:', error);
    }
  };

  // Make user admin by email
  const makeUserAdminByEmail = async () => {
    if (!userEmail.trim()) {
      setAdminMessage('Please enter an email address');
      return;
    }

    setAdminStatus('loading');
    setAdminMessage('Searching for user...');

    try {
      // Get all users and find by email
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let found = false;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (userData.email === userEmail.trim()) {
          await setDoc(doc(db, 'users', userDoc.id), {
            ...userData,
            isAdmin: true,
            updatedAt: new Date()
          }, { merge: true });

          found = true;
          setAdminStatus('success');
          setAdminMessage(`✅ ${userEmail} is now an admin!`);
          setUserEmail('');
          break;
        }
      }

      if (!found) {
        setAdminStatus('error');
        setAdminMessage(`❌ User with email ${userEmail} not found. They need to log in first.`);
      }
    } catch (error: any) {
      setAdminStatus('error');
      setAdminMessage(`Error: ${error.message}`);
      console.error('Admin setup error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Admin Setup Wizard
          </h1>
          <p className="text-gray-600">
            One-time setup to initialize your chat system and admin users. Run this only once!
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Important</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Run this page only once for initial setup</li>
                  <li>Make sure Firestore rules and indexes are deployed first</li>
                  <li>After setup, you can delete this page or restrict access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Seed Knowledge Base */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Seed Knowledge Base</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Add {KB_SEED_DATA.length} FAQs to your Firestore database. The bot will use these to answer user questions.
          </p>

          <button
            onClick={seedKnowledgeBase}
            disabled={kbStatus === 'loading' || kbStatus === 'success'}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              kbStatus === 'success'
                ? 'bg-green-600 text-white cursor-not-allowed'
                : kbStatus === 'loading'
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {kbStatus === 'loading' && <Loader className="w-5 h-5 inline mr-2 animate-spin" />}
            {kbStatus === 'success' && <CheckCircle className="w-5 h-5 inline mr-2" />}
            {kbStatus === 'loading' ? 'Seeding...' : kbStatus === 'success' ? 'Seeded!' : 'Seed Knowledge Base'}
          </button>

          {/* Status Message */}
          {kbMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              kbStatus === 'success' ? 'bg-green-50 text-green-800' :
              kbStatus === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-start">
                {kbStatus === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                {kbStatus === 'error' && <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                {kbStatus === 'loading' && <Loader className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 animate-spin" />}
                <p>{kbMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Set Admin Users */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Set Admin Users</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Grant admin privileges to users. They'll be able to access the admin panel and manage chats.
          </p>

          {/* Make Current User Admin */}
          <div className="mb-8 pb-8 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Option A: Make Yourself Admin</h3>
            
            {currentUser ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Currently logged in as: <strong>{currentUser.email}</strong>
                </p>
                <button
                  onClick={makeCurrentUserAdmin}
                  disabled={adminStatus === 'loading'}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {adminStatus === 'loading' && <Loader className="w-5 h-5 inline mr-2 animate-spin" />}
                  Make Me Admin
                </button>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">⚠️ You need to be logged in to use this option</p>
              </div>
            )}
          </div>

          {/* Make User Admin by Email */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Option B: Make User Admin by Email</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the email of a user who has already logged in once.
            </p>
            
            <div className="flex gap-3 mb-4">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
              <button
                onClick={makeUserAdminByEmail}
                disabled={adminStatus === 'loading' || !userEmail.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                {adminStatus === 'loading' && <Loader className="w-5 h-5 inline mr-2 animate-spin" />}
                Set Admin
              </button>
            </div>
          </div>

          {/* Status Message */}
          {adminMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              adminStatus === 'success' ? 'bg-green-50 text-green-800' :
              adminStatus === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-start">
                {adminStatus === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                {adminStatus === 'error' && <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                {adminStatus === 'loading' && <Loader className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 animate-spin" />}
                <p>{adminMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {kbStatus === 'success' && adminStatus === 'success' && (
          <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  🎉 Setup Complete!
                </h3>
                <div className="text-sm text-green-700 space-y-2">
                  <p>✅ Knowledge base seeded with {KB_SEED_DATA.length} FAQs</p>
                  <p>✅ Admin user(s) configured</p>
                  <p className="mt-4 font-medium">Next steps:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Refresh the page to see admin features</li>
                    <li>Open the chat widget to test bot responses</li>
                    <li>Access admin panel to view all chats</li>
                    <li>Delete or restrict access to this setup page</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• If seeding fails with permission errors, check your Firestore rules</li>
            <li>• Users must log in at least once before you can make them admin</li>
            <li>• After setup, check the admin panel for the "Chats" tab</li>
            <li>• See <code className="bg-white px-2 py-1 rounded">WASILAH_CHAT_README.md</code> for detailed docs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
