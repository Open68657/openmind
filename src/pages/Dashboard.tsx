import { Brain, Users, Building2, Sparkles, FileText, Clock, Cake, ArrowLeft, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { initialTeamMembers, getBirthdayCelebrations } from "@/data/team";
import { clients } from "@/data/clients";
import { format } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const celebrations = getBirthdayCelebrations(initialTeamMembers);

  const stats = [
    { label: "חברי צוות", value: initialTeamMembers.length, icon: Users, color: "text-brand-purple" },
    { label: "לקוחות פעילים", value: clients.length, icon: Building2, color: "text-brand-pink" },
    { label: "גיידליינס", value: clients.length, icon: FileText, color: "text-accent" },
  ];

  const quickLinks = [
    { title: "הצוות", desc: "ניהול חברי הצוות", href: "/team", icon: Users },
    { title: "לקוחות", desc: "מאגר לקוחות וגיידליינס", href: "/clients", icon: Building2 },
    { title: "סטודיו AI", desc: "כלי יצירה חכמים", href: "/ai-studio", icon: Sparkles },
  ];

  const recentActivity = [
    { text: "גיידליין BIG עודכן", time: "לפני שעתיים", user: "ליבי ג׳רבי" },
    { text: "חבר צוות חדש נוסף", time: "אתמול", user: "ליבי ג׳רבי" },
    { text: "קובץ PDF הועלה – Yale", time: "לפני 3 ימים", user: "ליבי ג׳רבי" },
    { text: "גיידליין פאנטה נוצר", time: "לפני שבוע", user: "ליבי ג׳רבי" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-brand-purple" />
            <span className="text-xl font-bold bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent tracking-tight">
              OPENMind
            </span>
          </div>
          <p className="text-xs text-muted-foreground">המוח המשותף של Open</p>
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">שלום, ליבי 👋</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), "EEEE, dd/MM/yyyy")} · דשבורד ניהולי
            </p>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-brand-purple" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Birthdays */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Cake className="h-4 w-4 text-celebration" />
                ימי הולדת קרובים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {celebrations.length > 0 ? (
                celebrations.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-celebration-soft text-sm font-bold text-celebration">
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.department}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={c.isToday ? "bg-celebration/10 text-celebration border-celebration/20" : ""}
                    >
                      {c.isToday ? "היום! 🎂" : "מחר"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">אין ימי הולדת קרובים</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <h2 className="text-lg font-bold text-foreground mb-3">גישה מהירה</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all duration-200 text-right"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-brand-purple/10 transition-colors">
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-brand-purple transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand-purple transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
