import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddressList, { AddressListRef } from "@/components/addresses/AddressList";
import AddressForm from "@/components/addresses/AddressForm";
import { GetAddressDto } from "@/services/addressService";
import authService from "@/services/authService";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { AddressValidator } from "@/utils/addressValidator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const isSeller = user?.role === "Seller";

  const [tab, setTab] = useState("info");
  const [fullName, setFullName] = useState<string>(user?.fullname || "");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const { toast } = useToast();

  // Thêm: error states và regex điện thoại VN
  const [nameError, setNameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const PHONE_REGEX = /^(0|\+84)[1-9][0-9]{8,9}$/;

  // Đổi mật khẩu: trạng thái dialog và form
  const [changeOpen, setChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string>("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const op = currentPassword.trim();
      const np = newPassword.trim();
      const cp = confirmPassword.trim();
      if (!op) throw new Error("Vui lòng nhập mật khẩu hiện tại.");
      if (np.length < 8) throw new Error("Mật khẩu mới tối thiểu 8 ký tự.");
      if (np !== cp) throw new Error("Xác nhận mật khẩu không khớp.");
      return await authService.changePassword({
        currentPassword: op,
        newPassword: np,
        confirmPassword: cp,
      });
    },
    onSuccess: (res) => {
      toast({
        title: "Đổi mật khẩu thành công",
        description:
          (res as any)?.message ||
          "Bạn có thể dùng mật khẩu mới để đăng nhập.",
      });
      setChangeOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdError("");
    },
    onError: (err: any) => {
      const msg = err?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      setPwdError(msg);
      toast({ title: "Thất bại", description: msg, variant: "destructive" });
    },
  });

  // Prefill from /me for phoneNumber and latest fullName
  useEffect(() => {
    (async () => {
      try {
        const me = await authService.getCurrentUser();
        if (me) {
          setFullName(me.fullName || user?.fullname || "");
          setPhoneNumber(me.phoneNumber || "");
        }
      } catch (e) {
        // silently ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Chuẩn hóa phone trước khi submit
      const normalizedPhone = phoneNumber
        ? AddressValidator.formatPhoneNumber(phoneNumber.trim())
        : undefined;

      // Validation tối thiểu phía client
      const nameOk = fullName.trim().length > 0;
      const phoneOk =
        !normalizedPhone || PHONE_REGEX.test(phoneNumber.replace(/\s/g, ""));

      setNameError(nameOk ? "" : "Họ và tên là bắt buộc");
      setPhoneError(
        phoneOk
          ? ""
          : "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0 hoặc +84)."
      );
      if (!nameOk || !phoneOk) {
        throw new Error("Vui lòng kiểm tra lại thông tin.");
      }

      return await authService.updateProfile({
        fullName: fullName.trim() || undefined,
        phoneNumber: normalizedPhone || undefined,
      });
    },
    onSuccess: async (res) => {
      toast({ title: "Cập nhật thành công", description: res.message || "Thông tin đã được lưu." });
      // refresh user in header/context
      if (refreshUser) {
        await refreshUser();
      } else if (fullName) {
        try { localStorage.setItem("aifshop_fullname", fullName); } catch {}
      }
    },
    onError: (err: any) => {
      toast({ title: "Cập nhật thất bại", description: err?.message || "Vui lòng thử lại.", variant: "destructive" });
    },
  });

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)}>
        <TabsList
          className="grid w-full mb-6"
          style={{ gridTemplateColumns: isSeller ? "repeat(1, 1fr)" : "repeat(2, 1fr)" }}
        >
          <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
          {!isSeller && <TabsTrigger value="secondary">Địa chỉ giao hàng</TabsTrigger>}
        </TabsList>

        <TabsContent value="info">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Cập nhật thông tin</h2>
            <form
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
            >
              <Input
                placeholder="Họ và tên"
                value={fullName}
                maxLength={100}
                autoComplete="name"
                autoFocus
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => {
                  const v = fullName.trim();
                  setFullName(v);
                  setNameError(v ? "" : "Họ và tên là bắt buộc");
                }}
              />
              {/* Hiển thị lỗi tên nếu có */}
              {nameError && (
                <p className="text-sm text-destructive md:col-span-2">
                  {nameError}
                </p>
              )}

              <Input
                placeholder="Email"
                value={user?.email || ""}
                autoComplete="email"
                disabled
              />
              <Input
                placeholder="Số điện thoại"
                value={phoneNumber}
                maxLength={13}
                autoComplete="tel"
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\s/g, ""))
                }
                onBlur={() => {
                  const v = phoneNumber.trim();
                  setPhoneNumber(v);
                  if (v && !PHONE_REGEX.test(v)) {
                    setPhoneError(
                      "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0 hoặc +84)."
                    );
                  } else {
                    setPhoneError("");
                  }
                }}
              />
              {/* Trợ giúp và lỗi số điện thoại */}
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx
                </p>
                {phoneError && (
                  <p className="text-sm text-destructive">{phoneError}</p>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    updateMutation.isPending ||
                    !fullName.trim() ||
                    (!!phoneNumber && !PHONE_REGEX.test(phoneNumber))
                  }
                  className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
                >
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {!isSeller && (
          <TabsContent value="secondary">
            <AddressesSection />
          </TabsContent>
        )}
      </Tabs>

      {isSeller && (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-2">Quản lý Shop</h2>
          <p className="text-sm text-slate-600 mb-4">
            Thông tin shop đã được chuyển sang khu vực Quản lý Shop.
          </p>
          <Link
            to="/seller/shop-management"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
          >
            Mở Quản lý Shop
          </Link>
        </div>
      )}
    </div>
  );
}

function AddressesSection() {
  const addressListRef = useRef<AddressListRef>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<GetAddressDto | undefined>();

  const handleAddNew = () => {
    setEditingAddress(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (address: GetAddressDto) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingAddress(undefined);
    // Reload address list
    addressListRef.current?.reload();
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingAddress(undefined);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <AddressList ref={addressListRef} onAddNew={handleAddNew} onEdit={handleEdit} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            address={editingAddress}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
