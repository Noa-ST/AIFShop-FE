import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  addressService,
  CreateAddress,
  UpdateAddress,
  GetAddressDto,
} from "@/services/addressService";
import { AddressValidator } from "@/utils/addressValidator";
import ProvinceDistrictSelector from "./ProvinceDistrictSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { assertServiceSuccess } from "@/services/types";

// Zod schema for validation
const addressSchema = z.object({
  recipientName: z
    .string()
    .min(1, "Tên người nhận là bắt buộc")
    .max(100, "Tên người nhận không được vượt quá 100 ký tự"),
  phoneNumber: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(
      /^(0|\+84)[1-9][0-9]{8,9}$/,
      "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0 hoặc +84)."
    ),
  fullStreet: z
    .string()
    .min(1, "Địa chỉ đường là bắt buộc")
    .max(200, "Địa chỉ đường không được vượt quá 200 ký tự"),
  ward: z
    .string()
    .min(1, "Phường/Xã là bắt buộc")
    .max(100, "Phường/Xã không được vượt quá 100 ký tự"),
  district: z
    .string()
    .min(1, "Quận/Huyện là bắt buộc")
    .max(100, "Quận/Huyện không được vượt quá 100 ký tự"),
  province: z
    .string()
    .min(1, "Tỉnh/Thành phố là bắt buộc")
    .max(100, "Tỉnh/Thành phố không được vượt quá 100 ký tự"),
  country: z.string().max(50, "Quốc gia không được vượt quá 50 ký tự").optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  address?: GetAddressDto; // Edit mode if provided
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddressForm({
  address,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: "",
      phoneNumber: "",
      fullStreet: "",
      ward: "",
      district: "",
      province: "",
      country: "Việt Nam",
      isDefault: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (address) {
      form.reset({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        fullStreet: address.fullStreet,
        ward: address.ward,
        district: address.district,
        province: address.province,
        country: address.country || "Việt Nam",
        isDefault: address.isDefault,
      });
    }
  }, [address, form]);

  const handleProvinceDistrictChange = (
    province: string,
    district: string,
    ward: string
  ) => {
    form.setValue("province", province);
    form.setValue("district", district);
    form.setValue("ward", ward);
    form.clearErrors(["province", "district", "ward"]);
  };

  const onSubmit = async (data: AddressFormData) => {
    setLoading(true);
    setGeneralError(null);

    try {
      const cleanPhone = AddressValidator.formatPhoneNumber(data.phoneNumber);

      let response;
      if (address) {
        // ✅ Trim tất cả fields để match với duplicate check của backend
        const updateData: UpdateAddress = {
          id: address.id,
          recipientName: data.recipientName.trim(),
          phoneNumber: cleanPhone,
          fullStreet: data.fullStreet.trim(),
          ward: data.ward.trim(),
          district: data.district.trim(),
          province: data.province.trim(),
          country: (data.country || "Việt Nam").trim(),
          isDefault: data.isDefault || false,
        };

        response = await addressService.update(address.id, updateData);
      } else {
        // ✅ Trim tất cả fields để match với duplicate check của backend (case-insensitive, trim)
        const createData: CreateAddress = {
          recipientName: data.recipientName.trim(),
          phoneNumber: cleanPhone,
          fullStreet: data.fullStreet.trim(),
          ward: data.ward.trim(),
          district: data.district.trim(),
          province: data.province.trim(),
          country: (data.country || "Việt Nam").trim(),
          isDefault: data.isDefault || false,
        };

        // Kiểm tra trùng lặp địa chỉ phía client
        const listResp = await addressService.getList();
        const list = listResp.Succeeded ? (listResp.Data || []) : [];
        const isDup = list.some((a) =>
          a.fullStreet.trim().toLowerCase() === createData.fullStreet.toLowerCase() &&
          a.ward.trim().toLowerCase() === createData.ward.toLowerCase() &&
          a.district.trim().toLowerCase() === createData.district.toLowerCase() &&
          a.province.trim().toLowerCase() === createData.province.toLowerCase()
        );
        if (isDup) {
          form.setError("fullStreet", {
            type: "manual",
            message: "Địa chỉ này đã tồn tại",
          });
          setGeneralError("Địa chỉ này đã tồn tại. Vui lòng kiểm tra lại.");
          toast({
            title: "Trùng địa chỉ",
            description: "Địa chỉ đã có trong danh sách của bạn.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        response = await addressService.create(createData);
      }

      console.log("📥 Response received:", response); // Debug

      if (response.Succeeded) {
        toast({
          title: "Thành công",
          description: response.Message || (address ? "Cập nhật địa chỉ thành công." : "Thêm địa chỉ giao hàng thành công."),
        });
        onSuccess?.();
        if (!address) {
          // Reset form if creating new
          form.reset({
            recipientName: "",
            phoneNumber: "",
            fullStreet: "",
            ward: "",
            district: "",
            province: "",
            country: "Việt Nam",
            isDefault: false,
          });
        }
      } else {
        // ✅ Handle business logic errors (duplicate, max count, etc.)
        const errorMsg = response.Message || "Đã xảy ra lỗi";
        console.error("❌ Create failed:", errorMsg);
        setGeneralError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Error creating address:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);

      // ✅ Handle ModelState errors (400 with field errors)
      if (error?.response?.status === 400) {
        const errorData = error.response.data;
        
        // Check if it's ModelState format (object with field names)
        if (typeof errorData === 'object' && !errorData.succeeded && !errorData.message && !errorData.Message) {
          // ModelState format: { "fieldName": ["error1", "error2"] }
          const fieldErrors: string[] = [];
          Object.keys(errorData).forEach(field => {
            const messages = Array.isArray(errorData[field]) 
              ? errorData[field] 
              : [errorData[field]];
            fieldErrors.push(...messages);
          });
          
          const errorMessage = fieldErrors.join(". ") || "Dữ liệu không hợp lệ";
          setGeneralError(errorMessage);
          toast({
            title: "Lỗi validation",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
        
        // ✅ Handle ServiceResponse format errors (business logic errors)
        const errorMessage =
          errorData?.Message ||
          errorData?.message ||
          errorData?.title ||
          "Dữ liệu không hợp lệ";
        
        setGeneralError(errorMessage);
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (error?.response?.status === 401) {
        // ✅ Handle 401 Unauthorized
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại.",
          variant: "destructive",
        });
      } else {
        // ✅ Handle network/other errors
        const errorMessage =
          error?.response?.data?.Message ||
          error?.response?.data?.message ||
          error?.message ||
          "Đã xảy ra lỗi. Vui lòng thử lại.";
        setGeneralError(errorMessage);
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ---- Early duplicate check (debounced on fullStreet blur) ----
  const [existingAddresses, setExistingAddresses] = useState<GetAddressDto[]>([]);
  const duplicateTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await addressService.getList();
        const data = assertServiceSuccess<GetAddressDto[]>(res, "Không thể tải danh sách địa chỉ");
        if (mounted) setExistingAddresses(data || []);
      } catch (_) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
      if (duplicateTimer.current) {
        clearTimeout(duplicateTimer.current);
      }
    };
  }, []);

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const composeKey = (fullStreet: string, ward: string, district: string, province: string) =>
    normalize(`${fullStreet}, ${ward}, ${district}, ${province}`);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {generalError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md" aria-live="polite">
            {generalError}
          </div>
        )}

        <FormField
          control={form.control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên người nhận *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nguyễn Văn A"
                  maxLength={100}
                  autoFocus={!address}
                  autoComplete="name"
                  {...field}
                  onBlur={() => field.onChange((field.value || "").trim())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="0912345678 hoặc +84912345678"
                  maxLength={13}
                  autoComplete="tel"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "");
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullStreet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số nhà + Tên đường *</FormLabel>
              <FormControl>
                <Input
                  placeholder="358/14/15 Nguyễn Thái Học"
                  maxLength={200}
                  autoComplete="address-line1"
                  {...field}
                  onBlur={() => {
                    const trimmed = (field.value || "").replace(/\s+/g, " ").trim();
                    field.onChange(trimmed);
                    // Debounce cảnh báo trùng lặp sớm chỉ khi đang tạo mới
                    if (!address) {
                      if (duplicateTimer.current) clearTimeout(duplicateTimer.current);
                      duplicateTimer.current = window.setTimeout(() => {
                        const ward = (form.getValues("ward") || "").trim();
                        const district = (form.getValues("district") || "").trim();
                        const province = (form.getValues("province") || "").trim();
                        if (trimmed && ward && district && province && existingAddresses.length > 0) {
                          const key = composeKey(trimmed, ward, district, province);
                          const isDup = existingAddresses.some((a) =>
                            composeKey(a.fullStreet, a.ward, a.district, a.province) === key
                          );
                          if (isDup) {
                            form.setError("fullStreet", {
                              type: "manual",
                              message: "Địa chỉ này đã tồn tại trong danh sách của bạn.",
                            });
                          }
                        }
                      }, 600);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Tỉnh/Thành phố, Quận/Huyện, Phường/Xã *</Label>
          <ProvinceDistrictSelector
            initialProvince={form.watch("province")}
            initialDistrict={form.watch("district")}
            initialWard={form.watch("ward")}
            onChange={handleProvinceDistrictChange}
          />
          {form.formState.errors.province && (
            <p className="text-sm text-destructive">
              {form.formState.errors.province.message}
            </p>
          )}
          {form.formState.errors.district && (
            <p className="text-sm text-destructive">
              {form.formState.errors.district.message}
            </p>
          )}
          {form.formState.errors.ward && (
            <p className="text-sm text-destructive">
              {form.formState.errors.ward.message}
            </p>
          )}
          {/* Xem bản đồ */}
          {(() => {
            const fullStreet = (form.watch("fullStreet") || "").trim();
            const ward = (form.watch("ward") || "").trim();
            const district = (form.watch("district") || "").trim();
            const province = (form.watch("province") || "").trim();
            const hasAll = fullStreet && ward && district && province;
            if (!hasAll) return null;
            const query = encodeURIComponent(
              `${fullStreet}, ${ward}, ${district}, ${province}, Việt Nam`
            );
            const href = `https://www.google.com/maps/search/?api=1&query=${query}`;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <MapPin className="w-3 h-3" aria-hidden="true" />
                Xem bản đồ
              </a>
            );
          })()}
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quốc gia</FormLabel>
              <FormControl>
                <Input
                  placeholder="Việt Nam"
                  maxLength={50}
                  autoComplete="country-name"
                  readOnly
                  {...field}
                  value={field.value || "Việt Nam"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Hủy
            </Button>
          )}
          <Button type="submit" disabled={loading || !form.formState.isValid}>
            {loading ? "Đang lưu..." : address ? "Cập nhật" : "Thêm địa chỉ"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

