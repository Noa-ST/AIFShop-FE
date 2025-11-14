import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ConversationSummaryDto } from "@/types/chat";
import type { ChatHubConnectionState } from "@/hooks/useChatHubClient";
import { HubConnectionState } from "@microsoft/signalr";
import { Loader2, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";

type ConversationListProps = {
  conversations: ConversationSummaryDto[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading: boolean;
  connectionState: ChatHubConnectionState;
  currentUserId?: string | null;
};

const connectionStateText: Record<HubConnectionState, string> = {
  [HubConnectionState.Disconnected]: "Đã ngắt kết nối",
  [HubConnectionState.Connecting]: "Đang kết nối...",
  [HubConnectionState.Connected]: "Đã kết nối",
  [HubConnectionState.Disconnecting]: "Đang ngắt...",
  [HubConnectionState.Reconnecting]: "Đang kết nối lại...",
};

const connectionStateClass: Record<HubConnectionState, string> = {
  [HubConnectionState.Disconnected]: "bg-rose-100 text-rose-600",
  [HubConnectionState.Connecting]: "bg-amber-100 text-amber-600",
  [HubConnectionState.Connected]: "bg-emerald-100 text-emerald-600",
  [HubConnectionState.Disconnecting]: "bg-amber-100 text-amber-600",
  [HubConnectionState.Reconnecting]: "bg-amber-100 text-amber-600",
};

const renderLastMessage = (conversation: ConversationSummaryDto) => {
  if (conversation.lastMessageContent) return conversation.lastMessageContent;
  return "Chưa có tin nhắn";
};

const formatConversationTitle = (
  conversation: ConversationSummaryDto,
  currentUserId?: string | null,
) => {
  if (!conversation.participants?.length) return "Khách hàng";
  const other = conversation.participants.find(
    (participant) => participant.userId !== currentUserId,
  );
  return other?.displayName ?? other?.userId ?? conversation.participants[0]?.displayName ?? conversation.participants[0]?.userId ?? "Khách hàng";
};

const formatLastMessageTime = (conversation: ConversationSummaryDto) => {
  if (!conversation.lastMessageAt) return "";
  try {
    return new Date(conversation.lastMessageAt).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return conversation.lastMessageAt;
  }
};

export const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading,
  connectionState,
  currentUserId,
}: ConversationListProps) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return conversations;
    return conversations.filter((conversation) => {
      const title = formatConversationTitle(conversation, currentUserId).toLowerCase();
      const preview = renderLastMessage(conversation).toLowerCase();
      return title.includes(lower) || preview.includes(lower);
    });
  }, [conversations, currentUserId, query]);

  return (
    <div className="flex h-full flex-col border-r border-rose-100 bg-rose-50/40">
      <div className="border-b border-rose-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-rose-600">Hội thoại</h2>
          <Badge className={cn("text-xs", connectionStateClass[connectionState.status])}>
            {connectionStateText[connectionState.status]}
          </Badge>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm kiếm khách hàng hoặc nội dung..."
          className="border-rose-200 focus-visible:ring-rose-400"
        />
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-rose-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-rose-300">
            <MessageSquare className="h-10 w-10" />
            <p>Chưa có hội thoại nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conversation) => {
              const isActive = activeConversationId === conversation.conversationId;
              const title = formatConversationTitle(conversation, currentUserId);
              return (
                <button
                  key={conversation.conversationId}
                  onClick={() => onSelectConversation(conversation.conversationId)}
                  className={cn(
                    "w-full rounded-2xl border border-transparent bg-white p-4 text-left shadow-sm transition-all",
                    "hover:border-rose-200 hover:shadow-md",
                    isActive &&
                      "border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 shadow-md",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-rose-600">{title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {renderLastMessage(conversation)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-gray-400">
                        {formatLastMessageTime(conversation)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-rose-500 text-white">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {conversation.isMuted && (
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-amber-500">
                      Đã tắt thông báo
                    </p>
                  )}
                  {conversation.isBlocked && (
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-rose-500">
                      Đang chặn
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};


