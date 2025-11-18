import { GetAddressDto } from "@/services/addressService";
import { addressService } from "@/services/addressService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Phone, Edit, Trash2, Star } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AddressCardProps {
  address: GetAddressDto;
  onDelete: () => void;
  onSetDefault: () => void;
  onEdit?: () => void;
}

export default function AddressCard({
  address,
  onDelete,
  onSetDefault,
  onEdit,
}: AddressCardProps) {
  const fullAddress = addressService.formatFullAddress(address);

  return (
    <Card
      className={cn(
        "relative transition-all hover:shadow-md",
        address.isDefault && "border-primary border-2"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{address.recipientName}</h3>
              {address.isDefault && (
                <Badge variant="default" className="bg-primary">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Mặc định
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{address.phoneNumber}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {fullAddress}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t">
          {!address.isDefault && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSetDefault}
                  className="flex-1 min-w-[120px]"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Đặt mặc định
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Đặt địa chỉ này làm mặc định
              </TooltipContent>
            </Tooltip>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 min-w-[120px]"
            >
              <Edit className="w-4 h-4 mr-1" />
              Chỉnh sửa
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex-1 min-w-[120px]"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

