import { useState, useRef } from "react";
import { TeamMember } from "@/data/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";

interface EditMemberDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: TeamMember) => void;
}

const departments = ["קריאייטיב", "אסטרטגיה", "ניהול לקוח", "סטודיו"];

const EditMemberDialog = ({ member, open, onOpenChange, onSave }: EditMemberDialogProps) => {
  const [form, setForm] = useState<TeamMember | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form when member changes
  const currentMember = form ?? member;

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && member) {
      setForm({ ...member });
      setPreviewUrl(member.avatarUrl || null);
    } else {
      setForm(null);
      setPreviewUrl(null);
    }
    onOpenChange(isOpen);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setForm({ ...form, avatarUrl: url });
  };

  const handleSave = () => {
    if (!form) return;
    // Recompute birthdayDisplay from birthday
    const d = new Date(form.birthday);
    const display = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    onSave({ ...form, birthdayDisplay: display });
    onOpenChange(false);
    setForm(null);
  };

  if (!currentMember) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת פרטי עובד</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-20 w-20">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={currentMember.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-brand-pink/20 to-brand-purple/20 text-foreground text-lg font-bold">
                  {currentMember.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            <Input
              id="name"
              value={form?.name ?? ""}
              onChange={(e) => form && setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label>מחלקה</Label>
            <Select
              value={form?.department ?? ""}
              onValueChange={(val) => form && setForm({ ...form, department: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={form?.email ?? ""}
              onChange={(e) => form && setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <Label htmlFor="birthday">יום הולדת</Label>
            <Input
              id="birthday"
              type="date"
              dir="ltr"
              value={form?.birthday ?? ""}
              onChange={(e) => form && setForm({ ...form, birthday: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-start">
          <Button onClick={handleSave} className="bg-gradient-to-l from-brand-pink to-brand-purple text-white hover:opacity-90">
            שמור שינויים
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
