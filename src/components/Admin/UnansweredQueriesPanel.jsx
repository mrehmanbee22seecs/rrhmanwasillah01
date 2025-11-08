import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { RefreshCw, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Admin Panel for Unanswered Queries
 * - View fallback cases
 * - Manually respond to users
 * - Refresh KB manually
 */
const UnansweredQueriesPanel = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  // Load unanswered queries
  useEffect(() => {
    const q = query(
      collection(db, 'unanswered_queries'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queriesList = [];
      snapshot.forEach((doc) => {
        queriesList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      setQueries(queriesList);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Send manual reply
  const handleReply = async () => {
    if (!selectedQuery || !replyText.trim()) return;
    
    try {
      if (!selectedQuery.userId || !selectedQuery.chatId) {
        throw new Error('Missing userId or chatId on query');
      }

      // Add admin response to the user's chat messages subcollection
      const messagesRef = collection(db, `users/${selectedQuery.userId}/chats/${selectedQuery.chatId}/messages`);
      await addDoc(messagesRef, {
        sender: 'admin',
        text: replyText.trim(),
        createdAt: serverTimestamp(),
        adminResponse: true
      });
      
      // Mark query as resolved
      await updateDoc(doc(db, 'unanswered_queries', selectedQuery.id), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        adminReply: replyText.trim()
      });
      
      setReplyText('');
      setSelectedQuery(null);
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  // Manual KB refresh
  const handleRefreshKB = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    
    try {
      const functions = getFunctions();
      const refreshKnowledgeBase = httpsCallable(functions, 'refreshKnowledgeBase');
      
      const result = await refreshKnowledgeBase();
      setRefreshResult(result.data);
      alert(`KB refreshed! ${result.data.success.length} pages updated.`);
    } catch (error) {
      console.error('Error refreshing KB:', error);
      alert('Failed to refresh KB: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Get KB stats
  const [kbStats, setKbStats] = useState(null);
  useEffect(() => {
    const loadStats = async () => {
      try {
        const pagesSnapshot = await getDocs(
          collection(db, 'kb', 'pages', 'content')
        );
        
        const totalPages = pagesSnapshot.size;
        const lastUpdated = pagesSnapshot.docs[0]?.data()?.lastUpdated?.toDate();
        
        setKbStats({ totalPages, lastUpdated });
      } catch (error) {
        console.error('Error loading KB stats:', error);
      }
    };
    
    loadStats();
  }, [refreshResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const pendingQueries = queries.filter(q => q.status === 'pending');
  const resolvedQueries = queries.filter(q => q.status === 'resolved');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Unanswered Queries
        </h1>
        <p className="text-gray-600">
          Review and respond to questions the bot couldn't answer
        </p>
      </div>

      {/* KB Refresh Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Knowledge Base Status
            </h2>
            {kbStats && (
              <div className="space-y-1 text-sm text-gray-600">
                <p>📚 Total Pages: <span className="font-semibold">{kbStats.totalPages}</span></p>
                {kbStats.lastUpdated && (
                  <p>🕐 Last Updated: <span className="font-semibold">
                    {kbStats.lastUpdated.toLocaleDateString()} at {kbStats.lastUpdated.toLocaleTimeString()}
                  </span></p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleRefreshKB}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh KB'}
          </button>
        </div>
        
        {refreshResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Refresh Results:</h3>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">✓ {refreshResult.success.length} pages updated</p>
              {refreshResult.failed.length > 0 && (
                <p className="text-red-600">✗ {refreshResult.failed.length} pages failed</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingQueries.length}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{resolvedQueries.length}</p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queries List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button className="px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              Pending ({pendingQueries.length})
            </button>
            <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              Resolved ({resolvedQueries.length})
            </button>
          </nav>
        </div>

        <div className="divide-y divide-gray-200">
          {pendingQueries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm mt-1">No pending queries at the moment</p>
            </div>
          ) : (
            pendingQueries.map((query) => (
              <div key={query.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Pending
                      </span>
                      <span className="text-xs text-gray-500">
                        {query.createdAt.toLocaleDateString()} at {query.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{query.query}</p>
                    <p className="text-sm text-gray-600">
                      User: {query.userId.startsWith('guest_') ? 'Guest User' : query.userId.substring(0, 8) + '...'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedQuery(query)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reply to Query</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">User Question:</p>
                <p className="text-gray-900 font-medium">{selectedQuery.query}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response:
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  rows={6}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedQuery(null);
                  setReplyText('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <Send className="w-4 h-4" />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnansweredQueriesPanel;
