import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

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
  } = useForm<FormData>({ defaultValues: { role: "Customer" } });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { registerUser, loginUser } = useAuth();

  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await registerUser({ ...data, role: data.role });
      // After successful register, attempt to auto-login so AuthContext is populated.
      try {
        await loginUser({ email: data.email, password: data.password });
      } catch (loginErr) {
        // If auto-login fails, continue to navigate and let user login manually
        console.warn("Auto-login after register failed:", loginErr);
      }

      // After login/register, try to check shop existence for seller role
      if (data.role === "Seller") {
        // attempt to determine user id set by loginUser
        const userId = (await Promise.resolve()) && (localStorage.getItem("aifshop_userid") || (res && (res.id || res.userId || res.user?.id)));
        if (userId) {
          try {
            const shop = await fetchShopBySeller(userId as string);
            if (!shop || (Array.isArray(shop) && shop.length === 0)) {
              navigate("/seller/create-shop");
            } else {
              navigate("/seller/dashboard");
            }
          } catch (err) {
            console.warn("Shop check failed after register:", err);
            navigate("/seller/dashboard");
          }
        } else {
          navigate("/seller/dashboard");
        }
      } else {
        navigate("/home");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Đăng ký</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            fullWidth
            label="Họ tên"
            {...r("fullname", { required: "Vui lòng nhập họ tên" })}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            {...r("email", { required: "Vui lòng nhập email" })}
          />
          <TextField
            fullWidth
            label="Mật khẩu"
            type="password"
            {...r("password", {
              required: "Vui lòng nhập mật khẩu",
              minLength: { value: 8, message: "Mật khẩu ít nhất 8 ký tự" },
            })}
          />
          <TextField
            fullWidth
            label="Xác nhận mật khẩu"
            type="password"
            {...r("confirmPassword", {
              required: "Vui lòng xác nhận mật khẩu",
              validate: (v) => v === password || "Mật khẩu không khớp",
            })}
          />

          <FormControl fullWidth>
            <InputLabel id="role-label">Vai trò</InputLabel>
            <Select
              labelId="role-label"
              defaultValue="Customer"
              label="Vai trò"
              {...r("role")}
            >
              <MenuItem value="Customer">Customer (Khách hàng)</MenuItem>
              <MenuItem value="Seller">Seller (Người bán)</MenuItem>
            </Select>
          </FormControl>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex items-center justify-between">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </Button>
            <a href="/login" className="text-sm text-slate-600 hover:underline">
              Đã có tài khoản?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
