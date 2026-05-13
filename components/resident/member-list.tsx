import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberCard, Member } from "./member-card";

interface MembersListProps {
  members: Member[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  disabledActions?: boolean;
}

export const MembersList = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  disabledActions,
}: MembersListProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Thành viên hộ khẩu</CardTitle>
        <Button onClick={onAddMember} className="gap-2" disabled={disabledActions} title={disabledActions ? "Không thể thêm khi thông tin ở trạng thái kết thúc/xóa" : undefined}>
          <Plus className="h-4 w-4" />
          Thêm thành viên
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={() => onEditMember(member)}
              onDelete={() => onDeleteMember(member.id)}
              disabledActions={disabledActions}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
