import { useEffect, useState } from "react";
import { CascadeAddressSelect, AddressValue } from "@/components/CascadeAddressSelect";

interface ProvinceDistrictSelectorProps {
  initialProvince?: string;
  initialDistrict?: string;
  initialWard?: string;
  onChange: (province: string, district: string, ward: string) => void;
  disabled?: boolean;
}

export default function ProvinceDistrictSelector({
  initialProvince,
  initialDistrict,
  initialWard,
  onChange,
  disabled,
}: ProvinceDistrictSelectorProps) {
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [districtCode, setDistrictCode] = useState<string>("");
  const [wardCode, setWardCode] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  // Initialize with initial values (by name, codes will be empty initially)
  // The CascadeAddressSelect will work but won't pre-select if we don't have codes
  // This is acceptable - user can re-select when editing
  useEffect(() => {
    if (initialProvince && initialDistrict && initialWard && !initialized) {
      // Call onChange with initial values so form has them
      onChange(initialProvince, initialDistrict, initialWard);
      setInitialized(true);
    }
  }, [initialProvince, initialDistrict, initialWard, initialized, onChange]);

  const handleAddressChange = (value: AddressValue & {
    labels: { province?: string; district?: string; ward?: string };
    fullText: string;
  }) => {
    setProvinceCode(value.provinceCode || "");
    setDistrictCode(value.districtCode || "");
    setWardCode(value.wardCode || "");
    // Đồng bộ liên tục về form: nếu thiếu cấp dưới, gửi chuỗi rỗng để reset
    onChange(
      value.labels.province || "",
      value.labels.district || "",
      value.labels.ward || ""
    );
  };

  return (
    <div className="province-district-ward-selector">
      <CascadeAddressSelect
        value={{
          provinceCode,
          districtCode,
          wardCode,
        }}
        onChange={handleAddressChange}
        disabled={disabled}
      />
    </div>
  );
}

