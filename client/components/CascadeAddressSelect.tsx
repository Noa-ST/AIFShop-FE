import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Ward = { code: string; name: string };
type District = { code: string; name: string; wards: Ward[] };
type Province = { code: string; name: string; districts: District[] };

export type AddressValue = {
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
};

export function CascadeAddressSelect({
  value,
  onChange,
  disabled,
  fetchUrl,
}: {
  value?: AddressValue;
  onChange?: (v: AddressValue & { labels: { province?: string; district?: string; ward?: string }; fullText: string }) => void;
  disabled?: boolean;
  fetchUrl?: string;
}) {
  const [data, setData] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [usedFallback, setUsedFallback] = useState<boolean>(false);
  const [provinceCode, setProvinceCode] = useState<string>(value?.provinceCode ?? "");
  const [districtCode, setDistrictCode] = useState<string>(value?.districtCode ?? "");
  const [wardCode, setWardCode] = useState<string>(value?.wardCode ?? "");

  useEffect(() => {
    let cancelled = false;

    function normalize(raw: any): Province[] {
      // Try to find the provinces array in various common shapes
      const candidates = [raw, raw?.data, raw?.results, raw?.provinces, raw?.level1s];
      const provincesRaw = candidates.find((c) => Array.isArray(c)) || [];

      const normalizeWards = (wRaw: any[]): Ward[] =>
        (wRaw || [])
          .map((w) => ({
            code: String(w?.code ?? w?.level3_id ?? w?.id ?? w?.value ?? "").trim(),
            name: String(w?.name ?? w?.name_with_type ?? w?.full_name ?? w?.label ?? "").trim(),
          }))
          .filter((w) => w.code.length > 0 && w.name.length > 0);

      const normalizeDistricts = (dRaw: any[]): District[] =>
        (dRaw || [])
          .map((d) => ({
            code: String(d?.code ?? d?.level2_id ?? d?.id ?? d?.value ?? "").trim(),
            name: String(d?.name ?? d?.name_with_type ?? d?.full_name ?? d?.label ?? "").trim(),
            wards: normalizeWards(d?.wards ?? d?.children ?? d?.level3s ?? []),
          }))
          .filter((d) => d.code.length > 0 && d.name.length > 0);

      // Deduplicate by code
      const seen = new Set<string>();
      return (provincesRaw as any[])
        .map((p) => ({
          code: String(p?.code ?? p?.level1_id ?? p?.id ?? p?.value ?? "").trim(),
          name: String(p?.name ?? p?.name_with_type ?? p?.full_name ?? p?.label ?? "").trim(),
          districts: normalizeDistricts(p?.districts ?? p?.children ?? p?.level2s ?? []),
        }))
        .filter((p) => p.code.length > 0 && p.name.length > 0 && (seen.has(p.code) ? false : (seen.add(p.code), true)));
    }

    async function load() {
      setIsLoading(true);
      setUsedFallback(false);
      
      // Try primary source if provided
      if (fetchUrl) {
        try {
          const res = await fetch(fetchUrl);
          const json = await res.json();
          const normalized = normalize(json);
          if (!cancelled && Array.isArray(normalized) && normalized.length > 0) {
            setData(normalized);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to load from custom URL", e);
        }
      }

      // Fallback #1: Try jsDelivr CDN
      try {
        const res2 = await fetch("https://cdn.jsdelivr.net/gh/daohoangson/dvhcvn@master/data/dvhcvn.json");
        const json2 = await res2.json();
        const normalized2 = normalize(json2);
        if (!cancelled && Array.isArray(normalized2) && normalized2.length > 0) {
          setData(normalized2);
          setIsLoading(false);
          return;
        }
      } catch (e2) {
        console.warn("Fallback CDN failed", e2);
      }
      
      // Fallback #2: Try raw GitHub
      try {
        const res3 = await fetch("https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/dvhcvn.json");
        const json3 = await res3.json();
        const normalized3 = normalize(json3);
        if (!cancelled && Array.isArray(normalized3) && normalized3.length > 0) {
          setData(normalized3);
          setIsLoading(false);
          return;
        }
      } catch (e3) {
        console.warn("Fallback raw GitHub failed", e3);
      }

      // Fallback #3: Minimal built-in dataset (HN/HCM only)
      const fallback: Province[] = [
        {
          code: "01",
          name: "Hà Nội",
          districts: [
            {
              code: "0101",
              name: "Quận Ba Đình",
              wards: [
                { code: "010101", name: "Phường Phúc Xá" },
                { code: "010102", name: "Phường Trúc Bạch" },
              ],
            },
            {
              code: "0102",
              name: "Quận Hoàn Kiếm",
              wards: [
                { code: "010201", name: "Phường Chương Dương" },
                { code: "010202", name: "Phường Hàng Bạc" },
              ],
            },
          ],
        },
        {
          code: "79",
          name: "TP. Hồ Chí Minh",
          districts: [
            {
              code: "7901",
              name: "Quận 1",
              wards: [
                { code: "790101", name: "Phường Bến Nghé" },
                { code: "790102", name: "Phường Bến Thành" },
              ],
            },
            {
              code: "7907",
              name: "Quận 7",
              wards: [
                { code: "790701", name: "Phường Tân Phong" },
                { code: "790702", name: "Phường Tân Phú" },
              ],
            },
          ],
        },
      ];

      if (!cancelled) {
        setData(fallback);
        setIsLoading(false);
        setUsedFallback(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  // Reset lower levels when changed
  useEffect(() => {
    setDistrictCode("");
    setWardCode("");
  }, [provinceCode]);

  useEffect(() => {
    setWardCode("");
  }, [districtCode]);

  const province = useMemo(() => (Array.isArray(data) ? data.find((p) => p.code === provinceCode) : undefined), [data, provinceCode]);
  const district = useMemo(() => province?.districts.find((d) => d.code === districtCode), [province, districtCode]);
  const ward = useMemo(() => district?.wards.find((w) => w.code === wardCode), [district, wardCode]);

  useEffect(() => {
    const labels = { province: province?.name, district: district?.name, ward: ward?.name };
    const fullText = [labels.ward, labels.district, labels.province].filter(Boolean).join(", ");
    onChange?.({ provinceCode, districtCode, wardCode, labels, fullText });
  }, [provinceCode, districtCode, wardCode, province?.name, district?.name, ward?.name]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Select value={provinceCode ? provinceCode : ""} onValueChange={setProvinceCode} disabled={disabled || isLoading || data.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder="Tỉnh/Thành phố" />
        </SelectTrigger>
        <SelectContent>
          {data
            .filter((p) => p.code && p.name)
            .map((p) => (
              <SelectItem key={p.code} value={p.code}>
                {p.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select value={districtCode ? districtCode : ""} onValueChange={setDistrictCode} disabled={disabled || !province}>
        <SelectTrigger>
          <SelectValue placeholder="Quận/Huyện/TP" />
        </SelectTrigger>
        <SelectContent>
          {province?.districts
            .filter((d) => d.code && d.name)
            .map((d) => (
              <SelectItem key={d.code} value={d.code}>
                {d.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select value={wardCode ? wardCode : ""} onValueChange={setWardCode} disabled={disabled || !district}>
        <SelectTrigger>
          <SelectValue placeholder="Phường/Xã/Thị trấn" />
        </SelectTrigger>
        <SelectContent>
          {district?.wards
            .filter((w) => w.code && w.name)
            .map((w) => (
              <SelectItem key={w.code} value={w.code}>
                {w.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="md:col-span-3 text-xs text-slate-500">Đang tải danh sách tỉnh/thành...</div>
      ) : usedFallback ? (
        <div className="md:col-span-3 text-xs text-amber-600">Đang dùng dữ liệu mặc định (HN, HCM) do không tải được dữ liệu đầy đủ.</div>
      ) : null}
    </div>
  );
}

export function resolveProvinceNameByCode(data: Province[], code?: string) {
  return data.find((p) => p.code === code)?.name || "";
}

