import type { OrderResponseDTO } from "@/services/types";

// Compact status timeline for quick visual progress across order lifecycle
const STATUS_STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"] as const;

export function OrderStatusTimeline({ status }: { status: OrderResponseDTO["status"] }) {
  if (status === "Canceled") {
    return <div className="text-[11px] text-destructive">Đã hủy</div>;
  }

  const currentIndex = STATUS_STEPS.indexOf(status as any);
  return (
    <div className="flex items-center gap-1.5">
      {STATUS_STEPS.map((_, idx) => (
        <div key={idx} className="flex items-center">
          <div
            className={`h-1.5 w-1.5 rounded-full ${idx <= currentIndex ? "bg-primary" : "bg-muted"}`}
          />
          {idx < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 w-6 ${idx < currentIndex ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default OrderStatusTimeline;