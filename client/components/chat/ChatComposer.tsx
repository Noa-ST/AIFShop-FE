import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MessageDto, SendMessageRequest } from "@/types/chat";
import { X, PackageSearch, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type ChatComposerProps = {
  disabled?: boolean;
  onSend: (payload: SendMessageRequest) => Promise<void>;
  replyingTo?: MessageDto | null;
  onCancelReply?: () => void;
};

const ComposerActionButton = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
      active
        ? "border-rose-400 bg-rose-50 text-rose-600 shadow-sm"
        : "border-rose-100 text-gray-500 hover:border-rose-200 hover:text-rose-600",
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

export const ChatComposer = ({
  disabled,
  onSend,
  replyingTo,
  onCancelReply,
}: ChatComposerProps) => {
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [productId, setProductId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderInput, setShowOrderInput] = useState(false);
  const [showProductInput, setShowProductInput] = useState(false);

  const resetComposer = () => {
    setMessage("");
    setIsSubmitting(false);
    setShowOrderInput(false);
    setShowProductInput(false);
    setOrderId("");
    setProductId("");
  };

  const handleSend = async () => {
    if (disabled || isSubmitting) return;
    const trimmed = message.trim();
    if (!trimmed && !orderId && !productId) return;

    setIsSubmitting(true);
    try {
      await onSend({
        content: trimmed || undefined,
        orderId: orderId || undefined,
        productId: productId || undefined,
        replyToMessageId: replyingTo?.messageId ?? undefined,
      });
      resetComposer();
      onCancelReply?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-rose-100 bg-white p-4">
      {replyingTo && (
        <div className="mb-3 flex items-start justify-between rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-rose-600">Trả lời {replyingTo.senderName}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {replyingTo.content || "Tin nhắn"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-3">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Nhập tin nhắn..."
            rows={3}
            className="resize-none border-rose-200 focus-visible:ring-rose-400"
            disabled={disabled}
          />
          {showOrderInput && (
            <div className="flex items-center gap-3">
              <Input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Nhập mã đơn hàng"
                className="flex-1 border-rose-200 focus-visible:ring-rose-400"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-rose-500"
                onClick={() => {
                  setOrderId("");
                  setShowOrderInput(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {showProductInput && (
            <div className="flex items-center gap-3">
              <Input
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                placeholder="Nhập mã sản phẩm"
                className="flex-1 border-rose-200 focus-visible:ring-rose-400"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-rose-500"
                onClick={() => {
                  setProductId("");
                  setShowProductInput(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2">
          <ComposerActionButton
            icon={PackageSearch}
            label="Đính kèm đơn"
            active={showOrderInput}
            onClick={() => setShowOrderInput((prev) => !prev)}
          />
          <ComposerActionButton
            icon={ShoppingBag}
            label="Đính kèm sản phẩm"
            active={showProductInput}
            onClick={() => setShowProductInput((prev) => !prev)}
          />
          <Button
            className="bg-rose-500 hover:bg-rose-600"
            onClick={handleSend}
            disabled={disabled || isSubmitting || (!message.trim() && !orderId && !productId)}
          >
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};


