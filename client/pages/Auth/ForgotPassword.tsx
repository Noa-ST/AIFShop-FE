import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "@/services/authService";
import { errorHandler } from "@/utils/errorHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email) {
      setError("Vui lòng nhập email");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(email);
      
      if (response.succeeded || response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Không thể gửi email. Vui lòng thử lại.");
      }
    } catch (e: any) {
      const apiError = errorHandler.handleError(e);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Email đã được gửi!</h2>
          <p className="text-gray-600 mb-4">
            Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được
            liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/login")} className="w-full">
              Quay lại đăng nhập
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="w-full"
            >
              Gửi lại email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Quên mật khẩu</h2>
        <p className="text-gray-600 mb-6">
          Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading || !email} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi email đặt lại mật khẩu"
            )}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
