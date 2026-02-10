import { useState } from "react";
import { initialTeamMembers, TeamMember } from "@/data/team";
import BirthdayCelebration from "@/components/BirthdayCelebration";
import TeamTable from "@/components/TeamTable";
import EditMemberDialog from "@/components/EditMemberDialog";
import { Users, Plus, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";

const Index = () => {
  const [members, setMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [role, setRole] = useState<"admin" | "employee">("admin");
  const [simulatedUserId] = useState(9); // Simulated as "ליבי ג׳רבי"
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSave = (updated: TeamMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    toast.success("הפרטים עודכנו בהצלחה");
  };

  const handleAdd = () => {
    const newId = Math.max(...members.map((m) => m.id), 0) + 1;
    const now = new Date();
    const newMember: TeamMember = {
      id: newId,
      name: "עובד/ת חדש/ה",
      department: "קריאייטיב",
      email: "new@openagency.com",
      birthday: format(now, "yyyy-MM-dd"),
      birthdayDisplay: format(now, "dd/MM"),
      avatar: "חד",
    };
    setEditMember(newMember);
    setEditOpen(true);
  };

  const handleAddSave = (updated: TeamMember) => {
    // Check if it's a new member (not in list yet)
    const exists = members.find((m) => m.id === updated.id);
    if (exists) {
      handleSave(updated);
    } else {
      // Update avatar initials from name
      const parts = updated.name.split(" ");
      const initials = parts.length >= 2
        ? parts[0][0] + parts[1][0]
        : updated.name.slice(0, 2);
      setMembers((prev) => [...prev, { ...updated, avatar: initials }]);
      toast.success("העובד/ת נוסף/ה בהצלחה");
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    setMembers((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
    toast.success("העובד/ת הוסר/ה בהצלחה");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium tracking-wide bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent">
                OPENMind
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">הצוות שלנו</h1>
            <p className="mt-1 text-muted-foreground">
              {members.length} חברי צוות בארגון
            </p>
          </div>

          {/* Role Simulation Toggle */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">הצגה בתור:</span>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "employee")}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      מנהל
                    </span>
                  </SelectItem>
                  <SelectItem value="employee">
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      עובד
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "employee" && (
              <p className="text-[10px] text-muted-foreground">
                מדמה צפייה כ: {members.find((m) => m.id === simulatedUserId)?.name}
              </p>
            )}
          </div>
        </div>

        {/* Admin: Add button */}
        {role === "admin" && (
          <div className="mb-4">
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-l from-brand-pink to-brand-purple text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף עובד
            </Button>
          </div>
        )}

        {/* Birthday Section */}
        <div className="mb-8">
          <BirthdayCelebration members={members} />
        </div>

        {/* Team Table */}
        <TeamTable
          members={members}
          role={role}
          simulatedUserId={simulatedUserId}
          onEdit={(m) => {
            setEditMember(m);
            setEditOpen(true);
          }}
          onDelete={(id) => setDeleteId(id)}
        />

        {/* Edit Dialog */}
        <EditMemberDialog
          member={editMember}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={handleAddSave}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-right">מחיקת עובד/ת</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                האם את/ה בטוח/ה שברצונך להסיר את{" "}
                <strong>{members.find((m) => m.id === deleteId)?.name}</strong> מהצוות?
                פעולה זו לא ניתנת לביטול.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 sm:justify-start">
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                מחק
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Index;
