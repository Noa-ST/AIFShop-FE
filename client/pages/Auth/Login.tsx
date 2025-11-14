import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import { errorHandler } from "@/utils/errorHandler";
import { rateLimitHandler } from "@/utils/rateLimitHandler";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type FormData = {
  email: string;
  password: string;
};

export default function Login() {
  const { register: r, handleSubmit, formState: { errors } } = useForm<FormData>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { loginUser } = useAuth();

  const DISABLE_EMAIL_CONFIRMATION =
    String(import.meta.env.VITE_DISABLE_EMAIL_CONFIRMATION).toLowerCase() ===
    "true";

  // Update cooldown timer
  useEffect(() => {
    if (!rateLimitHandler.canMakeRequest()) {
      const interval = setInterval(() => {
        const remaining = rateLimitHandler.getRemainingCooldown();
        setCooldownRemaining(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownRemaining]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);

    if (!rateLimitHandler.canMakeRequest()) {
      const remaining = rateLimitHandler.getRemainingCooldown();
      setError(`Vui lòng đợi ${remaining} giây trước khi thử lại.`);
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser(data);

      if (!response.success) {
        // Check specific error types
        const errorMsg = response.message || "Đăng nhập thất bại";

        const isEmailConfirmError =
          errorMsg.includes("confirm your email") ||
          errorMsg.includes("Please confirm");

        if (!DISABLE_EMAIL_CONFIRMATION && isEmailConfirmError) {
          setEmailForResend(data.email);
          setShowEmailModal(true);
        } else {
          setError(
            errorHandler.handleError({ response: { data: response } }).message,
          );
        }
        return;
      }

      // Login successful
      const role = (response.role || "Customer").toString().toLowerCase();
      
      if (role === "seller") {
        navigate("/seller/shop-management");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (e: any) {
      const apiError = errorHandler.handleError(e);
      setError(apiError.message);
      
      if (apiError.type === "RATE_LIMIT" && apiError.retryAfter) {
        rateLimitHandler.handleRateLimitError(apiError.retryAfter);
        setCooldownRemaining(apiError.retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (DISABLE_EMAIL_CONFIRMATION) return;
    if (!emailForResend) return;

    setResendingEmail(true);
    try {
      await authService.sendEmailConfirmation(emailForResend);
      alert(
        "Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư của bạn.",
      );
      setShowEmailModal(false);
    } catch (error) {
      console.error("Resend email error:", error);
      alert("Không thể gửi email. Vui lòng thử lại sau.");
    } finally {
      setResendingEmail(false);
    }
  };

  const canSubmit = rateLimitHandler.canMakeRequest() && !loading;

  return (
    <>
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">Đăng nhập</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...r("email", {
                  required: "Vui lòng nhập email",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ",
                  },
                })}
                disabled={!canSubmit}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...r("password", {
                  required: "Vui lòng nhập mật khẩu",
                })}
                disabled={!canSubmit}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!rateLimitHandler.canMakeRequest() && (
              <Alert>
                <AlertDescription>
                  Vui lòng đợi {cooldownRemaining} giây trước khi thử lại
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </div>

            <div className="text-center space-y-2">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </Link>
              <div>
                <span className="text-sm text-gray-600">Chưa có tài khoản? </span>
                <Link
                  to="/register"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Email Confirmation Modal (ẩn khi DISABLE_EMAIL_CONFIRMATION=true) */}
      {!DISABLE_EMAIL_CONFIRMATION && (
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email chưa được xác nhận</DialogTitle>
              <DialogDescription>
                Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn để
                tìm liên kết xác nhận.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                disabled={resendingEmail}
              >
                Đóng
              </Button>
              <Button onClick={handleResendEmail} disabled={resendingEmail}>
                {resendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi lại email xác nhận"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}