import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { filterProfanity, checkRateLimit, generateChatTitle } from '../utils/chatHelpers';
import { matchIntent, detectLanguage, adminOfferMessage, adminConfirmMessage } from '../utils/intents';

// Fast Multi-Language Matcher (optimized for speed and accuracy)
import { fastMatch, matchWithTiming } from '../utils/fastMatcher';
import { detectLanguage as detectLang, getResponse, getContextualEnding } from '../utils/multiLanguageResponses';

// Chat Enhancements (context, cache, suggestions, sentiment)
import { 
  ResponseCache, 
  ConversationContext, 
  correctTypos, 
  detectSentiment, 
  enhanceResponseBySentiment,
  getSmartSuggestions
} from '../utils/chatEnhancements';

// KB Matcher (fallback)
import * as kbMatcher from '../utils/kbMatcher';
const findBestMatchKb: any = kbMatcher?.findBestMatch;
const formatResponse: any = kbMatcher?.formatResponse;

// Local KB Service (no Firestore needed - works on Spark plan)
import { getEnhancedKB } from '../services/localKbService';
// Smart KB with auto-learning
import { getSmartKB } from '../services/autoLearnService';

// Legacy imports
let findBestMatch: any = null;
let truncateAnswer: any = null;
try {
  const legacyMatch = require('../utils/matchKb');
  findBestMatch = legacyMatch.findBestMatch;
  truncateAnswer = legacyMatch.truncateAnswer;
} catch (e) {
  // Legacy FAQ system not available - using enhanced KB service instead
}

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  createdAt: Date;
  meta?: Record<string, any>;
}

interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
  takeoverBy?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
}

