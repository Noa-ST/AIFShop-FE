import { Button } from "@/components/ui/button";
import { cn, formatCurrencyVND } from "@/lib/utils";
import type { MessageDto } from "@/types/chat";
import { Reply, Check, CheckCheck } from "lucide-react";
import { OrderAttachmentCard, ProductAttachmentCard } from "./AttachmentCards";

type MessageBubbleProps = {
  message: MessageDto;
  isOwn: boolean;
  onReply?: (message: MessageDto) => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenProduct?: (productId: string) => void;
};

const formatTimestamp = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const renderReplyPreview = (message: MessageDto["replyToMessage"]) => {
  if (!message) return null;
  const title = message.content
    ? message.content
    : message.orderAttachment
    ? `Đơn hàng ${message.orderAttachment.orderId.slice(0, 8)}`
    : message.productAttachment
    ? `Sản phẩm ${message.productAttachment.name}`
    : "Tin nhắn";

  return (
    <div className="mb-2 border-l-4 border-rose-200 bg-rose-50/60 px-3 py-2 text-xs text-gray-600">
      <p className="font-medium text-rose-600">Trả lời {message.senderName}</p>
      <p className="line-clamp-2 text-gray-600">{title}</p>
    </div>
  );
};

export const MessageBubble = ({
  message,
  isOwn,
  onReply,
  onOpenOrder,
  onOpenProduct,
}: MessageBubbleProps) => {
  const bubbleClasses = cn(
    "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
    isOwn
      ? "ml-auto bg-gradient-to-r from-rose-500 to-rose-600 text-white"
      : "mr-auto bg-white text-gray-800",
  );

  return (
    <div className="flex w-full flex-col">
      <div
        className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}
      >
        {!isOwn && (
          <img
            src={message.senderAvatarUrl ?? undefined}
            alt={message.senderName}
            className="h-8 w-8 rounded-full object-cover"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className={bubbleClasses}>
          {!isOwn && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">
              {message.senderName}
            </p>
          )}
          {renderReplyPreview(message.replyToMessage)}
          {message.content && (
            <p className={cn("whitespace-pre-wrap", isOwn ? "text-white" : "text-gray-800")}>{message.content}</p>
          )}
          {message.orderAttachment && (
            <div className="mt-3">
              <OrderAttachmentCard
                order={message.orderAttachment}
                onViewOrder={onOpenOrder}
              />
            </div>
          )}
          {message.productAttachment && (
            <div className="mt-3">
              <ProductAttachmentCard
                product={message.productAttachment}
                onViewProduct={onOpenProduct}
              />
            </div>
          )}
          {message.attachmentUrl && (
            <div className="mt-2 text-sm">
              <a
                href={message.attachmentUrl}
                className={cn(
                  "underline",
                  isOwn ? "text-rose-100 hover:text-white" : "text-rose-600 hover:text-rose-700",
                )}
                target="_blank"
                rel="noreferrer"
              >
                Tải tệp đính kèm
              </a>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span className={isOwn ? "text-rose-100" : "text-gray-400"}>
              {formatTimestamp(message.createdAt)}
            </span>
            <div className="flex items-center gap-1">
              {onReply && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-xs text-current hover:bg-white/20"
                  onClick={() => onReply(message)}
                >
                  <Reply className="h-3.5 w-3.5" />
                </Button>
              )}
              {isOwn && (
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide">
                  {message.isRead ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5" /> Đã xem
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Đã gửi
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


