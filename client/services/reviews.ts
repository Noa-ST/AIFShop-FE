import axiosClient from "@/services/axiosClient";
import type { PagedResult, ServiceResponse } from "@/services/types";

export type ReviewStatus = "Approved" | "Pending" | "Rejected";

export interface ReviewDto {
  id: string;
  productId: string;
  userId: string;
  userFullName?: string | null;
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
  ): Promise<PagedResult<ReviewDto> & {
    // Optional stats fields if BE provides aggregation
    stats?: {
      averageRating?: number;
      ratingDistribution?: Record<number, number>;
      totalApprovedCount?: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));
    params.append("onlyApproved", String(!!onlyApproved));
    const resp = await axiosClient.get(
      `/api/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
    );
    // Unwrap ServiceResponse<PagedResult<GetReview>> when BE wraps result
    const outer: any = resp?.data ?? {};
    const isServiceResponse =
      outer && typeof outer === "object" && ("Data" in outer || "Succeeded" in outer);
    const core: any = isServiceResponse ? outer?.Data ?? outer?.data : outer?.data ?? outer;

    // Normalize PagedResult from the core object
    const normalizedPage = Number(core?.page ?? core?.Page ?? 1);
    const coreDataArr: any = core?.data ?? core?.Data ?? core?.items ?? core?.Items ?? [];
    const normalizedPageSize = Number(
      core?.pageSize ?? core?.PageSize ?? (Array.isArray(coreDataArr) ? coreDataArr.length : 10),
    );
    const normalizedTotalCount = Number(
      core?.totalCount ?? core?.TotalCount ?? core?.total ?? core?.Total ?? 0,
    );
    const normalizedTotalPages = Number(
      core?.totalPages ?? core?.TotalPages ?? (normalizedPageSize > 0 ? Math.ceil(normalizedTotalCount / normalizedPageSize) : 0),
    );
    const hasPreviousPage = Boolean(
      core?.hasPreviousPage ?? core?.HasPreviousPage ?? normalizedPage > 1,
    );
    const hasNextPage = Boolean(
      core?.hasNextPage ?? core?.HasNextPage ?? (normalizedTotalPages > 0 ? normalizedPage < normalizedTotalPages : false),
    );
    const data: ReviewDto[] = (Array.isArray(coreDataArr) ? coreDataArr : []) as ReviewDto[];
    const stats = core?.stats ?? undefined;

    return {
      data,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalCount: normalizedTotalCount,
      totalPages: normalizedTotalPages,
      hasPreviousPage,
      hasNextPage,
      ...(stats ? { stats } : {}),
    } as PagedResult<ReviewDto> & {
      stats?: {
        averageRating?: number;
        ratingDistribution?: Record<number, number>;
        totalApprovedCount?: number;
      };
    };
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