import { teamMembers } from "@/data/team";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TeamTable = () => {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-foreground">Name</TableHead>
            <TableHead className="font-semibold text-foreground">Department</TableHead>
            <TableHead className="font-semibold text-foreground">Email</TableHead>
            <TableHead className="font-semibold text-foreground text-right">Birthday</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 text-xs">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
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
              <TableCell className="text-muted-foreground">
                {member.email}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {member.birthdayDisplay}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamTable;
