import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextField, Button } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller } from "@/lib/api";

type FormData = {
  email: string;
  password: string;
};

export default function Login() {
  const { register: r, handleSubmit } = useForm<FormData>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginUser } = useAuth();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(data);
      const role = (res.role || "Customer").toString();
      // try to determine user id
      const userId =
        res.id ||
        res.userId ||
        res.user?.id ||
        localStorage.getItem("aifshop_userid");

      if (role.toLowerCase() === "seller") {
        // if we have userId, check if seller has shop
        if (userId) {
          try {
            const shop = await fetchShopBySeller(userId);
            if (!shop || (Array.isArray(shop) && shop.length === 0)) {
              navigate("/seller/create-shop");
            } else {
              navigate("/seller/dashboard");
            }
          } catch (err) {
            // if API check fails, fallback to dashboard which will re-check
            console.warn("Shop check failed after login:", err);
            navigate("/seller/dashboard");
          }
        } else {
          // no userId available, go to dashboard and let it handle the check
          navigate("/seller/dashboard");
        }
      } else if (role.toLowerCase() === "admin") navigate("/admin/dashboard");
      else navigate("/home");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Đăng nhập</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            fullWidth
            label="Email"
            type="email"
            {...r("email", { required: true })}
          />
          <TextField
            fullWidth
            label="Mật khẩu"
            type="password"
            {...r("password", { required: true })}
          />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex items-center justify-between">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
            <a
              href="/register"
              className="text-sm text-slate-600 hover:underline"
            >
              Đăng ký
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
