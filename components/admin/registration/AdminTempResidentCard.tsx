"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface ResidentShort {
  id: number | string
  fullname: string
  nationalId?: string
}

interface AdminTempResident {
  id: number
  startDate?: string
  endDate?: string
  reason?: string
  informationStatus?: string
  resident?: { id?: number | string; fullname?: string; nationalId?: string }
}

interface Props {
  item: AdminTempResident
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
}

export function AdminTempResidentCard({ item, onApprove, onReject }: Props) {
  const start = item.startDate ? format(new Date(item.startDate), "dd/MM/yyyy") : "-"
  const end = item.endDate ? format(new Date(item.endDate), "dd/MM/yyyy") : "-"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">{item.resident?.fullname ?? "(Không rõ tên)"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-2">CCCD: {item.resident?.nationalId ?? "-"}</div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <div className="text-muted-foreground">Ngày bắt đầu</div>
            <div className="font-medium">{start}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Ngày kết thúc</div>
            <div className="font-medium">{end}</div>
          </div>
        </div>
        <div className="text-sm mb-4">
          <div className="text-muted-foreground">Lý do</div>
          <div className="font-medium">{item.reason ?? "-"}</div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onReject?.(item.id)}>
            Từ chối
          </Button>
          <Button size="sm" onClick={() => onApprove?.(item.id)}>
            Phê duyệt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
