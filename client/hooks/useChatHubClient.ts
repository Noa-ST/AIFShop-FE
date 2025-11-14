import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ChatHubClient,
  type ChatHubClientOptions,
  type ChatHubEvents,
  createChatHubClient,
} from "@/services/chatHubClient";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/services/axiosClient";
import { HubConnectionState } from "@microsoft/signalr";

export type UseChatHubClientOptions = Partial<ChatHubClientOptions> & {
  enabled?: boolean;
  events?: ChatHubEvents;
};

export type ChatHubConnectionState = {
  status: HubConnectionState;
  connectionId?: string;
  error?: Error;
};

const defaultState: ChatHubConnectionState = {
  status: HubConnectionState.Disconnected,
};

const defaultAccessTokenFactory = () =>
  (typeof window !== "undefined"
    ? window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    : null) ?? undefined;

export const useChatHubClient = (
  options: UseChatHubClientOptions = {},
) => {
  const { enabled = true } = options;
  const [client, setClient] = useState<ChatHubClient | null>(null);
  const [state, setState] = useState<ChatHubConnectionState>(defaultState);
  const eventsRef = useRef<ChatHubEvents | undefined>(options.events);

  const mergedOptions: ChatHubClientOptions = useMemo(
    () => ({
      baseUrl: options.baseUrl,
      automaticReconnect: options.automaticReconnect,
      logLevel: options.logLevel,
      forceWebSockets: options.forceWebSockets,
      skipNegotiation: options.skipNegotiation,
      accessTokenFactory:
        options.accessTokenFactory ?? defaultAccessTokenFactory,
    }),
    [
      options.accessTokenFactory,
      options.automaticReconnect,
      options.baseUrl,
      options.forceWebSockets,
      options.skipNegotiation,
      options.logLevel,
    ],
  );

  useEffect(() => {
    eventsRef.current = options.events;
    if (client && eventsRef.current) {
      client.setHandlers({
        ...eventsRef.current,
        onReconnecting: (error) => {
          eventsRef.current?.onReconnecting?.(error);
          setState({
            status: HubConnectionState.Reconnecting,
            connectionId: client.connectionId ?? undefined,
            error,
          });
        },
        onReconnected: (connectionId) => {
          eventsRef.current?.onReconnected?.(connectionId);
          setState({
            status: HubConnectionState.Connected,
            connectionId: connectionId ?? client.connectionId ?? undefined,
          });
        },
        onClosed: (error) => {
          eventsRef.current?.onClosed?.(error);
          setState({
            status: HubConnectionState.Disconnected,
            connectionId: undefined,
            error,
          });
        },
      });
    }
  }, [client, options.events]);

  useEffect(() => {
    if (!enabled) {
      setState(defaultState);
      if (client) {
        client.stop().catch(() => undefined);
        setClient(null);
      }
      return () => {};
    }

    const chatClient = createChatHubClient(mergedOptions);
    eventsRef.current && chatClient.setHandlers(eventsRef.current);

    setClient(chatClient);
    let cancelled = false;

    const connect = async () => {
      try {
        await chatClient.start();
        if (!cancelled) {
          setState({
            status: HubConnectionState.Connected,
            connectionId: chatClient.connectionId ?? undefined,
          });
        }
      } catch (error: any) {
        if (!cancelled) {
          const errorMessage = error?.message || "Kết nối thất bại";
          const statusCode = error?.statusCode || error?.response?.status;
          
          // Log detailed error for debugging
          console.warn("SignalR connection error:", {
            message: errorMessage,
            statusCode,
            error,
          });
          
          // If it's an auth error (401/403), don't treat it as a fatal error
          // The chat will still work via polling
          if (statusCode === 401 || statusCode === 403) {
            console.info("SignalR requires authentication. Chat will use polling fallback.");
          } else if (statusCode === 500) {
            console.warn("SignalR server error. Check backend logs. Chat will use polling fallback.");
          }
          
          setState({
            status: HubConnectionState.Disconnected,
            error: error instanceof Error ? error : new Error(errorMessage),
          });
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      chatClient
        .stop()
        .catch(() => undefined)
        .finally(() => {
          setState(defaultState);
          setClient((current) => (current === chatClient ? null : current));
        });
    };
  }, [enabled, mergedOptions]);

  return {
    client,
    state,
  } as const;
};


