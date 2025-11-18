import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { addressService, GetAddressDto } from "@/services/addressService";
import AddressCard from "./AddressCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, AlertCircle, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface AddressListProps {
  onAddNew?: () => void;
  onEdit?: (address: GetAddressDto) => void;
}

export interface AddressListRef {
  reload: () => void;
}

const AddressList = forwardRef<AddressListRef, AddressListProps>(
  ({ onAddNew, onEdit }, ref) => {
    const [addresses, setAddresses] = useState<GetAddressDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirm, setConfirm] = useState<{
      type: "delete" | "setDefault";
      id: string;
    } | null>(null);

    const loadAddresses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await addressService.getList();
        
        console.log("📦 Address list response:", response); // Debug log
        
        // ✅ Handle success case - including empty array
        if (response.Succeeded) {
          // ✅ Ensure Data is always an array (handle both camelCase and PascalCase)
          const addressArray = Array.isArray(response.Data) 
            ? response.Data 
            : (response.Data ? [response.Data] : []);
          
          console.log("✅ Setting addresses:", addressArray.length, "addresses"); // Debug log
          setAddresses(addressArray);
        } else {
          // ✅ Only show error if Succeeded is explicitly false
          const message = response.Message || "Lỗi khi tải danh sách địa chỉ";
          console.warn("⚠️ Address list failed:", message);
          setError(message);
          toast({
            title: "Lỗi",
            description: message,
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("❌ Error loading addresses:", err);
        console.error("Error response:", err?.response?.data);
        const errorMessage =
          err?.response?.data?.Message ||
          err?.response?.data?.message ||
          err?.message ||
          "Lỗi khi tải danh sách địa chỉ";
        setError(errorMessage);
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadAddresses();
    }, []);

    useImperativeHandle(ref, () => ({
      reload: loadAddresses,
    }));


  const handleDelete = async (id: string) => {
    try {
      const response = await addressService.delete(id);
      if (response.Succeeded) {
        toast({
          title: "Thành công",
          description: response.Message || "Xóa địa chỉ thành công.",
        });
        loadAddresses();
      } else {
        toast({
          title: "Lỗi",
          description: response.Message || "Lỗi khi xóa địa chỉ",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.Message ||
        error?.message ||
        "Lỗi khi xóa địa chỉ";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await addressService.setDefault(id);
      if (response.Succeeded) {
        toast({
          title: "Thành công",
          description: response.Message || "Đã đặt làm địa chỉ mặc định thành công.",
        });
        loadAddresses();
      } else {
        toast({
          title: "Lỗi",
          description: response.Message || "Lỗi khi đặt địa chỉ mặc định",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.Message ||
        error?.message ||
        "Lỗi khi đặt địa chỉ mặc định";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Filtered addresses by recipient name or province
  const filtered = addresses.filter((a) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      a.recipientName.toLowerCase().includes(term) ||
      a.province.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Danh sách địa chỉ</h2>
        {onAddNew && (
          <Button onClick={onAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm địa chỉ mới
          </Button>
        )}
      </div>

      {/* Search / Filter */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 w-full">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên người nhận hoặc tỉnh"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card text-card-foreground p-8 flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">Bạn chưa có địa chỉ nào.</p>
          {onAddNew && (
            <Button onClick={onAddNew} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Thêm địa chỉ
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onDelete={() => setConfirm({ type: "delete", id: address.id })}
              onSetDefault={() => setConfirm({ type: "setDefault", id: address.id })}
              onEdit={onEdit ? () => onEdit(address) : undefined}
            />
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "delete" ? "Xóa địa chỉ" : "Đặt làm mặc định"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "delete"
                ? "Bạn có chắc muốn xóa địa chỉ này? Hành động không thể hoàn tác."
                : "Bạn muốn đặt địa chỉ này làm địa chỉ mặc định?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                const id = confirm.id;
                setConfirm(null);
                if (confirm.type === "delete") {
                  handleDelete(id);
                } else {
                  handleSetDefault(id);
                }
              }}
            >
              {confirm?.type === "delete" ? "Xóa" : "Đặt mặc định"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

AddressList.displayName = "AddressList";

export default AddressList;

