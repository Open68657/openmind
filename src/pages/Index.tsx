import { teamMembers } from "@/data/team";
import BirthdayCelebration from "@/components/BirthdayCelebration";
import TeamTable from "@/components/TeamTable";
import { Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium tracking-wide">
              Open Agency
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            הצוות שלנו
          </h1>
          <p className="mt-1 text-muted-foreground">
            {teamMembers.length} חברי צוות בארגון
          </p>
        </div>

        {/* Birthday Section */}
        <div className="mb-8">
          <BirthdayCelebration members={teamMembers} />
        </div>

        {/* Team Table */}
        <TeamTable />
      </div>
    </div>
  );
};

export default Index;
