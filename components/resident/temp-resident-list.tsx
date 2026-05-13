import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Member } from "./member-card";
import { TempResidentCard, TempResident } from "./temp-resident-card";

interface TempResidentListProps {
  tempRes: TempResident[];
  onAddMember: () => void;
  onEditMember: (member: TempResident) => void;
  onDeleteMember: (id: string) => void;
}

export const TempResidentList = ({
  tempRes,
  onAddMember,
  onEditMember,
  onDeleteMember,
}: TempResidentListProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Thành viên tạm trú</CardTitle>
        <Button onClick={onAddMember} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm khai báo tạm trú
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tempRes?.map((temp) => (
            <TempResidentCard
              key={temp.id}
              tempRes={temp}
              onEdit={() => onEditMember(temp)}
              onDelete={() => onDeleteMember(String(temp.id))}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
