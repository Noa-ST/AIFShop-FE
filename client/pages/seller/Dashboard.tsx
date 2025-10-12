// File: client/pages/seller/Dashboard.tsx

import { Link as RouterLink, useNavigate } from "react-router-dom";
import { BarChart2, Box, Users, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";

// Component phụ: StatCard (Giữ nguyên)
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 backdrop-blur-md">
           {" "}
      <div className="flex items-start gap-4">
               {" "}
        <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)]">{icon}</div>
               {" "}
        <div>
                    <div className="text-sm text-slate-300">{title}</div>       
            <div className="text-2xl font-semibold text-white">{value}</div>   
             {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ 1. TRẠNG THÁI: Quản lý việc kiểm tra đã xong chưa và thông tin Shop
  const [isShopChecked, setIsShopChecked] = useState(false);
  const [shopInfo, setShopInfo] = useState<any>(null);

  useEffect(() => {
    // 1. Kiểm tra quyền
    if (!user || user?.role !== "Seller") {
      navigate("/login");
      return;
    }

    const checkShop = async () => {
      const sellerId = user.id;
      // Reset trạng thái tải
      setIsShopChecked(false);
      setShopInfo(null);

      if (!sellerId) {
        setIsShopChecked(true);
        return;
      }

      try {
        const shop = await fetchShopBySeller(sellerId);

        // Use helper to decide presence and normalize shape
        if (isShopPresent(shop)) {
          setShopInfo(Array.isArray(shop) ? shop[0] : shop);
        } else {
          // Trường hợp API trả về 200 OK nhưng body rỗng (chưa có Shop)
          navigate("/seller/create-shop");
          return; // 🛑 DỪNG THỰC THI SAU KHI CHUYỂN HƯỚNG
        }
      } catch (err: any) {
        // Trường hợp thất bại: LỖI 404/400 (Chưa có Shop)
        if (
          err.response &&
          (err.response.status === 404 || err.response.status === 400)
        ) {
          navigate("/seller/create-shop");
          return; // 🛑 DỪNG THỰC THI SAU KHI CHUYỂN HƯỚNG
        }

        console.error("Lỗi nghiêm trọng khi kiểm tra Shop:", err);
        navigate("/error");
        return;
      } finally {
        // ✅ Đánh dấu đã kiểm tra chỉ sau khi logic kết thúc
        setIsShopChecked(true);
      }
    };

    checkShop();
  }, [user, navigate]); // Dependencies: [user, navigate]

  // -------------------------------------------------------------------
  // ✅ ĐIỀU KIỆN RENDER: Chặn render nếu chưa kiểm tra xong
  // -------------------------------------------------------------------
  if (!isShopChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-[#E2E8F0] text-xl">
        Đang kiểm tra trạng thái Cửa hàng...
      </div>
    );
  }

  // Nếu đã kiểm tra xong, nhưng không có shopInfo (có nghĩa là đã chuyển hướng thành công)
  if (!shopInfo) {
    return null;
  }

  // -------------------------------------------------------------------
  // ✅ RENDER DASHBOARD CHỈ KHI CÓ SHOP INFO
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">
          Tổng quan Cửa hàng: <span className="text-primary">{shopInfo.name}</span>
        </h1>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Doanh thu Tháng này" value="15,200,000₫" icon={<DollarSign size={20} />} />
          <StatCard title="Đơn hàng mới" value="12" icon={<Users size={20} />} />
          <StatCard title="SP đang hoạt động" value="150" icon={<Box size={20} />} />
          <StatCard title="Đánh giá TB" value="4.7 / 5" icon={<BarChart2 size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="px-4 py-3 border-b">
                <h3 className="text-lg font-semibold">Doanh thu 30 ngày gần nhất</h3>
              </div>
              <div className="p-4 h-64 bg-slate-50 flex items-center justify-center text-slate-500">
                [Biểu đồ Doanh thu (Component Chart)]
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <RouterLink to="/seller/products/create" className="block">
              <button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold">+ TẠO SẢN PHẨM MỚI</button>
            </RouterLink>

            <RouterLink to="/seller/orders?status=pending" className="block">
              <button className="w-full h-12 border rounded-md">Xử lý Đơn hàng (12)</button>
            </RouterLink>

            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-md">
              <div className="font-semibold">Cảnh báo tồn kho!</div>
              <div className="text-sm mt-1">Có 5 sản phẩm sắp hết hàng. <RouterLink to="/seller/products" className="font-semibold underline">Kiểm tra ngay.</RouterLink></div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Danh sách sản phẩm gần đây</h2>
          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-sm text-slate-600">Chưa có dữ liệu. Shop: {shopInfo.name} đang hoạt động.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
