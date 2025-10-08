import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { register as apiRegister } from "@/lib/api";
import { useState } from "react";
import { TextField, Button } from "@mui/material";

type FormData = {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const { register: r, handleSubmit } = useForm<FormData>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await apiRegister({ ...data, role: "Customer" });
      navigate("/login");
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
          <TextField fullWidth label="Họ tên" {...r("fullname", { required: true })} />
          <TextField fullWidth label="Email" type="email" {...r("email", { required: true })} />
          <TextField fullWidth label="Mật khẩu" type="password" {...r("password", { required: true })} />
          <TextField fullWidth label="Xác nhận mật khẩu" type="password" {...r("confirmPassword", { required: true })} />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex items-center justify-between">
            <Button variant="contained" color="primary" type="submit" disabled={loading} className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </Button>
            <a href="/login" className="text-sm text-slate-600 hover:underline">Đã có tài khoản?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
