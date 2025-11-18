import { useState, useRef } from "react";
import AddressList, { AddressListRef } from "@/components/addresses/AddressList";
import AddressForm from "@/components/addresses/AddressForm";
import { GetAddressDto } from "@/services/addressService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AddressManagementPage() {
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

  const handleSuccess = async () => {
    setDialogOpen(false);
    setEditingAddress(undefined);
    
    // ✅ Đợi một chút để backend commit dữ liệu (có thể cần thời gian transaction)
    console.log("⏳ Waiting for backend to commit...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // ✅ Reload address list
    console.log("🔄 Reloading address list...");
    if (addressListRef.current) {
      addressListRef.current.reload();
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingAddress(undefined);
  };

  return (
    <div className="container py-8 max-w-6xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/">Trang chủ</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Địa chỉ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6">Quản lý địa chỉ</h1>

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

      {/* Mobile FAB: Add new address */}
      <div className="sm:hidden fixed right-4 bottom-24 z-40">
        <Button
          onClick={handleAddNew}
          className="rounded-full h-12 w-12 p-0 shadow-lg bg-primary text-primary-foreground"
          aria-label="Thêm địa chỉ"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

