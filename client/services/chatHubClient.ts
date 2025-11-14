import type {
  ConversationSummaryDto,
  MessageDto,
  MessagesReadEvent,
} from "@/types/chat";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";

export type ChatHubEvents = {
  onReceiveMessage?: (message: MessageDto) => void;
  onConversationUpdated?: (summary: ConversationSummaryDto) => void;
  onMessagesRead?: (payload: MessagesReadEvent) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onClosed?: (error?: Error) => void;
};

export type ChatHubClientOptions = {
  baseUrl?: string;
  accessTokenFactory: () => string | null | undefined;
  automaticReconnect?: boolean;
  logLevel?: LogLevel;
  // Optional: force WebSockets transport and skip negotiation (useful for some proxies/CDNs)
  forceWebSockets?: boolean;
  skipNegotiation?: boolean;
};

const HUB_PATH = "/hubs/chat";

const resolveHubUrl = (baseUrl?: string) => {
  if (!baseUrl) return HUB_PATH;
  const normalized = baseUrl.replace(/\/$/, "");
  return `${normalized}${HUB_PATH}`;
};

export class ChatHubClient {
  private readonly connection: HubConnection;
  private handlers: ChatHubEvents = {};
  private isHandlersRegistered = false;

  constructor(private readonly options: ChatHubClientOptions) {
    const connectionOptions: any = {
      accessTokenFactory: () => options.accessTokenFactory() ?? "",
    };

    // Force WebSockets to avoid negotiation/proxy issues (e.g., on Render)
    if (options.forceWebSockets || options.skipNegotiation) {
      connectionOptions.transport = HttpTransportType.WebSockets;
      connectionOptions.skipNegotiation = true;
    }

    const builder = new HubConnectionBuilder()
      .withUrl(resolveHubUrl(options.baseUrl), connectionOptions)
      .configureLogging(options.logLevel ?? LogLevel.Information);

    if (options.automaticReconnect !== false) {
      builder.withAutomaticReconnect();
    }

    this.connection = builder.build();
  }

  public get state() {
    return this.connection.state;
  }

  public get connectionId() {
    return this.connection.connectionId;
  }

  public setHandlers(handlers: ChatHubEvents) {
    this.handlers = handlers;
    this.registerHandlers();
  }

  private registerHandlers() {
    if (this.isHandlersRegistered) {
      this.connection.off("ReceiveMessage");
      this.connection.off("ConversationUpdated");
      this.connection.off("MessagesRead");
    }

    this.connection.on("ReceiveMessage", (message: MessageDto) => {
      this.handlers.onReceiveMessage?.(message);
    });

    this.connection.on(
      "ConversationUpdated",
      (summary: ConversationSummaryDto) => {
        this.handlers.onConversationUpdated?.(summary);
      },
    );

    this.connection.on("MessagesRead", (payload: MessagesReadEvent) => {
      this.handlers.onMessagesRead?.(payload);
    });

    this.connection.onreconnecting((error) => {
      this.handlers.onReconnecting?.(error ?? undefined);
    });

    this.connection.onreconnected((connectionId) => {
      this.handlers.onReconnected?.(connectionId ?? undefined);
    });

    this.connection.onclose((error) => {
      this.handlers.onClosed?.(error ?? undefined);
    });

    this.isHandlersRegistered = true;
  }

  public async start() {
    if (this.connection.state === HubConnectionState.Connected) {
      return;
    }
    try {
      await this.connection.start();
    } catch (error: any) {
      // Log detailed error information
      console.error("SignalR connection failed:", {
        error: error?.message,
        status: error?.statusCode,
        response: error?.response,
        stack: error?.stack,
      });
      // Re-throw to let caller handle it
      throw error;
    }
  }

  public async stop() {
    if (
      this.connection.state === HubConnectionState.Disconnected ||
      this.connection.state === HubConnectionState.Disconnecting
    ) {
      return;
    }
    await this.connection.stop();
  }

  public async joinConversation(conversationId: string) {
    if (!conversationId) return;
    await this.connection.invoke("JoinConversation", conversationId);
  }

  public async leaveConversation(conversationId: string) {
    if (!conversationId) return;
    await this.connection.invoke("LeaveConversation", conversationId);
  }
}

export const createChatHubClient = (options: ChatHubClientOptions) =>
  new ChatHubClient(options);


