import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import authService from "@/services/authService";
import { errorHandler } from "@/utils/errorHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const emailFromUrl = searchParams.get("email");
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState(emailFromUrl || "");
  const [token, setToken] = useState(tokenFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Auto-verify if email and token are in URL
    if (emailFromUrl && tokenFromUrl) {
      handleVerify();
    }
  }, [emailFromUrl, tokenFromUrl]);

  const handleVerify = async () => {
    if (!email || !token) {
      setError("Vui lòng nhập đầy đủ email và token");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await authService.confirmEmail(email, token);
      
      if (response.succeeded || response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.message || "Xác nhận email thất bại");
      }
    } catch (e: any) {
      const apiError = errorHandler.handleError(e);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    setResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await authService.sendEmailConfirmation(email);
      setResendSuccess(true);
    } catch (e: any) {
      const apiError = errorHandler.handleError(e);
      setError(apiError.message);
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Xác nhận email thành công!</h2>
          <p className="text-gray-600 mb-4">
            Tài khoản của bạn đã được xác nhận. Đang chuyển đến trang đăng nhập...
          </p>
          <Button onClick={() => navigate("/login")}>
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Xác nhận email</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!tokenFromUrl}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token xác nhận</Label>
            <Input
              id="token"
              type="text"
              placeholder="Token từ email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading || !!tokenFromUrl}
            />
            <p className="text-xs text-gray-500">
              Token được gửi trong email xác nhận của bạn
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resendSuccess && (
            <Alert>
              <AlertDescription>
                Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư của bạn.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleVerify}
            disabled={loading || !email || !token}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận email"
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Chưa nhận được email?
            </p>
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resending || !email}
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi lại email xác nhận"
              )}
            </Button>
            <div>
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
