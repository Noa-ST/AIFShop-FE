import { Link as RouterLink, useNavigate } from "react-router-dom";
import { BarChart2, Box, Users, DollarSign } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller } from "@/lib/api";

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
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)]">{icon}</div>
        <div>
          <div className="text-sm text-slate-300">{title}</div>
          <div className="text-2xl font-semibold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Only run check for sellers
    if (!user || user?.role !== "Seller") return;

    const checkShop = async () => {
      const sellerId = user.id || user.userId;
      if (!sellerId) {
        console.warn("Seller ID missing, cannot check shop");
        return;
      }

      try {
        const shop = await fetchShopBySeller(sellerId);
        // If API returns null/empty or an array with length 0, redirect to create-shop
        if (!shop || (Array.isArray(shop) && shop.length === 0)) {
          navigate("/seller/create-shop");
        }
      } catch (err) {
        // If 404 or not found, redirect to create shop; otherwise log
        console.warn("Could not determine shop for seller:", err);
        navigate("/seller/create-shop");
      }
    };

    checkShop();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]">
      <div className="container mx-auto py-8">
        <div className="flex gap-6">
          <aside className="w-64 hidden md:block">
            <div className="space-y-3">
              <a
                href="/seller/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
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
              <div>
                <button className="px-4 py-2 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] text-black font-medium">
                  Tạo sản phẩm
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard title="Doanh thu" value="—" icon={<DollarSign />} />
              <StatCard title="S���n phẩm" value="—" icon={<Box />} />
              <StatCard title="Đơn hàng" value="—" icon={<Users />} />
              <StatCard title="Lượt xem" value="—" icon={<BarChart2 />} />
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">
                Danh sách sản phẩm gần đây
              </h2>
              <p className="text-sm text-slate-400">
                Chưa có dữ liệu. Dữ liệu thực sẽ được hiển thị khi shop có sản
                phẩm và đơn hàng.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
