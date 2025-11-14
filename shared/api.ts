/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Chat Types
export interface ConversationSummaryDto {
  conversationId: string;
  currentUserId: string;
  partnerId: string;
  partnerName: string | null;
  partnerAvatarUrl: string | null;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageAt: string;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  isBlocked: boolean;
}

export interface ConversationDetailDto {
  conversationId: string;
  user1Id: string;
  user2Id: string;
  lastMessageAt: string;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  user1UnreadCount: number;
  user2UnreadCount: number;
  isArchivedByUser1: boolean;
  isArchivedByUser2: boolean;
  isMutedByUser1: boolean;
  isMutedByUser2: boolean;
  isBlocked: boolean;
  blockedByUserId: string | null;
  blockedAt: string | null;
  messages: MessageDto[];
}

export interface MessageOrderAttachmentDto {
  orderId: string;
  totalAmount: number;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
}

export interface MessageProductAttachmentDto {
  productId: string;
  name: string;
  price: number;
  thumbnailUrl: string | null;
  shopId: string;
  shopName: string | null;
}

export interface MessageDto {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  senderAvatarUrl: string | null;
  content: string;
  type: string;
  attachmentUrl: string | null;
  metadata: string | null;
  orderAttachment: MessageOrderAttachmentDto | null;
  productAttachment: MessageProductAttachmentDto | null;
  isRead: boolean;
  readAt: string | null;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  replyToMessageId: string | null;
  replyToMessage: MessageDto | null;
}

export interface CreateConversationRequest {
  targetUserId: string;
}

export interface SendMessageRequest {
  content: string;
  type?: string;
  attachmentUrl?: string;
  metadata?: string;
  replyToMessageId?: string;
  orderId?: string;
  productId?: string;
}

export interface EditMessageRequest {
  content: string;
  attachmentUrl?: string;
  metadata?: string;
}

export interface MarkMessagesReadRequest {
  upTo?: string;
}

export interface UpdateConversationPreferenceRequest {
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface ServiceResponse<T = any> {
  succeeded: boolean;
  message: string;
  data?: T;
  statusCode?: number;
}