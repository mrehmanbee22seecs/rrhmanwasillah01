import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Sparkles, Menu, Plus, Clock, Trash2, Bell, ExternalLink, Minimize2, X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { findBestMatch, formatResponse } from '../utils/kbMatcher';
import { getEnhancedKB } from '../services/localKbService';
import ChatWidgetModal from './ChatWidgetModal';

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

const ChatWidget = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [kbPages, setKbPages] = useState<any[]>([]);
  const [suppressButton, setSuppressButton] = useState(false);
  const [rateInfo, setRateInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    chats,
    currentChatId,
    sendMessage,
    setCurrentChatId,
    closeChat,
  } = useChat(currentUser?.uid || null);

  // Load KB pages for intelligent matching from local data (no Firestore needed)
  useEffect(() => {
    const loadKb = () => {
      try {
        // Load from local seed data - works on Spark plan
        const pages = getEnhancedKB();
        setKbPages(pages);
        console.log(`✅ Loaded ${pages.length} KB pages for instant responses`);
      } catch (error) {
        console.error('Error loading KB:', error);
      }
    };
    loadKb();
  }, []);

  // Update rate limit display from latest message metadata
  useEffect(() => {
    const latestUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    if (latestUserMessage?.meta?.rate) {
      const rate = latestUserMessage.meta.rate;
      setRateInfo({
        remaining: rate.remaining,
        limit: rate.limit,
        windowSec: Math.round(rate.windowMs / 1000),
        blockedUntil: rate.resetMs > 0 ? Date.now() + rate.resetMs : undefined,
      });
    }
  }, [messages]);

  // Keep scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Center the modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [isOpen]);

  // Live countdown for rate limit unblocking
  useEffect(() => {
    if (!rateInfo?.blockedUntil) return;
    const interval = setInterval(() => {
      const remainingMs = rateInfo.blockedUntil - Date.now();
      if (remainingMs <= 0) {
        // Reset display to ready state when block expires
        setRateInfo((prev: any) => ({
          remaining: prev?.limit || 10,
          limit: prev?.limit || 10,
          windowSec: prev?.windowSec || 60,
          blockedUntil: undefined,
        }));
        clearInterval(interval);
      } else {
        // Force re-render to update seconds UI
        setRateInfo((prev: any) => ({ ...prev }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateInfo?.blockedUntil]);

  // Cross-widget coordination (hide our button when donation widget open, and vice versa)
  useEffect(() => {
    const onOpen = (e: any) => { if (e?.detail !== 'chat') setSuppressButton(true); };
    const onClose = (e: any) => { if (e?.detail !== 'chat') setSuppressButton(false); };
    window.addEventListener('widget:open', onOpen as any);
    window.addEventListener('widget:close', onClose as any);
    return () => {
      window.removeEventListener('widget:open', onOpen as any);
      window.removeEventListener('widget:close', onClose as any);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(isOpen ? 'widget:open' : 'widget:close', { detail: 'chat' }));
  }, [isOpen]);

  // Keep admin panel on top if it opens while chat is open (visual only)
  useEffect(() => {
    const onAdminOpen = () => setIsMinimized(true);
    window.addEventListener('admin:open', onAdminOpen);
    return () => window.removeEventListener('admin:open', onAdminOpen);
  }, []);

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
      // Bot response happens instantly via real-time listener - no artificial delay needed
    } catch (error: any) {
      console.error('Error sending message:', error);
      const msg: string = error?.message || 'Failed to send message';
      // Parse rate limit message: "Try again in Ns"
      const match = msg.match(/Try again in (\d+)s/i);
      if (match) {
        const seconds = parseInt(match[1], 10);
        setRateInfo((prev) => ({
          remaining: 0,
          limit: prev?.limit || 10,
          windowSec: prev?.windowSec || 60,
          blockedUntil: Date.now() + seconds * 1000,
        }));
      }
      alert(msg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasUnreadAdminMessages = chats.some((chat) => chat.takeoverBy);
  const hasIntelligentKb = kbPages.length > 0;

  // Floating CTA button (anchored to safe bottom-right area)
  if (!isOpen) {
    return !suppressButton ? (
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0)+16px)] right-4 md:right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 md:px-5 md:py-4 rounded-full shadow-2xl transition-all relative hover:scale-110 group"
          aria-label="Open chat"
          title="Chat with us"
        >
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 mr-2 inline" />
          <span className="font-luxury-semibold text-base md:text-lg align-middle">CHAT</span>
          {hasIntelligentKb && (
            <Sparkles className="w-3 h-3 absolute -top-1 -left-1 text-yellow-300 animate-pulse" title="AI-Powered" />
          )}
          {hasUnreadAdminMessages ? (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" title="Admin replied!" />
          ) : chats.length > 0 ? (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">{chats.length}</span>
          ) : null}
        </button>
      </div>
    ) : null;
  }

  const handleNewChat = () => {
    setCurrentChatId(null);
    setShowHistory(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowHistory(false);
  };

  const handleCloseChat = async () => {
    if (currentChatId && window.confirm('Close this chat? You can still view it in history.')) {
      await closeChat();
      setShowHistory(false);
    }
  };

  const currentChat = chats.find((c) => c.id === currentChatId);
  const hasAdminMessages = messages.some((m) => m.sender === 'admin');

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div ref={modalRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[96vw] max-w-lg md:max-w-2xl h-[75vh] md:h-[80vh] max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold">{currentChat?.title || 'Wasilah Assistant'}</h3>
            {hasIntelligentKb && (
              <span className="text-xs bg-yellow-400 text-blue-900 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3" />
                Smart
              </span>
            )}
            {hasAdminMessages && (
              <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">Admin replied</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className="hover:bg-blue-700 p-1 rounded transition-colors" aria-label="Chat history" title="Chat History">
              <Menu className="w-5 h-5" />
              {chats.length > 1 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{chats.length}</span>
              )}
            </button>
            <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-blue-700 p-1 rounded transition-colors" aria-label="Minimize">
              <Minimize2 className="w-5 h-5" />
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded transition-colors" aria-label="Close chat">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isMinimized ? null : (
          <div className="flex h-[calc(80vh-56px)]">
            {/* Chat History Sidebar */}
            {showHistory && (
              <div className="w-56 border-r flex flex-col">
                <div className="p-3 border-b bg-gray-50">
                  <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No chat history yet</div>
                  ) : (
                    <div className="divide-y">
                      {chats.map((chat) => (
                        <button key={chat.id} onClick={() => handleSelectChat(chat.id)} className={`w-full p-3 text-left hover:bg-blue-50 transition-colors ${currentChatId === chat.id ? 'bg-blue-100' : ''}`}>
                          <div className="text-sm font-medium text-gray-900 truncate">{chat.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{chat.lastActivityAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          {chat.takeoverBy && (<span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Admin active</span>)}
                          {!chat.isActive && (<span className="inline-block mt-1 ml-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Closed</span>)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <div className="relative inline-block mb-3">
                      <MessageCircle className="w-12 h-12 opacity-30" />
                      {hasIntelligentKb && (<Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />)}
                    </div>
                    <p className="text-sm font-semibold">Welcome to Wasilah Assistant!</p>
                    <p className="text-xs mt-1">{hasIntelligentKb ? '🤖 Ask me anything - I learn from our website!' : 'How can we help you today?'}</p>
                    
                    {/* Bot Capabilities & Limitations */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto text-left">
                      <p className="text-xs font-semibold text-blue-900 mb-2">ℹ️ What I can help with:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Information about Wasilah projects & events</li>
                        <li>• Volunteering opportunities & how to join</li>
                        <li>• Contact information & office locations</li>
                        <li>• General questions about our mission</li>
                      </ul>
                      <p className="text-xs font-semibold text-blue-900 mt-3 mb-1">⚡ Response Speed:</p>
                      <p className="text-xs text-blue-800">Instant responses from our knowledge base!</p>
                      <p className="text-xs font-semibold text-blue-900 mt-2 mb-1">📊 Usage Limit:</p>
                      <p className="text-xs text-blue-800">10 messages per minute (prevents spam)</p>
                      <p className="text-xs text-gray-600 mt-2 italic">💬 For complex queries, an admin can take over anytime!</p>
                    </div>
                    
                    {hasIntelligentKb && (
                      <div className="mt-4 space-y-2 max-w-xs mx-auto">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Quick questions:</p>
                        <button onClick={() => setInputText('What is Wasilah?')} className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors">💡 What is Wasilah?</button>
                        <button onClick={() => setInputText('How can I volunteer?')} className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors">🙋 How can I volunteer?</button>
                        <button onClick={() => setInputText('What projects do you run?')} className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors">🎯 What projects do you run?</button>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((message: Message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${message.sender === 'user' ? 'bg-blue-600 text-white' : message.sender === 'admin' ? 'bg-green-100 text-green-900 border border-green-300' : 'bg-white text-gray-900 shadow-md'}`}>
                      {message.sender === 'admin' && (
                        <div className="text-xs font-semibold mb-1 text-green-700 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Admin
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                      {message.sender === 'bot' && message.sourceUrl && (
                        <a href={message.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                          <ExternalLink className="w-3 h-3" />
                          Learn more: {message.sourcePage || 'Source'}
                        </a>
                      )}

                      {message.sender === 'bot' && message.confidence && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {Math.round(message.confidence * 100)}% confident
                        </div>
                      )}

                      {message.sender === 'bot' && message.needsAdmin && (
                        <button onClick={() => handleNotifyAdmin(message.text)} className="flex items-center gap-1 mt-2 px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors font-medium">
                          <Bell className="w-3 h-3" />
                          Notify Admin
                        </button>
                      )}

                      {/* Smart Suggestions - Show contextual follow-up questions */}
                      {message.sender === 'bot' && message.meta?.suggestions && message.meta.suggestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                            💡 You might also want to know:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.meta.suggestions.map((suggestion: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setInputText(suggestion)}
                                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs opacity-60 mt-1">{message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                {currentChatId && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{currentChat?.isActive ? 'Chat active' : 'Chat closed'}</span>
                    {currentChatId && (
                      <button onClick={handleCloseChat} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Close Chat
                      </button>
                    )}
                  </div>
                )}
                
                {/* Rate Limit Display */}
                {rateInfo && (
                  <div className="mb-2 px-2 py-1 bg-blue-50 rounded text-xs flex items-center justify-between">
                    <span className="text-blue-700">
                      {rateInfo.blockedUntil && rateInfo.blockedUntil > Date.now() ? (
                        <>⏳ Rate limit reached. Wait {Math.max(0, Math.ceil((rateInfo.blockedUntil - Date.now()) / 1000))}s</>
                      ) : rateInfo.remaining > 0 ? (
                        <>⚡ {rateInfo.remaining}/{rateInfo.limit} messages left this minute</>
                      ) : (
                        <>✅ Ready to send messages</>
                      )}
                    </span>
                    {rateInfo.remaining <= 2 && rateInfo.remaining > 0 && !rateInfo.blockedUntil && (
                      <span className="text-orange-600 font-semibold">Low!</span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    disabled={isTyping}
                  />
                  <button onClick={handleSend} disabled={!inputText.trim() || isTyping} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors" aria-label="Send message">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Helper text */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {hasIntelligentKb ? '🤖 Instant AI responses from our knowledge base' : '💬 Ask anything about Wasilah'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
