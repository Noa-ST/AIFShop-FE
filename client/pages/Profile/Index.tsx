import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, Tab, Box, Button, TextField } from "@mui/material";

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="profile tabs"
        >
          <Tab label="Thông tin cá nhân" />
          <Tab label="Địa chỉ" />
          <Tab label="Đơn hàng" />
        </Tabs>
      </Box>

      <div className="mt-6">
        {tab === 0 && (
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Cập nhật thông tin</h2>
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  label="Họ và tên"
                  defaultValue={user?.fullname || ""}
                />
                <TextField
                  label="Email"
                  defaultValue={user?.email || ""}
                  disabled
                />
                <TextField label="Số điện thoại" defaultValue={""} />
                <TextField
                  label="Ngày sinh"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    variant="contained"
                    className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Địa chỉ nhận hàng</h2>
                <Button variant="outlined">+ Thêm địa chỉ mới</Button>
              </div>
              <div className="border p-4 rounded-md">
                <p className="font-semibold">Địa chỉ mặc định</p>
                <p>Nguyễn Văn A | 090xxxxxxx</p>
                <p>Số nhà 123, đường XYZ, Phường, Quận, Thành phố</p>
                <div className="mt-2 space-x-2">
                  <Button variant="contained">Chỉnh sửa</Button>
                  <Button variant="outlined">Xóa</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Lịch sử đơn hàng</h2>
              <div className="border p-4 rounded-md">
                <p>Không có đơn hàng.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
