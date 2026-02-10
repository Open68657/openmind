import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import {
  ShieldCheck,
  Camera,
  Mail,
  Phone,
  Save,
  User,
  Pencil,
} from "lucide-react";

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "ליבי ג׳רבי",
    email: "libi@openagency.com",
    phone: "054-1234567",
    role: "מנהלת ראשית",
    department: "הנהלה",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast.success("התמונה עודכנה בהצלחה");
  };

  const handleSave = () => {
    setProfile(draft);
    setIsEditing(false);
    toast.success("הפרופיל עודכן בהצלחה");
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
          <User className="h-7 w-7" />
          פרופיל אדמין
        </h1>

        {/* Avatar Card */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-brand-purple/20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-brand-pink to-brand-purple text-white text-3xl font-bold">
                    {profile.name.split(" ").map((w) => w[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 left-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple text-white shadow-md hover:opacity-90 transition-opacity"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <Badge className="mt-1 bg-gradient-to-l from-brand-pink to-brand-purple text-white border-0 gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {profile.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">פרטים אישיים</CardTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  עריכה
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                שם מלא
              </Label>
              {isEditing ? (
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              ) : (
                <p className="text-foreground font-medium">{profile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                אימייל
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  dir="ltr"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              ) : (
                <p className="text-foreground font-medium" dir="ltr">{profile.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                טלפון
              </Label>
              {isEditing ? (
                <Input
                  type="tel"
                  dir="ltr"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              ) : (
                <p className="text-foreground font-medium" dir="ltr">{profile.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">מחלקה</Label>
              {isEditing ? (
                <Input
                  value={draft.department}
                  onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                />
              ) : (
                <p className="text-foreground font-medium">{profile.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">תפקיד</Label>
              {isEditing ? (
                <Input
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              ) : (
                <p className="text-foreground font-medium">{profile.role}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} className="bg-gradient-to-l from-brand-pink to-brand-purple text-white hover:opacity-90 gap-1.5">
                  <Save className="h-4 w-4" />
                  שמור
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  ביטול
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;
