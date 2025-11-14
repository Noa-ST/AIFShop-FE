import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import type { MessageDto } from "@/types/chat";
import { Loader2 } from "lucide-react";

type ChatMessageListProps = {
  messages: MessageDto[];
  activeConversationId: string | null;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onReply: (message: MessageDto) => void;
  currentUserId?: string | null;
  onOpenOrder?: (orderId: string) => void;
  onOpenProduct?: (productId: string) => void;
};

export const ChatMessageList = ({
  messages,
  activeConversationId,
  hasMore,
  isLoading,
  onLoadMore,
  onReply,
  currentUserId,
  onOpenOrder,
  onOpenProduct,
}: ChatMessageListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const latestMessageId = messages.at(-1)?.messageId;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [latestMessageId, activeConversationId]);

  const groupedMessages = useMemo(() => {
    return messages.reduce<Array<{ date: string; messages: MessageDto[] }>>(
      (acc, message) => {
        const dateKey = new Date(message.createdAt).toLocaleDateString("vi-VN");
        const group = acc.find((item) => item.date === dateKey);
        if (group) {
          group.messages.push(message);
        } else {
          acc.push({ date: dateKey, messages: [message] });
        }
        return acc;
      },
      [],
    );
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-rose-100 bg-white px-6 py-4">
        <h3 className="text-lg font-semibold text-rose-600">Tin nhắn</h3>
        <p className="text-xs text-gray-400">
          {messages.length > 0
            ? `${messages.length} tin nhắn`
            : "Chưa có tin nhắn nào"}
        </p>
      </div>
      <ScrollArea className="flex-1" viewportRef={scrollContainerRef}>
        <div className="flex flex-col gap-6 px-6 py-6">
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                  </>
                ) : (
                  "Tải thêm tin nhắn"
                )}
              </Button>
            </div>
          )}
          {groupedMessages.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-sm text-rose-300">
              <p>Bắt đầu trò chuyện với khách hàng của bạn</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date} className="space-y-4">
                <div className="text-center text-xs uppercase tracking-wide text-gray-400">
                  {group.date}
                </div>
                {group.messages.map((message) => (
                  <MessageBubble
                    key={message.messageId}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    onReply={onReply}
                    onOpenOrder={onOpenOrder}
                    onOpenProduct={onOpenProduct}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};