export function useChat(userId: string | null, chatId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [faqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [isTakeover, setIsTakeover] = useState(false);
  const [kbPages, setKbPages] = useState<any[]>([]);
  
  // Debounce timer for lastActivityAt updates to prevent write queue exhaustion
  const activityUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActivityUpdatesRef = useRef<Set<string>>(new Set());

  // Sync chatId parameter with internal state
  useEffect(() => {
    if (chatId !== undefined) {
      setCurrentChatId(chatId);
    }
  }, [chatId]);
  
  // Debounced activity update to prevent write queue exhaustion
  const updateChatActivity = useCallback((chatIdToUpdate: string) => {
    if (!userId) return;
    
    pendingActivityUpdatesRef.current.add(chatIdToUpdate);
    
    // Clear existing timer
    if (activityUpdateTimerRef.current) {
      clearTimeout(activityUpdateTimerRef.current);
    }
    
    // Batch activity updates every 2 seconds to reduce writes
    activityUpdateTimerRef.current = setTimeout(async () => {
      const chatIds = Array.from(pendingActivityUpdatesRef.current);
      pendingActivityUpdatesRef.current.clear();
      
      if (chatIds.length === 0) return;
      
      try {
        // Use batch writes to update multiple chats efficiently
        const batch = writeBatch(db);
        chatIds.forEach((id) => {
          const chatRef = doc(db, `users/${userId}/chats/${id}`);
          batch.update(chatRef, { lastActivityAt: serverTimestamp() });
        });
        await batch.commit();
      } catch (error) {
        console.error('Error updating chat activity:', error);
      }
    }, 2000); // Debounce for 2 seconds
  }, [userId]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (activityUpdateTimerRef.current) {
        clearTimeout(activityUpdateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, `users/${userId}/chats`);
    const q = query(chatsRef, orderBy('lastActivityAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatList.push({
          id: doc.id,
          title: data.title,
          createdAt: (data.createdAt?.toDate && typeof data.createdAt.toDate === 'function') 
            ? data.createdAt.toDate() 
            : new Date(),
          lastActivityAt: (data.lastActivityAt?.toDate && typeof data.lastActivityAt.toDate === 'function') 
            ? data.lastActivityAt.toDate() 
            : new Date(),
          isActive: data.isActive ?? true,
          takeoverBy: data.takeoverBy,
        });
      });
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Load KB pages for intelligent matching from local data (no Firestore needed)
  useEffect(() => {
    const loadKb = () => {
      try {
        // Load smart KB that combines manual + auto-learned content
        // Auto-learns from website pages automatically like ChatGPT
        const pages = getSmartKB();
        setKbPages(pages);
        console.log(`🤖 Loaded ${pages.length} KB pages (smart auto-learning enabled)`);
      } catch (error) {
        console.error('Error loading KB:', error);
        // Fallback to manual KB
        const fallbackPages = getEnhancedKB();
        setKbPages(fallbackPages);
        console.log(`⚠️ Using fallback KB with ${fallbackPages.length} pages`);
      }
    };
    loadKb();
  }, []);

  useEffect(() => {
    if (!userId || !currentChatId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, `users/${userId}/chats/${currentChatId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messageList.push({
          id: doc.id,
          sender: data.sender,
          text: data.text,
          createdAt: (data.createdAt?.toDate && typeof data.createdAt.toDate === 'function') 
            ? data.createdAt.toDate() 
            : new Date(),
          meta: data.meta,
        });
      });
      setMessages(messageList);

      const currentChat = chats.find((c) => c.id === currentChatId);
      setIsTakeover(!!currentChat?.takeoverBy);
    });

    return () => unsubscribe();
  }, [userId, currentChatId, chats]);

  const createNewChat = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (!userId) return null;

      try {
        const chatsRef = collection(db, `users/${userId}/chats`);
        const chatDoc = await addDoc(chatsRef, {
          title: generateChatTitle(firstMessage),
          createdAt: serverTimestamp(),
          lastActivityAt: serverTimestamp(),
          isActive: true,
          aiProvider: 'apifreellm',
        });

        return chatDoc.id;
      } catch (error) {
        console.error('Error creating chat:', error);
        return null;
      }
    },
    [userId]
  );

  const sendMessage = useCallback(
    async (text: string, isAdmin: boolean = false) => {
      if (!userId) return;

      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed && !isAdmin) {
        const seconds = Math.ceil(rateCheck.resetMs / 1000);
        throw new Error(
          `Rate limit reached: ${rateCheck.limit}/${Math.round(rateCheck.windowMs/1000)}s. Try again in ${seconds}s.`
        );
      }

      let filteredText = filterProfanity(text).trim();
      if (!filteredText) return;

      // Enhancement 1: Typo correction for better matching
      filteredText = correctTypos(filteredText);

      // Enhancement 2: Detect sentiment for context-aware responses
      const sentiment = detectSentiment(filteredText);

      // Enhancement 3: Detect language
      const userLanguage = detectLang(filteredText);

      console.log(`🤖 Processing: "${filteredText}" [${userLanguage}, ${sentiment}]`);

      let activeChatId = currentChatId;

      if (!activeChatId) {
        activeChatId = await createNewChat(filteredText);
        if (!activeChatId) throw new Error('Failed to create chat');
        setCurrentChatId(activeChatId);
      }

      const messagesRef = collection(db, `users/${userId}/chats/${activeChatId}/messages`);
      const chatRef = doc(db, `users/${userId}/chats/${activeChatId}`);

      // Use batch write to combine user message + chat update into single operation
      const batch = writeBatch(db);
      
      const userMessageRef = doc(messagesRef);
      batch.set(userMessageRef, {
        sender: isAdmin ? 'admin' : 'user',
        text: filteredText,
        createdAt: serverTimestamp(),
        meta: {
          rate: {
            remaining: rateCheck.remaining,
            limit: rateCheck.limit,
            windowMs: rateCheck.windowMs,
            resetMs: rateCheck.resetMs,
          }
        },
      });

      batch.update(chatRef, {
        lastActivityAt: serverTimestamp(),
        aiProvider: 'apifreellm',
      });
      
      await batch.commit();

      if (!isAdmin && !isTakeover) {
        // Immediate bot response with timeout protection
        (async () => {
          let botResponseText: string;
          let botMeta: any = {};
          
          // Set a timeout to prevent the bot from getting stuck (reduced to 5s for faster responses)
          const responseTimeout = setTimeout(async () => {
            console.warn('⚠️ Bot response timeout, sending fallback');
            const lang = detectLang(filteredText);
            const timeoutText = getResponse('timeout', lang);
            
            try {
              // Use batch write for bot response to reduce write operations
              const batch = writeBatch(db);
              const botMessageRef = doc(messagesRef);
              batch.set(botMessageRef, {
                sender: 'bot',
                text: timeoutText,
                createdAt: serverTimestamp(),
                meta: { needsAdmin: true, timeout: true, matchType: 'timeout' },
              });
              batch.update(chatRef, { lastActivityAt: serverTimestamp() });
              await batch.commit();
            } catch (err) {
              console.error('Error sending timeout response:', err);
            }
          }, 5000); // Reduced from 10s to 5s for faster timeout
          
          try {
            // Enhancement 4: Check response cache first (instant for common queries)
            const cachedResponse = ResponseCache.get(filteredText, userLanguage);
            if (cachedResponse) {
              botResponseText = enhanceResponseBySentiment(cachedResponse, sentiment, userLanguage);
              botMeta = {
                matchType: 'cached',
                confidence: 1.0,
                language: userLanguage,
                responseTime: 0,
                cached: true
              };
              console.log('⚡ Instant response from cache');
            }
            // 1) Ultra-fast multi-language matcher (optimized for speed & accuracy)
            // Handles English, Urdu, and Roman Urdu with <100ms response time
            else {
              const fastMatchResult = matchWithTiming(filteredText, kbPages);
              
              // Reduced confidence threshold from 0.4 to 0.3 for faster, more responsive matches
              if (fastMatchResult.result && fastMatchResult.result.confidence > 0.3) {
                // Enhancement 5: Apply sentiment-aware enhancements
                botResponseText = enhanceResponseBySentiment(
                  fastMatchResult.result.text,
                  sentiment,
                  userLanguage
                );
                
                botMeta = {
                  matchType: fastMatchResult.result.matchType,
                  confidence: fastMatchResult.result.confidence,
                  language: fastMatchResult.result.language,
                  responseTime: fastMatchResult.performance.totalTime,
                  sentiment,
                  optimized: true
                };
                
                // Enhancement 6: Cache successful responses
                ResponseCache.set(filteredText, fastMatchResult.result.text, userLanguage);
                
                // Enhancement 7: Add to conversation context
                ConversationContext.add(filteredText, fastMatchResult.result.text);
                
                console.log(`⚡ Fast match in ${fastMatchResult.performance.totalTime.toFixed(2)}ms (${fastMatchResult.result.matchType})`);
              }
              // 2) Quick intent-based replies (fallback for edge cases)
              else {
                const intent = matchIntent(filteredText);
                if (intent.handled) {
                  botResponseText = intent.reply!;
                  botMeta = { matchType: 'intent' };
                }
                // 3) Traditional KB matching (fallback for complex queries)
                else if (kbPages.length > 0 && typeof findBestMatchKb === 'function' && typeof formatResponse === 'function') {
                  console.log('🤖 Using traditional KB matching (fallback)');
                  const match = findBestMatchKb(filteredText, kbPages, 0.12);
                  const response = formatResponse(match);
                  
                  botResponseText = (response.text || '').trim();
                  if (botResponseText.length < 10) {
                    const lang = detectLang(filteredText);
                    botResponseText = getResponse('howToVolunteer', lang);
                    botMeta = { needsAdminOffer: true, matchType: 'fallback' };
                  } else {
                    botMeta = {
                      sourceUrl: response.sourceUrl,
                      sourcePage: response.sourcePage,
                      confidence: response.confidence,
                      needsAdmin: response.needsAdmin,
                      matchType: 'traditional'
                    };
                  }
                }
                // 4) Fallback to legacy FAQ matching
                else if (faqs.length > 0 && findBestMatch && truncateAnswer) {
                  console.log('📚 Using legacy FAQ matching');
                  const recentMessages = messages.slice(-6);
                  const context = recentMessages.map((m) => m.text).join(' ');
                  const searchQuery = `${context} ${filteredText}`;
                  const match = findBestMatch(searchQuery, faqs);

                  if (match) {
                    botResponseText = truncateAnswer(match.answer, 800);
                    if (match.answer.length > 800) {
                      botResponseText += '\n\n[Read more in our FAQ section]';
                    }
                    botMeta = { faqId: match.id, matchType: 'legacy' };
                  } else {
                    const lang = detectLang(filteredText);
                    botResponseText = getResponse('adminOffer', lang);
                    botMeta = { needsAdminOffer: true, matchType: 'legacy' };
                  }
                }
                // No matching system available
                else {
                  const lang = detectLang(filteredText);
                  botResponseText = getResponse('adminOffer', lang);
                  botMeta = { needsAdminOffer: true, matchType: 'none' };
                }
              }
            }


            // If user says 'yes' after an admin offer, auto-route to admin
            const lastBot = messages.slice().reverse().find((m) => m.sender === 'bot');
            const userSaidYes = /^(yes|y|haan|han|جی|ہاں)$/i.test(filteredText.trim());
            if (lastBot && (lastBot.meta as any)?.needsAdminOffer && userSaidYes) {
              const lang = detectLang(filteredText);
              botResponseText = getResponse('adminConfirm', lang);
              botMeta = { needsAdmin: true, escalated: true };
            }

            // Clear timeout since we got a response
            clearTimeout(responseTimeout);
            
            // Ensure we don't save empty/undefined text
            if (botResponseText && botResponseText.trim().length > 0) {
              // Enhancement 8: Add smart suggestions for follow-up questions
              const suggestions = getSmartSuggestions(filteredText, userLanguage === 'ur-roman' ? 'ur-roman' : 'en');
              
              // Use batch write for bot response + activity update to reduce write operations
              const batch = writeBatch(db);
              const botMessageRef = doc(messagesRef);
              batch.set(botMessageRef, {
                sender: 'bot',
                text: botResponseText,
                createdAt: serverTimestamp(),
                meta: {
                  ...botMeta,
                  suggestions, // Add contextual suggestions
                },
              });
              
              batch.update(chatRef, { lastActivityAt: serverTimestamp() });
              await batch.commit();
              
              console.log('✅ Bot response sent with smart suggestions (batched write)');
            }
          } catch (error) {
            console.error('Bot response error:', error);
            clearTimeout(responseTimeout);
            
            // Fallback response on error
            const lang = detectLang(filteredText);
            const fallbackText = getResponse('timeout', lang);
            
            try {
              // Use batch write for error response
              const batch = writeBatch(db);
              const errorMessageRef = doc(messagesRef);
              batch.set(errorMessageRef, {
                sender: 'bot',
                text: fallbackText,
                createdAt: serverTimestamp(),
                meta: { needsAdmin: true, error: true, matchType: 'error' },
              });
              batch.update(chatRef, { lastActivityAt: serverTimestamp() });
              await batch.commit();
            } catch (batchError) {
              console.error('Error sending error response:', batchError);
            }
          }
        })();
      }
    },
    [userId, currentChatId, messages, faqs, kbPages, isTakeover, createNewChat]
  );

  const toggleTakeover = useCallback(
    async (adminId: string | null) => {
      if (!userId || !currentChatId) return;

      const chatRef = doc(db, `users/${userId}/chats/${currentChatId}`);
      await updateDoc(chatRef, {
        takeoverBy: adminId || null,
      });
    },
    [userId, currentChatId]
  );

  const closeChat = useCallback(async () => {
    if (!userId || !currentChatId) return;

    const chatRef = doc(db, `users/${userId}/chats/${currentChatId}`);
    await updateDoc(chatRef, {
      isActive: false,
    });

    setCurrentChatId(null);
  }, [userId, currentChatId]);

  return {
    messages,
    chats,
    loading,
    currentChatId,
    isTakeover,
    sendMessage,
    toggleTakeover,
    closeChat,
    setCurrentChatId,
  };
}
