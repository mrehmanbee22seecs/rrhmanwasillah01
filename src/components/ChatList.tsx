import React, { useState } from 'react';
import { MessageCircle, Plus, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';

const ChatList = () => {
  const { currentUser } = useAuth();
  const { chats, currentChatId, setCurrentChatId } = useChat(currentUser?.uid || null);
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const handleNewChat = () => {
    setCurrentChatId(null);
    setIsOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium">Chat History</span>
        {chats.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
            {chats.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Your Chats</h3>
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No chat history yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start a new conversation!
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        currentChatId === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {chat.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {chat.lastActivityAt.toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {chat.isActive ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">Closed</span>
                            </div>
                          )}
                          {chat.takeoverBy && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatList;
