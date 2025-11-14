import axiosClient from '@/services/axiosClient';
import type {
  ConversationSummaryDto,
  ConversationDetailDto,
  MessageDto,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  MarkMessagesReadRequest,
  UpdateConversationPreferenceRequest,
  PagedResult,
  ServiceResponse,
} from '@shared/api';

class ChatService {
  private normalizeResponse<T>(raw: any): ServiceResponse<T> {
    const res: ServiceResponse<T> = {
      succeeded: raw?.succeeded ?? raw?.Succeeded ?? false,
      message: raw?.message ?? raw?.Message ?? "",
      data: raw?.data ?? raw?.Data ?? undefined,
      statusCode: raw?.statusCode ?? raw?.StatusCode ?? undefined,
    };
    return res;
  }

  private normalizeMessageDto(m: any): MessageDto {
    return {
      messageId: m.messageId ?? m.MessageId,
      conversationId: m.conversationId ?? m.ConversationId,
      senderId: m.senderId ?? m.SenderId,
      senderName: m.senderName ?? m.SenderName ?? null,
      senderAvatarUrl: m.senderAvatarUrl ?? m.SenderAvatarUrl ?? null,
      content: m.content ?? m.Content ?? null,
      type: m.type ?? m.Type ?? "Text",
      attachmentUrl: m.attachmentUrl ?? m.AttachmentUrl ?? null,
      metadata: m.metadata ?? m.Metadata ?? null,
      orderAttachment: m.orderAttachment ?? m.OrderAttachment ?? null,
      productAttachment: m.productAttachment ?? m.ProductAttachment ?? null,
      isRead: m.isRead ?? m.IsRead ?? false,
      readAt: m.readAt ?? m.ReadAt ?? null,
      isEdited: m.isEdited ?? m.IsEdited ?? false,
      editedAt: m.editedAt ?? m.EditedAt ?? null,
      isDeleted: m.isDeleted ?? m.IsDeleted ?? false,
      deletedAt: m.deletedAt ?? m.DeletedAt ?? null,
      createdAt: m.createdAt ?? m.CreatedAt,
      updatedAt: m.updatedAt ?? m.UpdatedAt ?? null,
      replyToMessageId: m.replyToMessageId ?? m.ReplyToMessageId ?? null,
      replyToMessage: m.replyToMessage
        ? this.normalizeMessageDto(m.replyToMessage)
        : (m.ReplyToMessage ? this.normalizeMessageDto(m.ReplyToMessage) : null),
    };
  }

  private normalizeConversationSummary(s: any): ConversationSummaryDto {
    return {
      conversationId: s.conversationId ?? s.ConversationId,
      currentUserId: s.currentUserId ?? s.CurrentUserId,
      partnerId: s.partnerId ?? s.PartnerId,
      partnerName: s.partnerName ?? s.PartnerName ?? null,
      partnerAvatarUrl: s.partnerAvatarUrl ?? s.PartnerAvatarUrl ?? null,
      lastMessageContent: s.lastMessageContent ?? s.LastMessageContent ?? null,
      lastMessageSenderId: s.lastMessageSenderId ?? s.LastMessageSenderId ?? null,
      lastMessageAt: s.lastMessageAt ?? s.LastMessageAt,
      unreadCount: s.unreadCount ?? s.UnreadCount ?? 0,
      isMuted: s.isMuted ?? s.IsMuted ?? false,
      isArchived: s.isArchived ?? s.IsArchived ?? false,
      isPinned: s.isPinned ?? s.IsPinned ?? false,
      isBlocked: s.isBlocked ?? s.IsBlocked ?? false,
    };
  }

  private normalizeConversationDetail(d: any): ConversationDetailDto {
    return {
      conversationId: d.conversationId ?? d.ConversationId,
      user1Id: d.user1Id ?? d.User1Id,
      user2Id: d.user2Id ?? d.User2Id,
      lastMessageAt: d.lastMessageAt ?? d.LastMessageAt,
      lastMessageContent: d.lastMessageContent ?? d.LastMessageContent ?? null,
      lastMessageSenderId: d.lastMessageSenderId ?? d.LastMessageSenderId ?? null,
      user1UnreadCount: d.user1UnreadCount ?? d.User1UnreadCount ?? 0,
      user2UnreadCount: d.user2UnreadCount ?? d.User2UnreadCount ?? 0,
      isArchivedByUser1: d.isArchivedByUser1 ?? d.IsArchivedByUser1 ?? false,
      isArchivedByUser2: d.isArchivedByUser2 ?? d.IsArchivedByUser2 ?? false,
      isMutedByUser1: d.isMutedByUser1 ?? d.IsMutedByUser1 ?? false,
      isMutedByUser2: d.isMutedByUser2 ?? d.IsMutedByUser2 ?? false,
      isBlocked: d.isBlocked ?? d.IsBlocked ?? false,
      blockedByUserId: d.blockedByUserId ?? d.BlockedByUserId ?? null,
      blockedAt: d.blockedAt ?? d.BlockedAt ?? null,
      messages: (d.messages ?? d.Messages ?? []).map(this.normalizeMessageDto.bind(this)),
    };
  }

