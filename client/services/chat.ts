import axiosClient from "@/services/axiosClient";
import {
  assertServiceSuccess,
  type ServiceResponse,
} from "@/services/types";
import type {
  ConversationDetailDto,
  ConversationPreferencesUpdate,
  ConversationSummaryDto,
  MessageDto,
  PaginatedResult,
  SendMessageRequest,
} from "@/types/chat";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

export type ConversationListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type ConversationMessagesParams = {
  messagePage?: number;
  pageSize?: number;
};

export const getConversations = async (
  params: ConversationListParams = {},
): Promise<PaginatedResult<ConversationSummaryDto>> => {
  const response = await axiosClient.get<
    ServiceResponse<PaginatedResult<ConversationSummaryDto>>
  >("/api/Chat/conversations", {
    params,
  });

  return assertServiceSuccess(
    response.data,
    "Không thể tải danh sách hội thoại",
  );
};

export const getConversationDetail = async (
  conversationId: string,
  params: ConversationMessagesParams = {},
): Promise<ConversationDetailDto> => {
  const response = await axiosClient.get<
    ServiceResponse<ConversationDetailDto>
  >(`/api/Chat/conversations/${conversationId}`, {
    params,
  });

  return assertServiceSuccess(
    response.data,
    "Không thể tải chi tiết hội thoại",
  );
};

export const createConversation = async (
  targetUserId: string,
): Promise<ConversationSummaryDto> => {
  const response = await axiosClient.post<
    ServiceResponse<ConversationSummaryDto>
  >("/api/Chat/conversations", {
    targetUserId,
  });

  return assertServiceSuccess(
    response.data,
    "Không thể tạo hội thoại mới",
  );
};

export const sendMessage = async (
  conversationId: string,
  payload: SendMessageRequest,
): Promise<MessageDto> => {
  const response = await axiosClient.post<ServiceResponse<MessageDto>>(
    `/api/Chat/conversations/${conversationId}/messages`,
    payload,
  );

  return assertServiceSuccess(response.data, "Gửi tin nhắn thất bại");
};

export const markConversationRead = async (
  conversationId: string,
  payload?: { upTo?: string | null },
): Promise<void> => {
  await axiosClient.put<ServiceResponse<unknown>>(
    `/api/Chat/conversations/${conversationId}/read`,
    payload ?? {},
  );
};

export const updateConversationPreferences = async (
  conversationId: string,
  payload: ConversationPreferencesUpdate,
): Promise<ConversationSummaryDto> => {
  const response = await axiosClient.patch<
    ServiceResponse<ConversationSummaryDto>
  >(`/api/Chat/conversations/${conversationId}/preferences`, payload);

  return assertServiceSuccess(
    response.data,
    "Không thể cập nhật trạng thái hội thoại",
  );
};

export const joinConversation = async (
  connection: HubConnection,
  conversationId: string,
) => connection.invoke("JoinConversation", conversationId);

export const leaveConversation = async (
  connection: HubConnection,
  conversationId: string,
) => connection.invoke("LeaveConversation", conversationId);

export type SignalRConnectionFactory = () => HubConnection;

export const CHAT_HUB_PATH = "/hubs/chat";

export const createChatHubConnection = (
  options: Readonly<{
    baseUrl?: string;
    accessTokenFactory: () => string | null | undefined;
    automaticReconnect?: boolean;
  }>
): HubConnection => {
  const builder = new HubConnectionBuilder().withUrl(
    options.baseUrl
      ? `${options.baseUrl.replace(/\/$/, "")}${CHAT_HUB_PATH}`
      : CHAT_HUB_PATH,
    {
      accessTokenFactory: () => options.accessTokenFactory() ?? "",
    },
  );

  if (options.automaticReconnect !== false) {
    builder.withAutomaticReconnect();
  }

  return builder.configureLogging(LogLevel.Information).build();
};

