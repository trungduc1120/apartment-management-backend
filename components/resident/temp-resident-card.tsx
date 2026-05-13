import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Member } from "./member-card";
import { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { deleteTempResidentByTemRoute, deleteTempAbsent } from "@/lib/api/api";
import { ConfirmDeleteTempResident } from "./confirm-delete-temp-resident";

export interface TempResident {
  id: number;
  residentId: number;
  householdId: number;
  startDate: string;
  endDate: string;
  reason: string;
  address: string;
  informationStatus: string;
  submittedUserId?: number;
  submittedAt?: string;
  reviewedAdminId?: number | null;
  reviewedAt?: string | null;
  resident: Member;
}

export enum InformationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

interface TempResidentCardProps {
  tempRes: TempResident;
  onEdit: (temp: TempResident) => void;
  onDelete: (id: string) => void;
  onDeleteSuccess?: () => void;
}

export const TempResidentCard = ({ tempRes, onEdit, onDelete, onDeleteSuccess }: TempResidentCardProps) => {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const openConfirm = () => {
    const ta = (tempRes as any).TemporaryAbsence?.[0]
    const status = ta?.informationStatus ?? (tempRes as any).informationStatus
    if (status === "APPROVED") {
      setConfirmError("Không thể xóa đăng ký đã được xác nhận")
      setConfirmOpen(true)
      return
    }
    setConfirmError("")
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setConfirmError("")
    try {
      // determine registration id and whether this is an "absent" shape
      const ta = (tempRes as any).TemporaryAbsence?.[0]
      const isAbsent = !!ta
      const registrationId = isAbsent ? ta.id : (tempRes as any).id

      console.log(`[DEBUG] Deleting registration id=${registrationId} (absent=${isAbsent})`)

      // If parent supplied onDelete, delegate deletion to parent to avoid duplicate API calls
      if (onDelete) {
        // allow parent to handle deletion (may be async)
        await onDelete(String(registrationId))
      } else {
        if (isAbsent) {
          await deleteTempAbsent(registrationId, token ?? undefined)
        } else {
          await deleteTempResidentByTemRoute(registrationId, token ?? undefined)
        }
      }

      console.log(`[DEBUG] Successfully deleted registration ${registrationId}`)
      setConfirmOpen(false)
      // notify parent once (parent handler already executed when awaited above)
      onDeleteSuccess?.()
    } catch (err) {
      console.error("[ERROR] Failed to delete registration:", err)
      const msg = err instanceof Error ? err.message : String(err)
      // handle known backend ForbiddenException messages
      if (/You can't update approved registration/i.test(msg)) {
        setConfirmError("Không thể xóa đăng ký đã được duyệt")
      } else if (/You are't allow to delete/i.test(msg) || /You aren't allow to delete/i.test(msg) || /not allow to delete/i.test(msg)) {
        setConfirmError("Bạn không có quyền xóa đăng ký này")
      } else {
        setConfirmError(msg)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Normalize shapes:
  // - Existing API for temp-resident: { ..., resident: Member, startDate, endDate, ... }
  // - Temp-absent API used by backend (example): resident fields are top-level and TemporaryAbsence: [ { startDate, endDate, ... } ]
  let residentData: any = (tempRes as any).resident
  let startDate = (tempRes as any).startDate
  let endDate = (tempRes as any).endDate
  let reason = (tempRes as any).reason
  let infoStatus = tempRes.informationStatus
  let destination = (tempRes as any).address

  if (!residentData && (tempRes as any).TemporaryAbsence) {
    // build resident object from top-level fields
    residentData = {
      id: String((tempRes as any).id),
      fullname: (tempRes as any).fullname,
      nationalId: (tempRes as any).nationalId,
      dateOfBirth: (tempRes as any).dateOfBirth,
      gender: (tempRes as any).gender,
      occupation: (tempRes as any).occupation,
      email: (tempRes as any).email,
      phoneNumber: (tempRes as any).phoneNumber,
      workingAdress: (tempRes as any).workingAdress,
      placeOfOrigin: (tempRes as any).placeOfOrigin,
      relationshipToHead: (tempRes as any).relationshipToHead,
    }
    const ta = (tempRes as any).TemporaryAbsence[0]
    startDate = ta?.startDate
    endDate = ta?.endDate
    reason = ta?.reason
    destination = ta?.destination ?? destination
    infoStatus = ta?.informationStatus ?? infoStatus
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{residentData?.fullname ?? "-"}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{residentData?.relationshipToHead ?? "-"}</Badge>
                {infoStatus && (() => {
                  const status = infoStatus
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
              onClick={() => onEdit(tempRes)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              onClick={openConfirm}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <MemberInfo label="CCCD/CMND" value={<span className="font-bold">{residentData?.nationalId ?? "-"}</span>} />
          <MemberInfo label="Ngày sinh" value={<span className="font-bold">{formatDate(residentData?.dateOfBirth)}</span>} />
          <MemberInfo label="Giới tính" value={<span className="font-semibold">{residentData?.gender ?? "-"}</span>} />
          <MemberInfo label="Nghề nghiệp" value={<span className="font-semibold">{residentData?.occupation ?? "-"}</span>} />
          <MemberInfo label="Nơi làm việc" value={<span className="font-semibold">{residentData?.workingAdress ?? "-"}</span>} />
          <MemberInfo label="Quê quán" value={<span className="font-semibold">{residentData?.placeOfOrigin ?? "-"}</span>} />
          {residentData?.email && <MemberInfo label="Email" value={<span className="font-semibold">{residentData?.email}</span>} />}
          <MemberInfo label="SĐT" value={<span className="font-semibold">{residentData?.phoneNumber ?? "-"}</span>} />
          <MemberInfo label="Địa chỉ (đến)" value={<span className="font-semibold">{destination ?? "-"}</span>} />
          <MemberInfo label="Ngày bắt đầu" value={<span className="font-semibold">{formatDate(startDate)}</span>} />
          <MemberInfo label="Ngày kết thúc" value={<span className="font-semibold">{formatDate(endDate)}</span>} />
          <MemberInfo label="Lý do" value={<span className="font-semibold">{reason ?? "-"}</span>} colSpan />
        </div>
      </CardContent>
        <ConfirmDeleteTempResident
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          error={confirmError}
          allowDelete={infoStatus !== "APPROVED"}
        />
    </Card>
  );
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("vi-VN");
}

const MemberInfo = ({ label, value, colSpan }: { label: string; value: React.ReactNode; colSpan?: boolean }) => (
  <div className={colSpan ? "sm:col-span-2" : ""}>
    <span className="text-muted-foreground">{label}: </span>
    <span className="text-foreground">{value}</span>
  </div>
);