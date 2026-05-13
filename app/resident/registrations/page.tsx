"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useHousehold } from "@/lib/context/household-context"
import { Member } from "@/components/resident/member-card"
import { AddTempResidentDialog } from "@/components/resident/add-temp-resident-dialog"
import { ConfirmBlockedEdit } from "@/components/resident/confirm-blocked-edit"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRegistration, RegistrationProvider } from "@/lib/context/registration-context"
import { InformationStatus, TempResident } from "@/components/resident/temp-resident-card"
import { TempResidentList } from "@/components/resident/temp-resident-list"
import { EditTempResidentDialog } from "@/components/resident/edit-temp-resident-dialog"
import { EditTempAbsentDialog } from "@/components/resident/edit-temp-absent-dialog"
import { TempResidentCard } from "@/components/resident/temp-resident-card"
import { AddTempAbsentDialog } from "@/components/resident/add-temp-absent-dialog"

export default function RegistrationsPage() {
  const router = useRouter()
  const { members, deleteMember, household, tempResidents, deleteTempResident, refreshTempResidents } = useHousehold()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemp, setSelectedTemp] = useState<any | null>(null)
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<'res' | 'abs'>('res')
  // registration context is provided below; we consume it in `AbsentsPanel` so
  // hooks run inside the provider
  const [isAddAbsentOpen, setIsAddAbsentOpen] = useState(false)
  const [isEditAbsentOpen, setIsEditAbsentOpen] = useState(false)
  const [selectedAbsent, setSelectedAbsent] = useState<any | null>(null)

  // Map ResidentMember -> UI Member shape
  const uiMembers = members.map((m) => ({
    id: String(m.id),
    fullname: m.fullname,
    relationshipToHead: m.relationshipToHead,
    nationalId: m.nationalId || "",
    dateOfBirth: m.dateOfBirth,
    gender: m.gender || "MALE",
    occupation: m.occupation || "",
    email: m.email || "",
    phoneNumber: m.phoneNumber || "",
    workingAdress: m.workingAdress || "",
    placeOfOrigin: m.placeOfOrigin,
  }))

  // tempResidents loaded from API via context
  const tempRes: TempResident[] = tempResidents || []

  const handleEdit = (temp: TempResident) => {
    // Normalize shape: Temp-absent responses may carry TemporaryAbsence array
    const ta = (temp as any).TemporaryAbsence?.[0]
    const status = ta?.informationStatus ?? (temp as any).informationStatus
    if (status === "APPROVED" || String(status).toUpperCase() === "ENDED") {
      setBlockedMessage("Cư dân này đã có khai báo được phê duyệt hoặc đã kết thúc — không thể sửa.")
      setBlockedDialogOpen(true)
      return
    }

    setBlockedMessage(undefined)
    setSelectedTemp(temp)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      // delete the temp registration
      await deleteTempResident(id)
    } catch (err) {
      console.error("Delete member failed:", err)
    }
  }

  return (
    <RegistrationProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-end justify-between mb-4">
          <div className="flex items-end space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab('res')}
              className={`text-2xl font-semibold pb-2 ${activeTab === 'res' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}>
              Khai báo tạm trú
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('abs')}
              className={`text-2xl font-semibold pb-2 ${activeTab === 'abs' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
              Khai báo tạm vắng
            </button>
          </div>
        </div>

        {activeTab === 'res' ? (
          <>
            <p className="text-muted-foreground mb-6">Quản lý các khai báo tạm trú trong hộ khẩu của bạn.</p>

            <ConfirmBlockedEdit open={blockedDialogOpen} onClose={() => setBlockedDialogOpen(false)} message={blockedMessage} />

            <TempResidentList
              tempRes={tempRes}
              onAddMember={() => setIsDialogOpen(true)}
              onEditMember={handleEdit}
              onDeleteMember={handleDelete}
            />
            <AddTempResidentDialog
              open={isDialogOpen && !selectedTemp}
              onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedTemp(null) }}
              members={uiMembers}
            />
            {/* Edit dialog for temp resident */}
            {selectedTemp && (
              <EditTempResidentDialog
                open={isDialogOpen}
                onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedTemp(null) }}
                temp={selectedTemp}
                onUpdated={() => refreshTempResidents()}
              />
            )}
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">Quản lý các khai báo tạm vắng trong hộ khẩu của bạn.</p>
            <AbsentsPanel onAdd={() => setIsAddAbsentOpen(true)} onEdit={(t) => { setSelectedAbsent(t); setIsEditAbsentOpen(true) }} />
            <AddTempAbsentDialog
              open={isAddAbsentOpen}
              onOpenChange={(open) => setIsAddAbsentOpen(open)}
              members={uiMembers}
              onAdded={() => { /* refresh handled by context */ }}
            />
            <EditTempAbsentDialog
              open={isEditAbsentOpen}
              onOpenChange={(open) => setIsEditAbsentOpen(open)}
              temp={selectedAbsent}
              onUpdated={() => { setSelectedAbsent(null); refreshTempResidents(); }}
            />
          </>
        )}
        </div>
      </div>
    </RegistrationProvider>
  )
}

function AbsentsPanel({ onAdd, onEdit }: { onAdd: () => void; onEdit?: (t: any) => void }) {
  const { tempAbsents, isLoading: isAbsentLoading, deleteTempAbsent } = useRegistration() as any
  const handleDeleteAbsent = async (registrationId: string) => {
    try {
      // use context deleteTempAbsent if available
      if (typeof deleteTempAbsent === "function") {
        await deleteTempAbsent(registrationId)
      }
    } catch (err) {
      console.error("Delete absent failed:", err)
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Thành viên tạm vắng</CardTitle>
        <div className="flex items-center gap-2">
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm khai báo tạm vắng
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isAbsentLoading && <div>Loading...</div>}
          {!isAbsentLoading && tempAbsents.length === 0 && <div className="text-sm text-muted-foreground">Không có khai báo tạm vắng nào.</div>}
          {tempAbsents.map((t: any) => (
            <TempResidentCard
              key={t.id}
              tempRes={t}
              onEdit={() => onEdit?.(t)}
              onDelete={handleDeleteAbsent}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


