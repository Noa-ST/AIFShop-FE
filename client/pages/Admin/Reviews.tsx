import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Check, X, Eye } from "lucide-react";
import axiosClient from "@/services/axiosClient";
import type { PagedResult } from "@/services/types";

export interface ReviewDto {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userFullName?: string;
  rating: number;
  comment?: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  createdAt: string;
}

const reviewsApi = {
  getPending: async (page: number, pageSize: number) => {
    const resp = await axiosClient.get(
      `/api/Admin/reviews/pending?page=${page}&pageSize=${pageSize}`,
    );
    return resp.data as PagedResult<ReviewDto>;
  },

  approve: async (id: string) => {
    const resp = await axiosClient.put(`/api/Admin/reviews/${id}/approve`);
    return resp.data;
  },

  reject: async (id: string, reason: string) => {
    const resp = await axiosClient.put(`/api/Admin/reviews/${id}/reject`, {
      reason,
    });
    return resp.data;
  },
};

export default function AdminReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewReview, setViewReview] = useState<ReviewDto | null>(null);

  // Fetch pending reviews
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reviews-pending", page, pageSize],
    queryFn: () => reviewsApi.getPending(page, pageSize),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.approve(id),
    onSuccess: () => {
      toast({ title: "✅ Đã duyệt review" });
      queryClient.invalidateQueries({
        queryKey: ["admin-reviews-pending"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi",
        description: error?.response?.data?.message || "Không thể duyệt review",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      reviewsApi.reject(data.id, data.reason),
    onSuccess: () => {
      toast({ title: "✅ Đã từ chối review" });
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedReviewId(null);
      queryClient.invalidateQueries({
        queryKey: ["admin-reviews-pending"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi",
        description:
          error?.response?.data?.message || "Không thể từ chối review",
      });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleRejectClick = (id: string) => {
    setSelectedReviewId(id);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedReviewId || !rejectReason.trim()) {
      toast({ title: "⚠️ Vui lòng nhập lý do từ chối" });
      return;
    }
    rejectMutation.mutate({ id: selectedReviewId, reason: rejectReason });
  };

  const handleViewClick = (review: ReviewDto) => {
    setViewReview(review);
    setIsViewDialogOpen(true);
  };

  const reviews = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">
          Lỗi: {(error as any)?.message || "Không thể tải dữ liệu"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Đánh giá</h1>
        <p className="text-gray-600 mt-2">
          Duyệt hoặc từ chối đánh giá sản phẩm từ khách hàng
        </p>
      </div>

      {/* Reviews Table */}
      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Không có đánh giá chưa duyệt</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Bình luận</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review: ReviewDto) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="font-medium text-sm max-w-xs line-clamp-2">
                      {review.productName || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-gray-900">
                      {review.userFullName || review.userId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < review.rating
                              ? "text-yellow-400 text-lg"
                              : "text-gray-300 text-lg"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-sm max-w-xs truncate"
                      title={review.comment}
                    >
                      {review.comment}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                        title="Xem chi tiết"
                        onClick={() => handleViewClick(review)}
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-green-100 text-green-600 hover:text-green-700"
                        title="Duyệt đánh giá"
                        onClick={() => handleApprove(review.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-red-100 text-red-600 hover:text-red-700"
                        title="Từ chối đánh giá"
                        onClick={() => handleRejectClick(review.id)}
                        disabled={rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage(page - 1)} />
                </PaginationItem>
              )}

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    isActive={page === i + 1}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => setPage(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đánh giá</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối đánh giá này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
                setSelectedReviewId(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết đánh giá</DialogTitle>
            <DialogDescription>
              Xem đầy đủ thông tin đánh giá sản phẩm
            </DialogDescription>
          </DialogHeader>
          {viewReview ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Sản phẩm</div>
                <div className="font-medium">
                  {viewReview.productName || viewReview.productId}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Người dùng</div>
                  <div className="font-medium">
                    {viewReview.userFullName || viewReview.userId}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ngày tạo</div>
                  <div className="font-medium">
                    {new Date(viewReview.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Rating</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < viewReview.rating
                          ? "text-yellow-400 text-lg"
                          : "text-gray-300 text-lg"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Bình luận</div>
                <div className="text-sm whitespace-pre-wrap break-words">
                  {viewReview.comment || "(Không có)"}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                setViewReview(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
