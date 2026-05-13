"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HouseholdResidentForm from "@/components/resident/household-resident-form"
import { useRouter } from "next/navigation"
import { useHousehold } from "@/lib/context/household-context"

export default function RegisterHouseholdPage() {
  const router = useRouter()
  const {refreshHousehold} = useHousehold()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 py-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-3xl">Đăng ký thông tin hộ khẩu</CardTitle>
          <CardDescription>Vui lòng điền lần lượt thông tin hộ khẩu và chủ hộ để hoàn tất đăng ký</CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdResidentForm 
            mode="create"
            onSuccess={async ()=>{
              await refreshHousehold()
              router.replace("/resident")
            }} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
