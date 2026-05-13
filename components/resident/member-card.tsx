import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface Member {
  id: string;
  fullname: string;
  nationalId: string;
  relationshipToHead: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  email: string;
  phoneNumber: string;
  workingAdress: string;
  placeOfOrigin: string;
  residentStatus?: string;
  informationStatus?: string;
}

interface MemberCardProps {
  member: Member;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  disabledActions?: boolean;
}

export const MemberCard = ({ member, onEdit, onDelete, disabledActions }: MemberCardProps) => {
  const status = (member.informationStatus || "").toUpperCase()
  const locked = status === "DELETING" || status === "ENDED"
  const disabled = !!disabledActions || locked
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{member.fullname}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{member.relationshipToHead}</Badge>
                {member.informationStatus && (() => {
                  const status = member.informationStatus
                  let variant: "secondary" | "destructive" | undefined = undefined
                  if (/REJECT|DELETE/i.test(status)) variant = "destructive"
                  else if (/PEND/i.test(status)) variant = "secondary"
                  return <Badge variant={variant}>{status}</Badge>
                })()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(member.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={disabled}
              title={disabled ? "Không thể chỉnh sửa khi thông tin ở trạng thái kết thúc/xóa" : undefined}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDelete(member.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={disabled}
              title={disabled ? "Không thể xóa khi thông tin ở trạng thái kết thúc/xóa" : undefined}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <MemberInfo label="CCCD/CMND" value={<span className="font-bold">{member.nationalId}</span>} />
          <MemberInfo label="Ngày sinh" value={<span className="font-bold">{formatDate(member.dateOfBirth)}</span>} />
          <MemberInfo label="Giới tính" value={<span className="font-semibold">{member.gender}</span>} />
          <MemberInfo label="Nghề nghiệp" value={<span className="font-semibold">{member.occupation}</span>} />
          <MemberInfo label="Nơi làm việc" value={<span className="font-semibold">{member.workingAdress}</span>} />
          <MemberInfo label="Quê quán" value={<span className="font-semibold">{member.placeOfOrigin}</span>} />
          {member.email && <MemberInfo label="Email" value={<span className="font-semibold">{member.email}</span>} />}
          <MemberInfo label="SĐT" value={<span className="font-semibold">{member.phoneNumber}</span>} />
          <MemberInfo label="Trạng thái cư trú" value={<span className="font-semibold">{formatResidenceStatus(member.residentStatus)}</span>} />
        </div>
      </CardContent>
    </Card>
  );
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function formatResidenceStatus(status?: string) {
  if (!status) return "-"
  const s = String(status).trim().toUpperCase()
  switch (s) {
    case "NORMAL":
      return "Bình thường"
    case "TEMP_ABSENT":
      return "Tạm vắng"
    case "MOVE_OUT":
      return "Chuyển đi"
    case "TEMP_RESIDENT":
      return "Tạm trú"
    default:
      // fallback: try some fuzzy checks
      const low = s.toLowerCase()
      if (low.includes("absent") || low.includes("vang")) return "Tạm vắng"
      if (low.includes("resident") || low.includes("tru")) return "Tạm trú"
      return status
  }
}

const MemberInfo = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <span className="text-muted-foreground">{label}: </span>
    <span className="text-foreground">{value}</span>
  </div>
);