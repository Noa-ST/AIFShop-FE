import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { addressService, GetAddressDto } from "@/services/addressService";
import AddressCard from "./AddressCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
    if (
      !window.confirm("Bạn có chắc muốn xóa địa chỉ này?")
    )
      return;

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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

      {addresses.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => handleSetDefault(address.id)}
              onEdit={onEdit ? () => onEdit(address) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
});

AddressList.displayName = "AddressList";

export default AddressList;

