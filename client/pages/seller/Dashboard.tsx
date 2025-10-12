// File: client/pages/seller/Dashboard.tsx

import { Link as RouterLink, useNavigate } from "react-router-dom";
import { BarChart2, Box, Users, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller } from "@/lib/api";

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

        if (shop && shop.id) {
          setShopInfo(shop);
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
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]">
      <div className="container mx-auto py-8">
        <div className="flex gap-6">
          <aside className="w-64 hidden md:block">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">
                {shopInfo.name || "Dashboard Shop"}
              </h3>
              <a
                href="/seller/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5"
              >
                {<Users size={18} />} Bảng điều khiển
              </a>
              <a
                href="/seller/products"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
              >
                {<Box size={18} />} Sản phẩm
              </a>
              <a
                href="/seller/shop"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
              >
                {<BarChart2 size={18} />} Thông tin shop
              </a>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-white">
                Bảng điều khiển Người bán
              </h1>
              <RouterLink to="/seller/products/create">
                <button className="px-4 py-2 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] text-black font-medium">
                  Tạo sản phẩm
                </button>
              </RouterLink>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Doanh thu"
                value="—"
                icon={<DollarSign size={24} />}
              />
              <StatCard title="Sản phẩm" value="—" icon={<Box size={24} />} />
              <StatCard title="Đơn hàng" value="—" icon={<Users size={24} />} />
              <StatCard
                title="Lượt xem"
                value="—"
                icon={<BarChart2 size={24} />}
              />
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">
                Danh sách sản phẩm gần đây
              </h2>
              <p className="text-sm text-slate-400">
                Chưa có dữ liệu. Shop: {shopInfo.name} đang hoạt động.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
