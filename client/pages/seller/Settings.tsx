import SellerPageWrapper from "@/components/seller/SellerPageWrapper";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <SellerPageWrapper>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e91e63] to-[#f43f5e] flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cài đặt</h2>
          <p className="text-sm text-gray-500 mt-1">
            Cấu hình và tùy chỉnh cửa hàng của bạn
          </p>
        </div>
      </div>

      <div className="text-center py-12 text-gray-500">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>Tính năng đang được phát triển...</p>
      </div>
    </SellerPageWrapper>
  );
}
