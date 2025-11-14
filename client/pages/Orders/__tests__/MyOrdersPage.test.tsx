import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MyOrdersPage from "@/pages/Orders/MyOrdersPage";
import { renderWithProviders } from "@/test/test-utils";
import type { OrderResponseDTO } from "@/services/types";

const mockUseOrderList = vi.fn();

vi.mock("@/hooks/use-orders", () => ({
  useOrderList: (...args: unknown[]) => mockUseOrderList(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "customer-1", email: "test@example.com", role: "Customer" },
    isAuthenticated: true,
    initialized: true,
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
  }),
}));

const orders: OrderResponseDTO[] = [
  {
    orderId: "ORD-123",
    status: "Pending",
    totalAmount: 150000,
    shopName: "Shop 1",
    customerName: "Khách A",
    createdAt: new Date().toISOString(),
    paymentStatus: "Pending",
  },
];

describe("MyOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrderList.mockReturnValue({
      data: orders,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("renders heading and order table", () => {
    renderWithProviders(<MyOrdersPage />);

    expect(
      screen.getByRole("heading", { name: "Đơn hàng của tôi" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ORD-123")).toBeInTheDocument();
    expect(screen.getByText("Shop 1")).toBeInTheDocument();
  });

  it("triggers refetch when clicking refresh button", async () => {
    const user = userEvent.setup();
    const refetchMock = vi.fn();
    mockUseOrderList.mockReturnValue({
      data: orders,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderWithProviders(<MyOrdersPage />);

    await user.click(screen.getByRole("button", { name: "Làm mới" }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});

