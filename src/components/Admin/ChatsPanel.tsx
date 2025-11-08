import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { Send, Search, ToggleLeft, ToggleRight } from 'lucide-react';

interface UserChat {
  userId: string;
  userName: string;
  userEmail: string;
  chats: {
    id: string;
    title: string;
    lastActivityAt: Date;
    isActive: boolean;
    takeoverBy?: string;
    unreadCount: number;
  }[];
}

export default function ChatsPanel() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserChat[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const {
    messages,
    isTakeover,
    sendMessage,
    toggleTakeover,
  } = useChat(selectedUserId, selectedChatId);

  useEffect(() => {
    loadAllChats();
  }, []);

  const loadAllChats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUserChats: UserChat[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const chatsRef = collection(db, `users/${userId}/chats`);
        const chatsQuery = query(chatsRef, orderBy('lastActivityAt', 'desc'));
        const chatsSnapshot = await getDocs(chatsQuery);

        const userChats = chatsSnapshot.docs.map((chatDoc) => {
          const chatData = chatDoc.data();
          return {
            id: chatDoc.id,
            title: chatData.title,
            lastActivityAt: chatData.lastActivityAt?.toDate() || new Date(),
            isActive: chatData.isActive ?? true,
            takeoverBy: chatData.takeoverBy,
            unreadCount: 0,
          };
        });

        if (userChats.length > 0) {
          allUserChats.push({
            userId,
            userName: userData.displayName || userData.email || 'Unknown User',
            userEmail: userData.email || '',
            chats: userChats,
          });
        }
      }

      setUsers(allUserChats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedUserId || !selectedChatId) return;

    try {
      await sendMessage(adminMessage, true);
      setAdminMessage('');
    } catch (error) {
      console.error('Error sending admin message:', error);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedUserId || !selectedChatId || !currentUser) return;

    try {
      await toggleTakeover(isTakeover ? null : currentUser.uid);
    } catch (error) {
      console.error('Error toggling takeover:', error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find((u) => u.userId === selectedUserId);
  const selectedChat = selectedUser?.chats.find((c) => c.id === selectedChatId);

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/4 border-r md:border-r border-b md:border-b-0 bg-gray-50 flex flex-col max-h-48 md:max-h-full">
        <div className="p-3 md:p-4 border-b bg-white">
          <h3 className="font-semibold mb-2 text-sm md:text-base">Users</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No chats found</div>
          ) : (
            filteredUsers.map((userChat) => (
              <button
                key={userChat.userId}
                onClick={() => {
                  setSelectedUserId(userChat.userId);
                  setSelectedChatId(userChat.chats[0]?.id || null);
                }}
                className={`w-full p-4 text-left border-b hover:bg-white transition-colors ${
                  selectedUserId === userChat.userId ? 'bg-white' : ''
                }`}
              >
                <div className="font-medium text-sm">{userChat.userName}</div>
                <div className="text-xs text-gray-500">{userChat.userEmail}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {userChat.chats.length} chat{userChat.chats.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="w-full md:w-1/4 border-r md:border-r border-b md:border-b-0 bg-gray-50 flex flex-col max-h-48 md:max-h-full">
        <div className="p-3 md:p-4 border-b bg-white">
          <h3 className="font-semibold text-sm md:text-base">Chats</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedUser ? (
            selectedUser.chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full p-4 text-left border-b hover:bg-white transition-colors ${
                  selectedChatId === chat.id ? 'bg-white' : ''
                }`}
              >
                <div className="font-medium text-sm">{chat.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {chat.lastActivityAt.toLocaleDateString()}
                </div>
                {chat.takeoverBy && (
                  <div className="text-xs text-green-600 mt-1">Admin Active</div>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">Select a user</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            <div className="p-3 md:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm md:text-base truncate">{selectedChat.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 truncate">{selectedUser?.userName}</p>
              </div>
              <button
                onClick={handleToggleTakeover}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm whitespace-nowrap ${
                  isTakeover
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isTakeover ? (
                  <>
                    <ToggleRight className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Takeover Active</span>
                    <span className="sm:hidden">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Enable Takeover</span>
                    <span className="sm:hidden">Enable</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-gray-100 text-gray-900'
                        : message.sender === 'admin'
                        ? 'bg-green-100 text-green-900 border border-green-300'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-60">
                      {message.sender === 'user'
                        ? 'User'
                        : message.sender === 'admin'
                        ? 'Admin'
                        : 'Bot'}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.createdAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAdminMessage();
                    }
                  }}
                  placeholder="Type admin message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendAdminMessage}
                  disabled={!adminMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to view messages
          </div>
        )}
      </div>
    </div>
  );
}
