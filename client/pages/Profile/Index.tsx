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
      return await authService.updateProfile({
        fullName: fullName || undefined,
        phoneNumber: phoneNumber || undefined,
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
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input placeholder="Email" value={user?.email || ""} disabled />
              <Input
                placeholder="Số điện thoại"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
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
