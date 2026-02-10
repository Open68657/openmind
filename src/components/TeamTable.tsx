import { TeamMember } from "@/data/team";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, User } from "lucide-react";

interface TeamTableProps {
  members: TeamMember[];
  role: "admin" | "employee";
  simulatedUserId: number;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: number) => void;
}

const TeamTable = ({ members, role, simulatedUserId, onEdit, onDelete }: TeamTableProps) => {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-foreground text-right">שם</TableHead>
            <TableHead className="font-semibold text-foreground text-right">מחלקה</TableHead>
            <TableHead className="font-semibold text-foreground text-right">אימייל</TableHead>
            <TableHead className="font-semibold text-foreground text-left">יום הולדת</TableHead>
            <TableHead className="font-semibold text-foreground text-center w-24">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const canEdit = role === "admin" || member.id === simulatedUserId;
            const canDelete = role === "admin";

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-brand-pink/20 to-brand-purple/20 text-foreground text-xs font-bold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {member.department}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground" dir="ltr">
                  {member.email}
                </TableCell>
                <TableCell className="text-left text-muted-foreground">
                  {member.birthdayDisplay}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-brand-purple"
                        onClick={() => onEdit(member)}
                        title="ערוך"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(member.id)}
                        title="מחק"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamTable;
