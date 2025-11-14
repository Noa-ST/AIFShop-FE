import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/services/axiosClient";
import { createOrder, type CreateOrderPayload } from "@/services/orders";

vi.mock("@/services/axiosClient", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedAxios = axiosClient as unknown as {
  post: ReturnType<typeof vi.fn>;
};

describe("orders service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws an error when the backend reports failure", async () => {
    const payload: CreateOrderPayload = {
      shopId: "shop-1",
      cartItemIds: ["item-1"],
      paymentMethod: "COD",
    };

    mockedAxios.post.mockResolvedValue({
      data: {
        Succeeded: false,
        Data: null,
        Message: "Giỏ hàng không hợp lệ",
        StatusCode: 200,
      },
    });

    await expect(createOrder(payload)).rejects.toThrow("Giỏ hàng không hợp lệ");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/Order/create",
      payload,
    );
  });
});

