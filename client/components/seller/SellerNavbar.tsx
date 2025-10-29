import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function SellerNavbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout?.();
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 lg:px-8 h-16">
        {/* Logo - chỉ hiện trên mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e91e63] to-[#f43f5e] flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-[#e91e63] to-[#d81b60] bg-clip-text text-transparent">
            AIFShop
          </span>
        </div>

        {/* Title - chỉ hiện trên desktop */}
        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-gray-800">
            Quản lý Cửa hàng
          </h1>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-gray-600">
            <span className="text-gray-500">Xin chào,</span>{" "}
            <span className="font-semibold text-gray-800">
              {user?.fullname || user?.email || "Seller"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Avatar className="h-10 w-10 border-2 border-transparent hover:border-[#e91e63] transition-colors cursor-pointer shadow-md hover:shadow-lg">
                  <AvatarImage src={user?.avatar} alt={user?.fullname} />
                  <AvatarFallback className="bg-gradient-to-br from-[#e91e63] to-[#f43f5e] text-white font-semibold">
                    {user?.fullname?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      "S"}
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.fullname || "Seller"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/seller/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
