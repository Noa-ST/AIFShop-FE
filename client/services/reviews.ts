import axiosClient from "@/services/axiosClient";
import type { PagedResult, ServiceResponse } from "@/services/types";

export type ReviewStatus = "Approved" | "Pending" | "Rejected";

export interface ReviewDto {
  id: string;
  productId: string;
  userId: string;
  userName?: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface MyReviewResponse {
  hasReviewed: boolean;
  review?: ReviewDto | null;
  status?: ReviewStatus | null;
  rejectionReason?: string | null;
}

export interface CreateReviewDto {
  productId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewDto {
  rating: number;
  comment: string;
}

class ReviewsService {
  async getProductReviews(
    productId: string,
    page: number = 1,
    pageSize: number = 10,
    onlyApproved: boolean = true,
  ): Promise<PagedResult<ReviewDto>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));
    params.append("onlyApproved", String(!!onlyApproved));
    const resp = await axiosClient.get(
      `/api/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
    );
    // API may return { data: {...} } or raw object
    return (resp.data?.data ?? resp.data) as PagedResult<ReviewDto>;
  }

  async getMyReview(productId: string): Promise<MyReviewResponse> {
    const resp = await axiosClient.get(
      `/api/products/${encodeURIComponent(productId)}/reviews/me`,
    );
    return (resp.data?.data ?? resp.data) as MyReviewResponse;
  }

  async create(review: CreateReviewDto): Promise<ServiceResponse<ReviewDto>> {
    const resp = await axiosClient.post(`/api/reviews`, review);
    return resp.data as ServiceResponse<ReviewDto>;
  }

  async update(id: string, dto: UpdateReviewDto): Promise<ServiceResponse<ReviewDto>> {
    const resp = await axiosClient.put(`/api/reviews/${encodeURIComponent(id)}`, dto);
    return resp.data as ServiceResponse<ReviewDto>;
  }

  async remove(id: string): Promise<ServiceResponse<null>> {
    const resp = await axiosClient.delete(`/api/reviews/${encodeURIComponent(id)}`);
    return resp.data as ServiceResponse<null>;
  }

  async approve(id: string): Promise<ServiceResponse<ReviewDto>> {
    const resp = await axiosClient.put(`/api/Admin/reviews/${encodeURIComponent(id)}/approve`);
    return resp.data as ServiceResponse<ReviewDto>;
  }

  async reject(id: string, reason?: string): Promise<ServiceResponse<ReviewDto>> {
    const q = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    const resp = await axiosClient.put(`/api/Admin/reviews/${encodeURIComponent(id)}/reject${q}`);
    return resp.data as ServiceResponse<ReviewDto>;
  }
}

export const reviewsService = new ReviewsService();
export default reviewsService;