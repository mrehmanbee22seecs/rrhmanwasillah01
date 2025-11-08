import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs,
  serverTimestamp,
  doc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Database, RefreshCw, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import SmartKBPanel from '../components/Admin/SmartKBPanel';

/**
 * Admin KB Manager
 * - Smart KB with auto-learning (NEW!)
 * - One-click manual KB seeding
 * - View KB stats
 * - Refresh from live site
 * - Admin only access
 */

// Initial KB content to seed
const INITIAL_KB_CONTENT = [
  {
    id: 'home',
    url: '/',
    title: 'Home - Wasilah',
    content: 'Wasilah is a community service organization dedicated to creating positive change through education, healthcare, environmental initiatives, and community development projects. We believe in empowering communities and creating sustainable impact through volunteer-driven programs. Our mission is to connect people who want to make a difference with opportunities that create lasting change.',
    tokens: ['wasilah', 'community', 'service', 'organization', 'education', 'healthcare', 'environmental', 'initiatives', 'development', 'projects', 'empowering', 'communities', 'sustainable', 'impact', 'volunteer', 'programs', 'mission', 'connect', 'people', 'difference', 'opportunities', 'change']
  },
  {
    id: 'about',
    url: '/about',
    title: 'About Us - Wasilah',
    content: 'Wasilah was founded with a vision to bridge communities and create meaningful impact through collaborative service. We work across multiple sectors including education, healthcare, environmental conservation, and community development. Our team comprises dedicated volunteers, community leaders, and professionals who share a common goal: creating sustainable positive change in communities across Pakistan. We operate with transparency, accountability, and a deep commitment to serving those in need.',
    tokens: ['wasilah', 'founded', 'vision', 'bridge', 'communities', 'meaningful', 'impact', 'collaborative', 'service', 'sectors', 'education', 'healthcare', 'environmental', 'conservation', 'community', 'development', 'team', 'volunteers', 'leaders', 'professionals', 'goal', 'sustainable', 'change', 'pakistan', 'transparency', 'accountability', 'commitment', 'serving']
  },
  {
    id: 'projects',
    url: '/projects',
    title: 'Projects - Wasilah',
    content: 'Our projects span multiple areas of community impact. Education Programs: We provide tutoring, scholarship support, and educational resources to underprivileged students. Healthcare Initiatives: Free medical camps, health awareness campaigns, and preventive care programs. Environmental Conservation: Tree planting drives, beach cleanups, and sustainability workshops. Community Development: Infrastructure projects, skills training, and livelihood support programs. Each project is designed with community input and measured for sustainable impact.',
    tokens: ['projects', 'community', 'impact', 'education', 'programs', 'tutoring', 'scholarship', 'support', 'resources', 'students', 'healthcare', 'initiatives', 'medical', 'camps', 'health', 'awareness', 'campaigns', 'preventive', 'care', 'environmental', 'conservation', 'tree', 'planting', 'beach', 'cleanups', 'sustainability', 'workshops', 'development', 'infrastructure', 'skills', 'training', 'livelihood', 'designed', 'measured', 'sustainable']
  },
  {
    id: 'volunteer',
    url: '/volunteer',
    title: 'Volunteer - Wasilah',
    content: 'Join us as a volunteer and make a real difference in your community. We welcome volunteers aged 16 and above (parental consent required for minors). No prior experience necessary - we provide orientation and training. Volunteer opportunities include: event coordination, tutoring, healthcare support, environmental activities, administrative help, and social media management. You can volunteer once a month or multiple times per week based on your availability. After 20 hours of service, you will receive a volunteer certificate. Apply through our volunteer form and we will contact you within 3-5 business days.',
    tokens: ['volunteer', 'join', 'difference', 'community', 'welcome', 'aged', 'experience', 'orientation', 'training', 'opportunities', 'event', 'coordination', 'tutoring', 'healthcare', 'support', 'environmental', 'activities', 'administrative', 'social', 'media', 'management', 'availability', 'hours', 'service', 'certificate', 'apply', 'form', 'contact', 'business', 'days']
  },
  {
    id: 'events',
    url: '/events',
    title: 'Events - Wasilah',
    content: 'We organize regular community events to engage volunteers and create impact. Upcoming events include health fairs with free medical checkups, educational workshops for skills development, tree planting drives for environmental conservation, and community gatherings for cultural exchange. Most events are free to attend and open to the public. Check our events calendar for schedules and registration details. We typically host 2-3 events per month across Karachi, Lahore, and Islamabad. Follow us on social media for event updates and photos.',
    tokens: ['events', 'organize', 'community', 'engage', 'volunteers', 'impact', 'health', 'fairs', 'medical', 'checkups', 'educational', 'workshops', 'skills', 'development', 'tree', 'planting', 'environmental', 'conservation', 'gatherings', 'cultural', 'exchange', 'free', 'attend', 'public', 'calendar', 'schedules', 'registration', 'details', 'month', 'karachi', 'lahore', 'islamabad', 'social', 'media', 'updates', 'photos']
  },
  {
    id: 'contact',
    url: '/contact',
    title: 'Contact - Wasilah',
    content: 'Get in touch with us! We have offices in three major cities. Karachi Office: Main Office Complex, Clifton Block 5. Lahore Office: Model Town Extension. Islamabad Office: Blue Area Sector F-6. Email: info@wasilah.org. You can also reach us through this chat widget for quick questions. Our team responds to emails within 24 hours during business days. Follow us on Facebook, Instagram, and Twitter for updates and stories.',
    tokens: ['contact', 'touch', 'offices', 'cities', 'karachi', 'office', 'complex', 'clifton', 'lahore', 'model', 'town', 'islamabad', 'blue', 'area', 'sector', 'email', 'info', 'wasilah', 'reach', 'chat', 'widget', 'questions', 'team', 'responds', 'hours', 'business', 'days', 'facebook', 'instagram', 'twitter', 'updates', 'stories']
  }
];

