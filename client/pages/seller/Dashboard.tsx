import { Link as RouterLink, useNavigate } from "react-router-dom";
import { BarChart2, Box, Users, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl hover:shadow-rose-600/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <div className="text-rose-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 pt-1">+20.1% so với tháng trước</p>
      </CardContent>
    </Card>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, initialized } = useAuth();

  const [isShopChecked, setIsShopChecked] = useState(false);
  const [shopInfo, setShopInfo] = useState<any>(null);

  useEffect(() => {
    // Wait until AuthContext initialized to avoid premature redirects/logouts
    if (!initialized) return;

    if (!user || user?.role !== "Seller") {
      navigate("/login");
      return;
    }

    const checkShop = async () => {
      const sellerId = user.id;
      setIsShopChecked(false);
      setShopInfo(null);

      if (!sellerId) {
        setIsShopChecked(true);
        return;
      }

      try {
        const shop = await fetchShopBySeller(sellerId);
        if (isShopPresent(shop)) {
          setShopInfo(Array.isArray(shop) ? shop[0] : shop);
        } else {
          navigate("/seller/create-shop");
          return;
        }
      } catch (err: any) {
        if (
          err.response &&
          (err.response.status === 404 || err.response.status === 400)
        ) {
          navigate("/seller/create-shop");
          return;
        }
        console.error("Lỗi khi kiểm tra shop:", err);
        navigate("/error");
        return;
      } finally {
        setIsShopChecked(true);
      }
    };

    checkShop();
  }, [user, initialized, navigate]);

  if (!isShopChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 text-xl">
        Đang kiểm tra trạng thái Cửa hàng...
      </div>
    );
  }

  if (!shopInfo) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">
          Bảng điều khiển Shop:{" "}
          <span className="text-rose-400">{shopInfo.name}</span>
        </h1>

        <div className="flex gap-8">
          <aside className="w-64 hidden md:block border-r border-slate-800 pr-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">
                Điều hướng
              </h4>

              <RouterLink
                to="/seller/dashboard"
                className="flex items-center gap-3 p-3 rounded-lg bg-rose-600 text-white font-medium"
              >
                <BarChart2 size={18} /> Tổng quan
              </RouterLink>

              <RouterLink
                to="/seller/shop-management"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <Box size={18} /> Quản lý Shop
              </RouterLink>

              <RouterLink
                to="/seller/orders"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <DollarSign size={18} /> Đơn hàng
              </RouterLink>
            </div>
          </aside>

          <main className="flex-1">
            <Alert
              variant="default"
              className="mb-6 border-l-4 border-yellow-400 bg-yellow-50 text-slate-900"
            >
              <AlertTitle className="font-semibold">Đơn hàng mới!</AlertTitle>
              <AlertDescription>
                Bạn có 3 đơn hàng mới đang chờ xử lý.{" "}
                <RouterLink
                  to="/seller/orders"
                  className="font-semibold underline text-rose-600"
                >
                  Xử lý ngay.
                </RouterLink>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <StatCard
                title="Doanh thu Tháng này"
                value="15,200,000₫"
                icon={<DollarSign size={20} />}
              />
              <StatCard
                title="Đơn hàng chờ xử lý"
                value="3"
                icon={<Users size={20} />}
              />
              <StatCard
                title="SP đang hoạt động"
                value="150"
                icon={<Box size={20} />}
              />
              <StatCard
                title="Đánh giá TB"
                value="4.7"
                icon={<BarChart2 size={20} />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Doanh thu theo thời gian
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-slate-800 flex items-center justify-center text-slate-400 border rounded-lg">
                      <svg viewBox="0 0 100 30" className="w-full h-40">
                        <polyline
                          fill="none"
                          stroke="#fb7185"
                          strokeWidth="2"
                          points="0,20 10,18 20,12 30,14 40,8 50,6 60,10 70,12 80,9 90,7 100,5"
                        />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <RouterLink to="/seller/products/create" className="block">
                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
                    + TẠO SẢN PHẨM MỚI
                  </Button>
                </RouterLink>

                <RouterLink
                  to="/seller/orders?status=pending"
                  className="block"
                >
                  <Button variant="outline" className="w-full h-12">
                    Xử lý Đơn hàng (12)
                  </Button>
                </RouterLink>

                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-md text-slate-900">
                  <div className="font-semibold">Cảnh báo tồn kho!</div>
                  <div className="text-sm mt-1">
                    Có 5 sản phẩm sắp hết hàng.{" "}
                    <RouterLink
                      to="/seller/products"
                      className="font-semibold underline"
                    >
                      Kiểm tra ngay.
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                Danh sách sản phẩm gần đây
              </h2>
              <div className="bg-slate-800 rounded-2xl p-6">
                <p className="text-sm text-slate-300">
                  Chưa có dữ liệu. Shop: {shopInfo.name} đang hoạt động.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
