import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import adminFeaturedService, { type StatsParams, type EntityType } from "@/services/adminFeaturedService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Pin, PinOff, BarChart3, Star } from "lucide-react";

const entityTypes: EntityType[] = ["product", "shop", "category"];

function toISO(dt?: string): string | undefined {
  if (!dt) return undefined;
  try {
    // datetime-local produces local time; convert to ISO
    const d = new Date(dt);
    return d.toISOString();
  } catch {
    return undefined;
  }
}

function isGuid(value: string): boolean {
  // Basic GUID v4 pattern (accept both lowercase/uppercase)
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

export default function AdminFeatured() {
  // Pin/Unpin form state
  const [pinEntityType, setPinEntityType] = useState<EntityType>("product");
  const [pinEntityId, setPinEntityId] = useState("");
  const [pinned, setPinned] = useState(true);
  const [expiresAtLocal, setExpiresAtLocal] = useState<string>("");
  const isValidId = isGuid(pinEntityId.trim());

  const pinMutation = useMutation({
    mutationFn: async () => {
      return adminFeaturedService.pin({
        entityType: pinEntityType,
        entityId: pinEntityId.trim(),
        pinned,
        expiresAt: toISO(expiresAtLocal),
      });
    },
  });

  // Stats filters
  const [statsEntityType, setStatsEntityType] = useState<EntityType | undefined>(undefined);
  const [statsEntityId, setStatsEntityId] = useState<string>("");
  const [fromLocal, setFromLocal] = useState<string>("");
  const [toLocal, setToLocal] = useState<string>("");
  const [topN, setTopN] = useState<number>(10);

  const statsParams: StatsParams = useMemo(() => ({
    entityType: statsEntityType,
    entityId: statsEntityId.trim() || undefined,
    from: toISO(fromLocal),
    to: toISO(toLocal),
    topN,
  }), [statsEntityType, statsEntityId, fromLocal, toLocal, topN]);

  // Use a primitive-only query key to avoid serialization/runtime issues
  const statsKey = useMemo(
    () => [
      "adminFeaturedStats",
      statsParams.entityType ?? "",
      statsParams.entityId ?? "",
      statsParams.from ?? "",
      statsParams.to ?? "",
      String(statsParams.topN ?? ""),
    ],
    [statsParams],
  );

  const statsQuery = useQuery({
    queryKey: statsKey,
    queryFn: async () => adminFeaturedService.getStats(statsParams),
    retry: 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Star className="h-6 w-6 text-rose-600" /> Featured Content
        </h2>
        <p className="text-muted-foreground">Quản trị nội dung nổi bật: pin/unpin và xem thống kê.</p>
      </div>

      {/* Pin/Unpin */}
      <Card>
        <CardHeader>
          <CardTitle>Pin/Unpin Featured</CardTitle>
          <CardDescription>Ưu tiên hiển thị một entity trong danh sách nổi bật.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={pinEntityType} onValueChange={(v: EntityType) => setPinEntityType(v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                <SelectContent>
                  {entityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity ID</label>
              <Input
                value={pinEntityId}
                onChange={(e) => setPinEntityId(e.target.value)}
                placeholder="vd. 123e4567-e89b-12d3-a456-426614174000"
                className={!isValidId && pinEntityId ? "border-red-500" : undefined}
              />
              {!isValidId && pinEntityId && (
                <p className="text-xs text-red-600">ID phải là GUID hợp lệ</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hết hạn (tùy chọn)</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" value={expiresAtLocal} onChange={(e) => setExpiresAtLocal(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <div className="flex items-center gap-2">
                <Badge variant={pinned ? "default" : "secondary"}>{pinned ? "Pinned" : "Unpinned"}</Badge>
                <Button variant="outline" onClick={() => setPinned((v) => !v)}>
                  {pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}Toggle
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => pinMutation.mutate()}
              className="bg-gradient-to-r from-[#e91e63] to-[#f43f5e]"
              disabled={!isValidId || pinMutation.isPending}
            >
              {pinned ? <Pin className="h-4 w-4 mr-2" /> : <PinOff className="h-4 w-4 mr-2" />} {pinned ? "Pin" : "Unpin"}
            </Button>
            {pinMutation.isSuccess && (
              <span className="text-sm text-green-600">Thành công</span>
            )}
            {pinMutation.isError && (
              <span className="text-sm text-red-600">Không thể cập nhật</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Stats</CardTitle>
          <CardDescription>Thống kê Clicks/Impressions/AddsToCart theo thời gian và đối tượng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type (tùy chọn)</label>
              <Select
                value={statsEntityType ?? "all"}
                onValueChange={(v) => setStatsEntityType(v === "all" ? undefined : (v as EntityType))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {entityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity ID (tùy chọn)</label>
              <Input value={statsEntityId} onChange={(e) => setStatsEntityId(e.target.value)} placeholder="Nhập ID cụ thể nếu muốn" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Top N</label>
              <Input type="number" value={topN} onChange={(e) => setTopN(Math.max(1, Number(e.target.value) || 1))} min={1} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <Input type="datetime-local" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Input type="datetime-local" value={toLocal} onChange={(e) => setToLocal(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => statsQuery.refetch()} disabled={statsQuery.isFetching}>
              <BarChart3 className="h-4 w-4 mr-2" /> Load stats
            </Button>
            {statsQuery.isFetching && <span className="text-sm text-muted-foreground">Đang tải...</span>}
          </div>

          {statsQuery.isError && (
            <div className="text-sm text-red-600">
              Không thể tải thống kê. Vui lòng kiểm tra kết nối hoặc cấu hình endpoint.
            </div>
          )}

          {statsQuery.data && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-rose-200">
                <CardHeader><CardTitle>Clicks</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-semibold">{statsQuery.data.totals?.clicks ?? 0}</p></CardContent>
              </Card>
              <Card className="border-rose-200">
                <CardHeader><CardTitle>Impressions</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-semibold">{statsQuery.data.totals?.impressions ?? 0}</p></CardContent>
              </Card>
              <Card className="border-rose-200">
                <CardHeader><CardTitle>Adds To Cart</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-semibold">{statsQuery.data.totals?.addsToCart ?? 0}</p></CardContent>
              </Card>
            </div>
          )}

          {statsQuery.data?.top && statsQuery.data.top.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Top Entities</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Adds To Cart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsQuery.data.top.map((t) => (
                    <TableRow key={`${t.entityType}-${t.entityId}`}>
                      <TableCell>{t.entityType}</TableCell>
                      <TableCell className="font-mono text-xs">{t.entityId}</TableCell>
                      <TableCell>{t.totals?.clicks ?? 0}</TableCell>
                      <TableCell>{t.totals?.impressions ?? 0}</TableCell>
                      <TableCell>{t.totals?.addsToCart ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}