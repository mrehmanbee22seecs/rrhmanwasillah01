import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Menu, Plus, Clock, Trash2, Bell, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { findBestMatch, formatResponse } from '../utils/kbMatcher';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  createdAt: Date;
  meta?: Record<string, any>;
  sourceUrl?: string;
  sourcePage?: string;
  needsAdmin?: boolean;
  confidence?: number;
}

interface ChatWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWidgetModal: React.FC<ChatWidgetModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [kbPages, setKbPages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    chats,
    currentChatId,
    sendMessage,
    setCurrentChatId,
    closeChat,
  } = useChat(currentUser?.uid || null);

  // Load KB pages for intelligent matching
  useEffect(() => {
    const loadKb = async () => {
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
        
        setKbPages(pages);
      } catch (error) {
        console.error('Error loading KB:', error);
      }
    };
    
    if (isOpen) {
      loadKb();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNotifyAdmin = async (messageText: string) => {
    if (!currentChatId) return;
    
    try {
      await addDoc(collection(db, 'unanswered_queries'), {
        chatId: currentChatId,
        userId: currentUser?.uid || 'guest',
        query: messageText,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      alert('✅ Admin has been notified! They will respond soon.');
    } catch (error) {
      console.error('Error notifying admin:', error);
      alert('Failed to notify admin. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      await sendMessage(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    await closeChat();
    setShowHistory(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowHistory(false);
  };

  const handleCloseChat = async () => {
    const confirmClose = window.confirm('Are you sure you want to close this chat? This will end the current conversation.');
    if (confirmClose) {
      await closeChat();
      setShowHistory(false);
    }
  };

  const currentChat = chats.find((c) => c.id === currentChatId);
  const hasAdminMessages = messages.some((m) => m.sender === 'admin');
  const hasIntelligentKb = kbPages.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Modal - Z-INDEX: 65 */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[65] w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-bold text-lg">
              {currentChat?.title || 'Wasilah Assistant'}
            </h3>
            {hasIntelligentKb && (
              <span className="text-xs bg-yellow-400 text-blue-900 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3" />
                Smart
              </span>
            )}
            {hasAdminMessages && (
              <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full font-bold">
                Admin replied
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="hover:bg-blue-700 p-2 rounded transition-colors"
              title="Chat History"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-blue-700 p-2 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat History Sidebar */}
          {showHistory && (
            <div className="w-64 border-r flex flex-col bg-gray-50">
              <div className="p-3 border-b">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-600 text-sm">
                    No chat history yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`w-full p-3 text-left hover:bg-blue-50 transition-colors ${
                          currentChatId === chat.id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {chat.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {chat.lastMessageAt?.toDate?.().toLocaleDateString() || 'Just now'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.sender === 'admin'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-medium">{msg.text}</p>
                    {msg.sender === 'bot' && msg.sourceUrl && (
                      <a
                        href={msg.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Learn more
                      </a>
                    )}
                    {msg.sender === 'bot' && msg.needsAdmin && (
                      <button
                        onClick={() => handleNotifyAdmin(msg.text)}
                        className="text-xs bg-orange-500 text-white px-2 py-1 rounded mt-2 hover:bg-orange-600 flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        Notify Admin
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-bold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidgetModal;
