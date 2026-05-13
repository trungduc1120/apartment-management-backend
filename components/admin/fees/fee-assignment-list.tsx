"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateFeeAssignmentModal } from "./create-fee-assignment-modal"
import { FeeDetailByFeeModal } from "./fee-detail-by-fee-modal"
import { FeeDetailByHouseholdModal } from "./fee-detail-by-household-modal"
import { useFeeContext } from "@/lib/context/fee-context"
import { useAdmin } from "@/lib/context/admin-context"

export function FeeAssignmentList() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { fees, loadFees } = useFeeContext()
  const { households, refresh: refreshHouseholds } = useAdmin()

  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null)
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null)

  useEffect(() => {
    loadFees()
    refreshHouseholds()
  }, [])

  return (
    <Card className="w-full p-6">
      <Tabs defaultValue="by-fee" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="by-fee">Theo Khoản Phí</TabsTrigger>
            <TabsTrigger value="by-household">Theo Hộ Dân</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowCreateModal(true)}>+ Gán phí mới</Button>
        </div>

        {/* VIEW 1: DANH SÁCH CÁC KHOẢN PHÍ */}
        <TabsContent value="by-fee">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên khoản phí</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Đơn giá / người</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.name}</TableCell>
                    <TableCell>{fee.type === "MANDATORY" ? "Bắt buộc" : "Tự nguyện"}</TableCell>
                    <TableCell>{fee.ratePerPerson.toLocaleString()} đ</TableCell>
                    <TableCell>
                      {new Date(fee.startDate).toLocaleDateString("vi-VN")} - {new Date(fee.endDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedFeeId(fee.id)}>
                        Xem danh sách hộ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {fees.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Chưa có khoản phí nào</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* VIEW 2: DANH SÁCH HỘ DÂN */}
        <TabsContent value="by-household">
           <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hộ</TableHead>
                  <TableHead>Căn hộ</TableHead>
                  <TableHead>Tòa</TableHead>
                  <TableHead>Chủ hộ</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {households && households.map((h: any) => {
                  const headName = h.resident?.find((r: any) => r.relationshipToHead === "HEAD")?.fullname || "Chưa có"
                  return (
                    <TableRow key={h.id}>
                      <TableCell>{h.houseHoldCode}</TableCell>
                      <TableCell className="font-medium">{h.apartmentNumber}</TableCell>
                      <TableCell>{h.buildingNumber}</TableCell>
                      <TableCell>{headName}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedHouseholdId(h.id)}>
                          Xem các phí
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      {showCreateModal && (
        <CreateFeeAssignmentModal onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />
      )}
      
      {selectedFeeId && (
        <FeeDetailByFeeModal feeId={selectedFeeId} onClose={() => setSelectedFeeId(null)} />
      )}

      {selectedHouseholdId && (
        <FeeDetailByHouseholdModal householdId={selectedHouseholdId} onClose={() => setSelectedHouseholdId(null)} />
      )}
    </Card>
  )
}