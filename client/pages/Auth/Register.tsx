import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type FormData = {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "Customer" | "Seller";
};

export default function Register() {
  const {
    register: r,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormData>({ defaultValues: { role: "Customer" } });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { registerUser } = useAuth();
  const DISABLE_EMAIL_CONFIRMATION =
    String(import.meta.env.VITE_DISABLE_EMAIL_CONFIRMATION).toLowerCase() ===
    "true";

  const password = watch("password");
  const role = watch("role");

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

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];
    
    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || "",
    };
  };

  const passwordStrength = getPasswordStrength(password || "");

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
      const response = await registerUser({
        ...data,
        role: data.role || "Customer",
      });

      if (response.succeeded || response.success) {
        setRegisteredEmail(data.email);
        setShowSuccessModal(true);
        // Nếu tắt xác nhận email, có thể chuyển hướng đăng nhập luôn (tuỳ chọn)
        // navigate('/login');
      } else {
        const apiError = errorHandler.handleError({ response: { data: response } });
        setError(apiError.message);
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

  const handleGoToVerify = () => {
    if (DISABLE_EMAIL_CONFIRMATION) {
      setShowSuccessModal(false);
      navigate("/login");
      return;
    }
    setShowSuccessModal(false);
    navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
  };

  const canSubmit = rateLimitHandler.canMakeRequest() && !loading;

  return (
    <>
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">Đăng ký</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">Họ tên</Label>
              <Input
                id="fullname"
                placeholder="Nguyễn Văn A"
                {...r("fullname", {
                  required: "Vui lòng nhập họ tên",
                  minLength: {
                    value: 2,
                    message: "Họ tên phải có ít nhất 2 ký tự",
                  },
                })}
                disabled={!canSubmit}
              />
              {errors.fullname && (
                <p className="text-sm text-red-500">{errors.fullname.message}</p>
              )}
            </div>

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
              <Label htmlFor="role">Vai trò</Label>
              <Select
                value={role}
                onValueChange={(value) => setValue("role", value as "Customer" | "Seller")}
                disabled={!canSubmit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer (Khách hàng)</SelectItem>
                  <SelectItem value="Seller">Seller (Người bán)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...r("password", {
                  required: "Vui lòng nhập mật khẩu",
                  minLength: {
                    value: 8,
                    message: "Mật khẩu phải có ít nhất 8 ký tự",
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
                  },
                })}
                disabled={!canSubmit}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs text-gray-600">
                      Độ mạnh: {passwordStrength.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...r("confirmPassword", {
                  required: "Vui lòng xác nhận mật khẩu",
                  validate: (value) =>
                    value === password || "Mật khẩu không khớp",
                })}
                disabled={!canSubmit}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
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

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">Đã có tài khoản? </span>
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal - Ẩn yêu cầu xác nhận email khi DISABLE_EMAIL_CONFIRMATION=true */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký thành công!</DialogTitle>
            <DialogDescription>
              {DISABLE_EMAIL_CONFIRMATION ? (
                <>
                  Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay.
                </>
              ) : (
                <>
                  Tài khoản của bạn đã được tạo thành công. Vui lòng kiểm tra email{" "}
                  <strong>{registeredEmail}</strong> để xác nhận tài khoản trước khi đăng nhập.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
              Đóng
            </Button>
            {!DISABLE_EMAIL_CONFIRMATION ? (
              <Button onClick={handleGoToVerify}>Đi đến trang xác nhận email</Button>
            ) : (
              <Button onClick={handleGoToVerify}>Đăng nhập ngay</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}