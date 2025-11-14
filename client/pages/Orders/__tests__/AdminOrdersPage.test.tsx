import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminOrdersPage from "@/pages/Orders/AdminOrdersPage";
import { renderWithProviders } from "@/test/test-utils";
import type { OrderResponseDTO } from "@/services/types";

const mockUseOrderList = vi.fn();
const mockUseOrderMutation = vi.fn();

vi.mock("@/hooks/use-orders", () => ({
  useOrderList: (...args: unknown[]) => mockUseOrderList(...args),
  useOrderMutation: () => mockUseOrderMutation(),
}));

const orders: OrderResponseDTO[] = [
  {
    orderId: "ORD-ADMIN-1",
    status: "Pending",
    totalAmount: 320000,
    customerName: "Khách hàng A",
    shopName: "Shop A",
    createdAt: new Date().toISOString(),
    paymentStatus: "Pending",
  },
];

describe("AdminOrdersPage", () => {
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

    mockUseOrderMutation.mockReturnValue({
      createOrderMutation: { mutate: vi.fn(), isSuccess: false },
      updateStatusMutation: {
        mutate: vi.fn(),
        isSuccess: false,
        isError: false,
        error: null,
        isPending: false,
      },
    });
  });

  it("opens the update dialog and submits the default transition", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminOrdersPage />);

    const updateButton = screen.getByRole("button", { name: "Cập nhật" });
    await user.click(updateButton);

    const confirmButton = await screen.findByRole("button", {
      name: "Xác nhận",
    });
    await user.click(confirmButton);

    const { updateStatusMutation } = mockUseOrderMutation.mock.results[0].value;
    expect(updateStatusMutation.mutate).toHaveBeenCalledWith({
      orderId: "ORD-ADMIN-1",
      status: "Confirmed",
    });
  });
});

