import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrderList } from "@/hooks/use-orders";
import { createWrapper } from "@/test/test-utils";
import type { OrderResponseDTO } from "@/services/types";

const mockGetAllOrders = vi.fn();
const mockGetMyOrders = vi.fn();
const mockGetShopOrders = vi.fn();

vi.mock("@/services/orders", () => ({
  createOrder: vi.fn(),
  getAllOrders: (...args: unknown[]) => mockGetAllOrders(...args),
  getMyOrders: (...args: unknown[]) => mockGetMyOrders(...args),
  getShopOrders: (...args: unknown[]) => mockGetShopOrders(...args),
  updateOrderStatus: vi.fn(),
}));

const sampleOrders: OrderResponseDTO[] = [
  {
    orderId: "ORD-1",
    status: "Pending",
    totalAmount: 120000,
    customerName: "Khách 1",
    shopName: "Shop A",
    createdAt: new Date().toISOString(),
  },
  {
    orderId: "ORD-2",
    status: "Confirmed",
    totalAmount: 220000,
    customerName: "Khách 1",
    shopName: "Shop A",
    createdAt: new Date().toISOString(),
  },
];

describe("useOrderList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyOrders.mockResolvedValue(sampleOrders);
    mockGetAllOrders.mockResolvedValue(sampleOrders);
    mockGetShopOrders.mockResolvedValue(sampleOrders);
  });

  it("fetches customer orders with provided id", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useOrderList({ scope: "customer", id: "customer-1" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockGetMyOrders).toHaveBeenCalledWith("customer-1");
  });

  it("filters orders by status when provided", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useOrderList({
          scope: "customer",
          id: "customer-1",
          status: "Confirmed",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveLength(1);
    });

    expect(result.current.data?.[0]?.status).toBe("Confirmed");
  });
});

