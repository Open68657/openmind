import { getBirthdayCelebrations, type TeamMember } from "@/data/team";
import { Cake, PartyPopper } from "lucide-react";

interface BirthdayCelebrationProps {
  members: TeamMember[];
}

const BirthdayCelebration = ({ members }: BirthdayCelebrationProps) => {
  const celebrations = getBirthdayCelebrations(members);

  if (celebrations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-celebration/30 bg-celebration-soft p-6">
      <div className="flex items-center gap-2 mb-4">
        <PartyPopper className="h-5 w-5 text-celebration" />
        <h2 className="text-lg font-semibold text-foreground">
          חוגגים יום הולדת
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {celebrations.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-celebration/15 text-sm font-semibold text-celebration">
              <Cake className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {person.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {person.isToday
                  ? "🎉 חוגג/ת היום!"
                  : "🎂 חוגג/ת מחר!"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BirthdayCelebration;
