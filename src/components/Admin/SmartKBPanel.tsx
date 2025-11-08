/**
 * Smart KB Admin Panel
 * Manage auto-learning and view KB statistics
 */

import { useState, useEffect } from 'react';
import {
  forceRefreshKB,
  getKBStatistics,
  needsAutoLearning
} from '../../services/autoLearnService';

interface KBStats {
  manualEntries: number;
  autoLearnedEntries: number;
  totalEntries: number;
  totalTokens: number;
  averageTokensPerPage: number;
  lastUpdated: Date | null;
}

export default function SmartKBPanel() {
  const [stats, setStats] = useState<KBStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0, url: '' });
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const kbStats = getKBStatistics();
    setStats(kbStats);
    setNeedsUpdate(needsAutoLearning());
    
    if (kbStats.lastUpdated) {
      const date = new Date(kbStats.lastUpdated);
      setLastRefreshTime(date.toLocaleString());
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshProgress({ current: 0, total: 0, url: '' });

    try {
      const count = await forceRefreshKB((current, total, url) => {
        setRefreshProgress({ current, total, url });
      });

      // Reload stats
      loadStats();
      
      alert(`✅ Successfully refreshed KB with ${count} pages!`);
    } catch (error) {
      console.error('Error refreshing KB:', error);
      alert('❌ Failed to refresh KB. Check console for details.');
    } finally {
      setIsRefreshing(false);
      setRefreshProgress({ current: 0, total: 0, url: '' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Smart Knowledge Base</h2>
          <p className="text-gray-600 mt-1">Auto-learning chatbot intelligence</p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            isRefreshing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : needsUpdate
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRefreshing ? '⏳ Refreshing...' : needsUpdate ? '🔄 Update Needed' : '🔄 Refresh KB'}
        </button>
      </div>

      {/* Status Banner */}
      {needsUpdate && !isRefreshing && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-orange-800">Update Recommended</h3>
              <p className="text-orange-700 text-sm mt-1">
                Your knowledge base is outdated. Click "Update Needed" to refresh with latest website content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isRefreshing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="font-semibold text-blue-800">
              Learning from website...
            </span>
          </div>
          
          {refreshProgress.total > 0 && (
            <>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-700">
                {refreshProgress.current} of {refreshProgress.total} pages • {refreshProgress.url}
              </p>
            </>
          )}
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-blue-600 text-sm font-semibold mb-1">📚 Manual Entries</div>
            <div className="text-3xl font-bold text-blue-900">{stats.manualEntries}</div>
            <div className="text-xs text-blue-700 mt-1">Hand-crafted FAQs</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-1">🧠 Auto-Learned</div>
            <div className="text-3xl font-bold text-green-900">{stats.autoLearnedEntries}</div>
            <div className="text-xs text-green-700 mt-1">From website pages</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-1">✨ Total Entries</div>
            <div className="text-3xl font-bold text-purple-900">{stats.totalEntries}</div>
            <div className="text-xs text-purple-700 mt-1">Combined knowledge</div>
          </div>
        </div>
      )}

      {/* Details */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Tokens:</span>
            <span className="text-gray-900 font-semibold">{stats.totalTokens.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Avg Tokens/Page:</span>
            <span className="text-gray-900 font-semibold">{stats.averageTokensPerPage}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Last Updated:</span>
            <span className="text-gray-900 font-semibold">
              {lastRefreshTime || 'Never'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Cost:</span>
            <span className="text-green-600 font-bold">$0.00 (Free Forever)</span>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-6 border-t pt-6">
        <h3 className="font-bold text-gray-800 mb-3">🤖 How Smart KB Works</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Automatically discovers all pages on your website</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Extracts meaningful content using intelligent parsing</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Uses TF-IDF, fuzzy matching, and semantic understanding</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Works 100% client-side - no external APIs or costs</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Updates automatically every 7 days or on-demand</span>
          </li>
        </ul>
      </div>

      {/* Tips */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start">
          <span className="text-xl mr-2">💡</span>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
            <p className="text-sm text-blue-800">
              The chatbot learns from your website content automatically. 
              Update your website pages, then click "Refresh KB" to teach the bot new information - 
              just like training ChatGPT, but free!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
