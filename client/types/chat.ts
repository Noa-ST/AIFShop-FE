export type MessageType =
  | "Text"
  | "Image"
  | "File"
  | "System"
  | "Order"
  | "Product";

export type MessageAttachmentOrder = {
  orderId: string;
  totalAmount: number;
  status: string;
  paymentStatus?: string | null;
  createdAt: string;
};

export type MessageAttachmentProduct = {
  productId: string;
  name: string;
  price: number;
  thumbnailUrl?: string | null;
  shopId?: string | null;
  shopName?: string | null;
};

export type MessageMetadata = Record<string, unknown> | null;

export interface MessageDto {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  content?: string | null;
  type: MessageType;
  attachmentUrl?: string | null;
  metadata?: MessageMetadata;
  orderAttachment?: MessageAttachmentOrder | null;
  productAttachment?: MessageAttachmentProduct | null;
  isRead: boolean;
  readAt?: string | null;
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  replyToMessageId?: string | null;
  replyToMessage?: MessageDto | null;
}

export interface ConversationParticipant {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

export interface ConversationSummaryDto {
  conversationId: string;
  participants: ConversationParticipant[];
  lastMessageId?: string | null;
  lastMessageContent?: string | null;
  lastMessageAt?: string | null;
  lastMessageSenderId?: string | null;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface ConversationDetailDto {
  conversation: ConversationSummaryDto;
  messages: MessageDto[];
  page: number;
  pageSize: number;
  totalItems?: number;
  hasMore?: boolean;
}

export type MessagesReadEvent = {
  conversationId: string;
  readerId: string;
  messageIds: string[];
  user1UnreadCount?: number;
  user2UnreadCount?: number;
};

export type ConversationUpdatedEvent = ConversationSummaryDto;

export type SendMessageRequest = {
  content?: string | null;
  type?: MessageType;
  attachmentUrl?: string | null;
  metadata?: MessageMetadata;
  replyToMessageId?: string | null;
  orderId?: string | null;
  productId?: string | null;
};

export type ConversationPreferencesUpdate = {
  isArchived?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
};


