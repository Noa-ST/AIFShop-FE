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
    </div>
  );
}