  private normalizePagedResult<T>(raw: any, mapItem?: (x: any) => T): PagedResult<T> {
    const arr = raw?.data ?? raw?.Data ?? raw?.items ?? raw?.Items ?? [];
    const items = mapItem ? arr.map(mapItem) : arr;
    return {
      data: items,
      page: raw?.page ?? raw?.Page ?? 1,
      pageSize: raw?.pageSize ?? raw?.PageSize ?? (Array.isArray(items) ? items.length : 0),
      totalCount: raw?.totalCount ?? raw?.TotalCount ?? (Array.isArray(items) ? items.length : 0),
      totalPages: raw?.totalPages ?? raw?.TotalPages ?? undefined,
      hasPreviousPage: raw?.hasPreviousPage ?? raw?.HasPreviousPage ?? undefined,
      hasNextPage: raw?.hasNextPage ?? raw?.HasNextPage ?? undefined,
    };
  }

  // Get conversations list
  async getConversations(
    page: number = 1,
    pageSize: number = 20
  ): Promise<ServiceResponse<PagedResult<ConversationSummaryDto>>> {
    const response = await axiosClient.get(
      `/api/Chat/conversations?page=${page}&pageSize=${pageSize}`
    );
    const normalized = this.normalizeResponse<PagedResult<ConversationSummaryDto>>(response.data);
    if (normalized.data) {
      normalized.data = this.normalizePagedResult<ConversationSummaryDto>(
        normalized.data,
        this.normalizeConversationSummary.bind(this),
      );
    }
    return normalized;
  }

  // Get conversation detail
  async getConversation(
    conversationId: string,
    messagePage: number = 1,
    pageSize: number = 50
  ): Promise<ServiceResponse<ConversationDetailDto>> {
    const response = await axiosClient.get(
      `/api/Chat/conversations/${conversationId}?messagePage=${messagePage}&pageSize=${pageSize}`
    );
    const normalized = this.normalizeResponse<ConversationDetailDto>(response.data);
    if (normalized.data) {
      normalized.data = this.normalizeConversationDetail(normalized.data);
    }
    return normalized;
  }

  // Create conversation
  async createConversation(
    request: CreateConversationRequest
  ): Promise<ServiceResponse<ConversationSummaryDto>> {
    const response = await axiosClient.post('/api/Chat/conversations', request);
    const normalized = this.normalizeResponse<ConversationSummaryDto>(response.data);
    if (normalized.data) {
      normalized.data = this.normalizeConversationSummary(normalized.data);
    }
    return normalized;
  }

  // Send message
  async sendMessage(
    conversationId: string,
    request: SendMessageRequest
  ): Promise<ServiceResponse<MessageDto>> {
    const response = await axiosClient.post(
      `/api/Chat/conversations/${conversationId}/messages`,
      request
    );
    const normalized = this.normalizeResponse<MessageDto>(response.data);
    if (normalized.data) {
      normalized.data = this.normalizeMessageDto(normalized.data);
    }
    return normalized;
  }

  // Edit message
  async editMessage(
    messageId: string,
    request: EditMessageRequest
  ): Promise<ServiceResponse<MessageDto>> {
    const response = await axiosClient.put(`/api/Chat/messages/${messageId}`, request);
    return response.data;
  }

  // Delete message
  async deleteMessage(messageId: string): Promise<ServiceResponse<boolean>> {
    const response = await axiosClient.delete(`/api/Chat/messages/${messageId}`);
    return response.data;
  }

  // Mark messages as read
  async markMessagesRead(
    conversationId: string,
    request?: MarkMessagesReadRequest
  ): Promise<ServiceResponse<boolean>> {
    const response = await axiosClient.put(
      `/api/Chat/conversations/${conversationId}/read`,
      request || {}
    );
    return response.data;
  }

  // Update conversation preferences
  async updatePreferences(
    conversationId: string,
    request: UpdateConversationPreferenceRequest
  ): Promise<ServiceResponse<boolean>> {
    const response = await axiosClient.patch(
      `/api/Chat/conversations/${conversationId}/preferences`,
      request
    );
    return response.data;
  }

  // Delete conversation
  async deleteConversation(
    conversationId: string
  ): Promise<ServiceResponse<boolean>> {
    const response = await axiosClient.delete(
      `/api/Chat/conversations/${conversationId}`
    );
    return response.data;
  }

  // Search messages
  async searchMessages(
    conversationId: string,
    keyword: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ServiceResponse<PagedResult<MessageDto>>> {
    const response = await axiosClient.get(
      `/api/Chat/conversations/${conversationId}/messages/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`
    );
    const normalized = this.normalizeResponse<PagedResult<MessageDto>>(response.data);
    if (normalized.data) {
      normalized.data = this.normalizePagedResult<MessageDto>(
        normalized.data,
        this.normalizeMessageDto.bind(this),
      );
    }
    return normalized;
  }

  // Search conversations
  async searchConversations(
    keyword: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ServiceResponse<PagedResult<ConversationSummaryDto>>> {
    const response = await axiosClient.get(
      `/api/Chat/conversations/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  }

  // Get total unread count
  async getTotalUnreadCount(): Promise<ServiceResponse<number>> {
    const response = await axiosClient.get('/api/Chat/unread/count');
    return response.data;
  }

  // Helper: Format timestamp
  formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  // Helper: Check if message is from current user
  isMyMessage(message: MessageDto, currentUserId: string): boolean {
    return message.senderId === currentUserId;
  }
}

export const chatService = new ChatService();
export default chatService;

