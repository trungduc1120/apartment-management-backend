import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HouseHoldStatusMap, InformationStatusMap, getDisplayValue } from "@/lib/enums";

export interface HouseholdInfo {
  houseHoldCode: string;
  apartmentNumber: string;
  buildingNumber: string;
  street: string;
  ward: string;
  province: string;
  status: string;
  informationStatus?: string;
  head: string;
  numMotorbike?: number;
  numCars?: number;
}

interface HouseholdInfoCardProps {
  info: HouseholdInfo;
  onEdit: () => void;
  disableEdit?: boolean;
}

export const HouseholdInfoCard = ({ info, onEdit, disableEdit }: HouseholdInfoCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">
          Thông tin hộ khẩu của bạn
        </CardTitle>
        <Button onClick={onEdit} variant="outline" size="sm" className="gap-2" disabled={disableEdit} title={disableEdit ? "Không thể chỉnh sửa khi thông tin ở trạng thái kết thúc/xóa" : undefined}>
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Mã hộ khẩu" value={info.houseHoldCode} />
          <InfoItem label="Số căn hộ" value={info.apartmentNumber} />
          <InfoItem label="Chủ hộ" value={info.head} />
          <InfoItem label="Tòa nhà" value={info.buildingNumber} />
          <InfoItem label="Đường" value={info.street} />
          <InfoItem label="Phường" value={info.ward} />
          <InfoItem label="Tỉnh/Thành" value={info.province} />
          <InfoItem label="Số xe máy" value={String(info.numMotorbike ?? 0)} />
          <InfoItem label="Số xe ô tô" value={String(info.numCars ?? 0)} />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
            <Badge variant={info.status === "ACTIVE" ? "default" : "secondary"} className="bg-primary">
              {getDisplayValue(info.status, HouseHoldStatusMap)}
            </Badge>
          </div>
          <InfoItem
            label="T.T. thông tin"
            value={getDisplayValue(info.informationStatus, InformationStatusMap)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm font-medium text-muted-foreground">{label}:</span>
    <span className="text-base text-foreground">{value}</span>
  </div>
);