const AdminKbManager = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kbStats, setKbStats] = useState<any>(null);
  const [seedResult, setSeedResult] = useState<any>(null);

  // Load KB stats
  const loadKbStats = async () => {
    try {
      const pagesSnapshot = await getDocs(
        collection(db, 'kb', 'pages', 'content')
      );
      
      const pages: any[] = [];
      pagesSnapshot.forEach((doc) => {
        pages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setKbStats({
        totalPages: pages.length,
        lastUpdated: pages[0]?.lastUpdated?.toDate(),
        pages: pages
      });
    } catch (error) {
      console.error('Error loading KB stats:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadKbStats();
    }
  }, [isAdmin]);

  // Manual seed KB
  const handleSeedKb = async () => {
    if (!window.confirm('Seed the Knowledge Base with initial content? This will add/update 6 pages.')) {
      return;
    }

    setLoading(true);
    setSeedResult(null);

    try {
      const results = {
        success: [],
        failed: [],
        updated: []
      };

      for (const page of INITIAL_KB_CONTENT) {
        try {
          const docRef = doc(db, 'kb', 'pages', 'content', page.id);
          
          await setDoc(docRef, {
            url: page.url,
            title: page.title,
            content: page.content,
            tokens: page.tokens,
            lastUpdated: serverTimestamp(),
            source: 'manual-admin-seed'
          });

          results.success.push(page.title);
        } catch (error: any) {
          console.error(`Error seeding ${page.id}:`, error);
          results.failed.push({
            title: page.title,
            error: error.message
          });
        }
      }

      setSeedResult(results);
      await loadKbStats(); // Refresh stats

      alert(`✅ KB Seeded!\n${results.success.length} pages added/updated`);
    } catch (error: any) {
      console.error('Error seeding KB:', error);
      alert('Failed to seed KB: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear KB
  const handleClearKb = async () => {
    if (!window.confirm('⚠️ Clear ALL Knowledge Base content? This cannot be undone!')) {
      return;
    }

    setLoading(true);

    try {
      const pagesSnapshot = await getDocs(
        collection(db, 'kb', 'pages', 'content')
      );

      const deletePromises: any[] = [];
      pagesSnapshot.forEach((document) => {
        deletePromises.push(
          setDoc(doc(db, 'kb', 'pages', 'content', document.id), {}, { merge: false })
        );
      });

      await Promise.all(deletePromises);
      await loadKbStats();
      
      alert('KB cleared successfully');
    } catch (error: any) {
      console.error('Error clearing KB:', error);
      alert('Failed to clear KB: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            Knowledge Base Manager
          </h1>
          <p className="text-gray-600">
            Manage the chatbot's knowledge base - auto-learning and manual seeding
          </p>
        </div>

        {/* Smart KB Panel - NEW! */}
        <div className="mb-8">
          <SmartKBPanel />
        </div>

        {/* Divider */}
        <div className="mb-8 border-t-2 border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Legacy Manual Seeding</h2>
          <p className="text-gray-500 text-sm">
            (Optional) Manual KB seeding for Firestore. Smart KB above is recommended.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleSeedKb}
            disabled={loading}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl shadow-lg transition-all font-semibold text-lg"
          >
            <Upload className={`w-6 h-6 ${loading ? 'animate-bounce' : ''}`} />
            {loading ? 'Seeding...' : 'Seed Knowledge Base'}
          </button>

          <button
            onClick={loadKbStats}
            disabled={loading}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-xl shadow-lg transition-all font-semibold text-lg"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </button>
        </div>

        {/* Seed Result */}
        {seedResult && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Seed Results
            </h3>
            <div className="space-y-2">
              <p className="text-green-600 font-medium">
                ✓ {seedResult.success.length} pages seeded successfully
              </p>
              {seedResult.failed.length > 0 && (
                <p className="text-red-600 font-medium">
                  ✗ {seedResult.failed.length} pages failed
                </p>
              )}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {seedResult.success.map((title: string) => (
                  <div key={title} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KB Stats */}
        {kbStats && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current KB Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Pages</p>
                  <p className="text-3xl font-bold text-blue-600">{kbStats.totalPages}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {kbStats.lastUpdated 
                      ? kbStats.lastUpdated.toLocaleDateString() 
                      : 'Never'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {kbStats.lastUpdated 
                      ? kbStats.lastUpdated.toLocaleTimeString()
                      : ''}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-sm font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {kbStats.totalPages > 0 ? 'Active' : 'Empty'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pages List */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pages in Knowledge Base</h3>
              {kbStats.pages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No pages in KB</p>
                  <p className="text-sm mt-1">Click "Seed Knowledge Base" to add initial content</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {kbStats.pages.map((page: any) => (
                    <div 
                      key={page.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{page.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{page.url}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{page.tokens?.length || 0} tokens</span>
                            <span>{page.content?.length || 0} characters</span>
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {page.source || 'unknown'}
                            </span>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
          <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-sm text-red-700 mb-4">
            These actions are irreversible. Use with caution.
          </p>
          <button
            onClick={handleClearKb}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            Clear All KB Content
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-bold text-blue-900 mb-3">How to Use</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Click "Seed Knowledge Base" to add 6 pre-written pages about Wasilah</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>The chatbot will immediately start using this content to answer questions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>You can re-seed anytime to update the content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Deploy Cloud Functions to enable auto-refresh from live website</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminKbManager;
