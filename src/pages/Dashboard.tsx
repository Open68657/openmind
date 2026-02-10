import { Brain } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-brand-purple" />
            <span className="text-xl font-bold bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent tracking-tight">
              OPENMind
            </span>
          </div>
          <p className="text-xs text-muted-foreground">המוח המשותף של Open</p>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">שלום 👋</h1>
        <p className="text-muted-foreground mb-8">ברוכים הבאים למערכת ניהול המותגים של Open</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "הצוות", desc: "ניהול חברי הצוות", href: "/team", emoji: "👥" },
            { title: "לקוחות", desc: "מאגר לקוחות וגיידליינס", href: "/clients", emoji: "🏢" },
            { title: "סטודיו AI", desc: "כלי יצירה חכמים", href: "/ai-studio", emoji: "✨" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:border-brand-purple/30 transition-all duration-300"
            >
              <span className="text-3xl mb-3 block">{item.emoji}</span>
              <h3 className="text-lg font-bold text-foreground group-hover:text-brand-purple transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
