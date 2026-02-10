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
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-brand-purple" />
            <span className="text-xl font-bold bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent tracking-tight">
              OPENMind
            </span>
          </div>
          <p className="text-xs text-muted-foreground">המוח המשותף של Open</p>
        </div>

        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">שלום, ליבי 👋</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {format(new Date(), "EEEE, dd/MM/yyyy")} · דשבורד ניהולי
            </p>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-5 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="card-premium p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/60">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 mb-10">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 card-premium">
            <CardHeader className="pb-3 px-7 pt-7">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-7 pb-7">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
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
          <Card className="card-premium">
            <CardHeader className="pb-3 px-7 pt-7">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Cake className="h-4 w-4 text-celebration" />
                ימי הולדת קרובים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-7 pb-7">
              {celebrations.length > 0 ? (
                celebrations.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-celebration-soft text-sm font-bold text-celebration">
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
                <p className="text-sm text-muted-foreground text-center py-6">אין ימי הולדת קרובים</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <h2 className="text-lg font-bold text-foreground mb-4">גישה מהירה</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {quickLinks.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="group card-premium hover-glow flex items-center gap-4 p-6 text-right"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/60 group-hover:bg-brand-purple/10 transition-colors duration-300">
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-brand-purple transition-colors duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand-purple transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
