import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShopInfo from "@/pages/seller/ShopInfo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Address,
  AddressCreatePayload,
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const isSeller = user?.role === "Seller";

  const [tab, setTab] = useState("info");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isSeller && tab === "orders") setTab("info");
  }, [isSeller]);

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)}>
        <TabsList
          className="grid w-full mb-6"
          style={{
            gridTemplateColumns: isSeller ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          }}
        >
          <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="secondary">
            {isSeller ? "Thông tin Shop" : "Địa chỉ giao hàng"}
          </TabsTrigger>
          {!isSeller && (
            <TabsTrigger value="orders">Đơn hàng của tôi</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Cập nhật thông tin</h2>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                placeholder="Họ và tên"
                defaultValue={user?.fullname || ""}
              />
              <Input
                placeholder="Email"
                defaultValue={user?.email || ""}
                disabled
              />
              <Input placeholder="Số điện thoại" defaultValue={""} />
              <Input type="date" placeholder="Ngày sinh" />
              <div className="md:col-span-2 flex justify-end">
                <Button className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="secondary">
          {isSeller ? (
            <ShopInfo />
          ) : (
            <AddressesSection />
          )}
        </TabsContent>

        {!isSeller && (
          <TabsContent value="orders">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Lịch sử đơn hàng</h2>
              <div className="border p-4 rounded-md">
                <p>Không có đơn hàng.</p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function AddressesSection() {
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const form = useForm<AddressCreatePayload>({
    defaultValues: {
      fullName: "",
      phone: "",
      province: "",
      district: "",
      ward: "",
      addressLine: "",
      isDefault: false,
    },
  });

  const resetForm = (addr?: Address | null) => {
    form.reset(
      addr
        ? {
            fullName: addr.fullName,
            phone: addr.phone,
            province: addr.province,
            district: addr.district,
            ward: addr.ward,
            addressLine: addr.addressLine,
            isDefault: !!addr.isDefault,
          }
        : {
            fullName: "",
            phone: "",
            province: "",
            district: "",
            ward: "",
            addressLine: "",
            isDefault: false,
          },
    );
  };

  const { mutateAsync: mutateCreate, isPending: creating } = useMutation({
    mutationFn: (payload: AddressCreatePayload) => createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({ title: "Đã thêm địa chỉ" });
    },
  });
  const { mutateAsync: mutateUpdate, isPending: updating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddressCreatePayload }) =>
      updateAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({ title: "Đã cập nhật địa chỉ" });
    },
  });
  const { mutateAsync: mutateDelete, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({ title: "Đã xóa địa chỉ" });
    },
  });

  const onSubmit = async (values: AddressCreatePayload) => {
    if (editing) await mutateUpdate({ id: editing.id, payload: values });
    else await mutateCreate(values);
    setDialogOpen(false);
    setEditing(null);
  };

  const defaultAddress = useMemo(
    () => (addresses || []).find((a) => a.isDefault),
    [addresses],
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Địa chỉ nhận hàng</h2>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                resetForm(null);
              }}
            >
              + Thêm địa chỉ mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="090xxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tỉnh/Thành phố</FormLabel>
                      <FormControl>
                        <Input placeholder="TP. Hồ Chí Minh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quận/Huyện</FormLabel>
                      <FormControl>
                        <Input placeholder="Quận 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phường/Xã</FormLabel>
                      <FormControl>
                        <Input placeholder="Phường Bến Nghé" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressLine"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <Input placeholder="Số nhà, tên đường..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={creating || updating}>
                    Lưu
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="border p-4 rounded-md">Đang tải...</div>
      ) : (addresses || []).length === 0 ? (
        <div className="border p-4 rounded-md">Chưa có địa chỉ</div>
      ) : (
        <div className="space-y-3">
          {(addresses || []).map((addr) => (
            <div key={addr.id} className="border p-4 rounded-md">
              {addr.isDefault && (
                <div className="text-xs inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 mb-2">
                  Địa chỉ mặc định
                </div>
              )}
              <div className="font-semibold">
                {addr.fullName} | {addr.phone}
              </div>
              <div className="text-sm text-muted-foreground">
                {addr.addressLine}, {addr.ward}, {addr.district}, {addr.province}
              </div>
              <div className="mt-2 space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(addr);
                    resetForm(addr);
                    setDialogOpen(true);
                  }}
                >
                  Chỉnh sửa
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const ok = window.confirm("Xóa địa chỉ này?");
                    if (!ok) return;
                    await mutateDelete(addr.id);
                  }}
                  disabled={deleting}
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
