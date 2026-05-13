"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Resident {
  id: number
  relationshipToHead: string
  fullname: string
}

interface HouseHold {
  id: number
  houseHoldCode: number
  apartmentNumber: string
  buildingNumber: string
  street: string
  province: string
  resident: Resident[]
}

interface HouseholdTableProps {
  households: HouseHold[]
  onDetailClick: (household: HouseHold) => void
}

export function HouseholdTable({ households, onDetailClick }: HouseholdTableProps) {
  const getHeadName = (residents: Resident[]): string => {
    const head = residents.find((r) => r.relationshipToHead === "HEAD")
    return head?.fullname || "N/A"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Danh sách hộ gia đình ({households.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Hộ</TableHead>
                <TableHead>Số Căn Hộ</TableHead>
                <TableHead>Tòa Nhà</TableHead>
                <TableHead>Đường</TableHead>
                <TableHead>Tỉnh/Thành phố</TableHead>
                <TableHead>Chủ Hộ</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {households.map((household) => (
                <TableRow key={household.id}>
                  <TableCell className="font-medium">{household.houseHoldCode}</TableCell>
                  <TableCell>{household.apartmentNumber}</TableCell>
                  <TableCell>{household.buildingNumber}</TableCell>
                  <TableCell>{household.street}</TableCell>
                  <TableCell>{household.province}</TableCell>
                  <TableCell>{getHeadName(household.resident)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onDetailClick(household)}>
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
