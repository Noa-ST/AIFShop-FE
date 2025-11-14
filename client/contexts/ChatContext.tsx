import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import chatService from '@/services/chatService';
import type { ConversationSummaryDto, MessageDto } from '@shared/api';
import { useAuth } from '@/contexts/AuthContext';
import { useChatHubClient } from '@/hooks/useChatHubClient';
import type { ChatHubEvents } from '@/services/chatHubClient';
import axiosClient from '@/services/axiosClient';

interface ChatContextType {
  conversations: ConversationSummaryDto[];
  currentConversation: string | null;
  messages: Record<string, MessageDto[]>; // conversationId -> messages
  unreadCount: number;
  loading: boolean;
  isEnabled: boolean;
  sendMessage: (
    conversationId: string,
    content: string,
    type?: string,
    productId?: string,
  ) => Promise<boolean>;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  enableChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, MessageDto[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  
  // Determine SignalR base URL: use relative path in dev (for Vite proxy) or full URL for remote backend
  const signalRBaseUrl = useMemo(() => {
    const apiBaseUrl = axiosClient.defaults.baseURL;
    const isDev = import.meta.env.DEV;
    const isLocalhost = apiBaseUrl && (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1'));
    
    // In development mode with localhost backend, use relative path to leverage Vite proxy
    // Otherwise, use the full API base URL (for remote backend or production)
    if (isDev && isLocalhost) {
      // Local development - use relative path so Vite proxy handles it
      return undefined;
    }
    // Remote backend or production - use full URL
    return apiBaseUrl || undefined;
  }, []);

  // Decide whether to force WebSockets (skip negotiation) for remote backends
  const forceWebSockets = useMemo(() => {
    const apiBaseUrl = axiosClient.defaults.baseURL ?? '';
    const isLocal = apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1');
    const envForce = (import.meta.env.VITE_SIGNALR_FORCE_WEBSOCKETS ?? 'false').toString().toLowerCase() === 'true';
    // Default: force WS when not local OR explicitly enabled by env
    return !isLocal || envForce;
  }, []);
  
  // Wire SignalR hub events to context when enabled
  const hubEvents: ChatHubEvents = {
    onReceiveMessage: (msg: any) => {
      const conversationId = msg?.conversationId;
      if (!conversationId) return;

      // Append the incoming message to local state
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), msg as MessageDto],
      }));

      // Refresh conversations to keep previews/unread accurate
      void loadConversations();
      void loadUnreadCount();
    },
    onConversationUpdated: (summary: any) => {
      const convId = summary?.conversationId;
      if (!convId) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.conversationId === convId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...summary } as ConversationSummaryDto;
          return next;
        }
        return [summary as ConversationSummaryDto, ...prev];
      });
    },
    onMessagesRead: (_payload: any) => {
      // Minimal: refresh unread counters
      void loadConversations();
      void loadUnreadCount();
    },
  };

  // Only enable SignalR when chat is enabled AND user is authenticated
  const shouldEnableSignalR = isEnabled && isAuthenticated;
  
  const { client } = useChatHubClient({ 
    enabled: shouldEnableSignalR, 
    events: hubEvents,
    baseUrl: signalRBaseUrl,
    forceWebSockets,
    skipNegotiation: forceWebSockets,
  });

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !isEnabled) return;
    
    setLoading(true);
    try {
      const response = await chatService.getConversations();
      if (response.succeeded && response.data) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isEnabled]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await chatService.getConversation(conversationId);
      if (response.succeeded && response.data) {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: response.data.messages,
        }));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    type: string = 'Text',
    productId?: string,
  ): Promise<boolean> => {
    try {
      const payload: { content: string; type?: string; productId?: string } = { content, type };
      if (productId) payload.productId = productId;
      const response = await chatService.sendMessage(conversationId, payload);
      if (response.succeeded && response.data) {
        // Add message to local state
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), response.data!],
        }));
        // Refresh conversations to update last message
        loadConversations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [loadConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await chatService.markMessagesRead(conversationId);
      loadConversations(); // Refresh to update unread count
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [loadConversations]);

  const loadUnreadCount = useCallback(async () => {
    if (!isEnabled || !isAuthenticated) return;
    try {
      const response = await chatService.getTotalUnreadCount();
      if (response.succeeded && response.data !== undefined) {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [isEnabled, isAuthenticated]);

  const enableChat = useCallback(() => {
    if (!isAuthenticated) return;
    setIsEnabled(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isEnabled) return;

    loadConversations();
    loadUnreadCount();

    // Polling for real-time updates (fallback if WebSocket not available)
    const interval = setInterval(() => {
      loadUnreadCount();
      if (currentConversation) {
        loadConversation(currentConversation);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, isEnabled, currentConversation, loadConversations, loadUnreadCount, loadConversation]);

  return (
    <ChatContext.Provider
      value={{
      conversations,
        currentConversation,
        messages,
        unreadCount,
        loading,
        isEnabled,
        sendMessage,
        loadConversations,
        loadConversation,
        markAsRead,
        enableChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

// Hook to automatically enable chat when component mounts
export function useEnableChatOnMount() {
  const { enableChat } = useChat();
  useEffect(() => {
    enableChat();
  }, [enableChat]);
}
