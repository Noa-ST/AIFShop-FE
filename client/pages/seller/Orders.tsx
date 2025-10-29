import SellerPageWrapper from "@/components/seller/SellerPageWrapper";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  return (
    <SellerPageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e91e63] to-[#f43f5e] flex items-center justify-center shadow-lg shadow-pink-500/20">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Đơn hàng</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý và theo dõi đơn hàng của khách hàng
            </p>
          </div>
        </div>

        {/* Placeholder Content */}
        <Card className="border-2 border-dashed">
          <CardContent className="py-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-[#e91e63]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Tính năng đang được phát triển
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Tính năng quản lý đơn hàng sẽ sớm được ra mắt. Bạn sẽ có thể
                xem, xử lý và theo dõi tất cả đơn hàng của khách hàng tại đây.
              </p>

              {/* Preview Cards */}
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                <Card className="border-2 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm font-medium text-gray-700">
                      Đơn hàng mới
                    </p>
                    <p className="text-xs text-gray-500 mt-1">0 đơn</p>
                  </CardContent>
                </Card>
                <Card className="border-2 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <Package className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium text-gray-700">
                      Đang xử lý
                    </p>
                    <p className="text-xs text-gray-500 mt-1">0 đơn</p>
                  </CardContent>
                </Card>
                <Card className="border-2 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium text-gray-700">
                      Hoàn thành
                    </p>
                    <p className="text-xs text-gray-500 mt-1">0 đơn</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </SellerPageWrapper>
  );
}
