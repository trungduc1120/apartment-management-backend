"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function HouseholdDetailModal({
  household,
  open,
  onOpenChange,
}: {
  household: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!household) return null
  const head = household.resident.find((r: any) => r.relationshipToHead === "HEAD")
  const members = household.resident.filter((r: any) => r.relationshipToHead !== "HEAD")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Thông tin chi tiết hộ: <span className="text-primary">{household.houseHoldCode}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border p-3 rounded-md bg-muted/20">
            <h3 className="font-semibold mb-1">Chủ hộ:</h3>
            <p>{head?.fullname}</p>
            <p className="text-sm text-muted-foreground">{head?.phoneNumber}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Thành viên trong hộ</h3>
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-1 text-left">Họ tên</th>
                  <th className="px-2 py-1 text-left">Quan hệ</th>
                  <th className="px-2 py-1 text-left">Nghề nghiệp</th>
                  <th className="px-2 py-1 text-left">CCCD</th>
                  <th className="px-2 py-1 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-2 py-1">{m.fullname}</td>
                    <td className="px-2 py-1">{m.relationshipToHead}</td>
                    <td className="px-2 py-1">{m.occupation}</td>
                    <td className="px-2 py-1">{m.nationalId}</td>
                    <td className="px-2 py-1">{m.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
