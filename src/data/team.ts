import { format, isToday, isTomorrow, parse } from "date-fns";

export interface TeamMember {
  id: number;
  name: string;
  department: string;
  email: string;
  birthday: string; // MM-DD format for annual check, full date for display
  birthdayDisplay: string;
  avatar: string;
}

const currentYear = new Date().getFullYear();
const today = new Date();
const todayMonth = today.getMonth();
const todayDate = today.getDate();

// Helper to check if a birthday (month/day) is today or tomorrow
function isBirthdayToday(month: number, day: number): boolean {
  return todayMonth === month && todayDate === day;
}

function isBirthdayTomorrow(month: number, day: number): boolean {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getMonth() === month && tomorrow.getDate() === day;
}

// We set two members' birthdays to today/tomorrow for demo
const tm = todayMonth;
const td = todayDate;
const tomorrowDate = new Date(today);
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tmrMonth = tomorrowDate.getMonth();
const tmrDay = tomorrowDate.getDate();

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Alex Rivera",
    department: "Design",
    email: "alex.rivera@openagency.com",
    birthday: `${currentYear}-${String(tm + 1).padStart(2, "0")}-${String(td).padStart(2, "0")}`,
    birthdayDisplay: format(new Date(currentYear, tm, td), "MMM d"),
    avatar: "AR",
  },
  {
    id: 2,
    name: "Jordan Chen",
    department: "Engineering",
    email: "jordan.chen@openagency.com",
    birthday: `${currentYear}-${String(tmrMonth + 1).padStart(2, "0")}-${String(tmrDay).padStart(2, "0")}`,
    birthdayDisplay: format(new Date(currentYear, tmrMonth, tmrDay), "MMM d"),
    avatar: "JC",
  },
  {
    id: 3,
    name: "Samara Osei",
    department: "Marketing",
    email: "samara.osei@openagency.com",
    birthday: `${currentYear}-03-14`,
    birthdayDisplay: "Mar 14",
    avatar: "SO",
  },
  {
    id: 4,
    name: "Liam Patel",
    department: "Engineering",
    email: "liam.patel@openagency.com",
    birthday: `${currentYear}-07-22`,
    birthdayDisplay: "Jul 22",
    avatar: "LP",
  },
  {
    id: 5,
    name: "Mia Tanaka",
    department: "Design",
    email: "mia.tanaka@openagency.com",
    birthday: `${currentYear}-11-05`,
    birthdayDisplay: "Nov 5",
    avatar: "MT",
  },
  {
    id: 6,
    name: "Noah Williams",
    department: "Operations",
    email: "noah.williams@openagency.com",
    birthday: `${currentYear}-01-30`,
    birthdayDisplay: "Jan 30",
    avatar: "NW",
  },
  {
    id: 7,
    name: "Priya Sharma",
    department: "Marketing",
    email: "priya.sharma@openagency.com",
    birthday: `${currentYear}-09-18`,
    birthdayDisplay: "Sep 18",
    avatar: "PS",
  },
  {
    id: 8,
    name: "Ethan Brooks",
    department: "Engineering",
    email: "ethan.brooks@openagency.com",
    birthday: `${currentYear}-05-09`,
    birthdayDisplay: "May 9",
    avatar: "EB",
  },
];

export function getBirthdayCelebrations(members: TeamMember[]) {
  return members.filter((m) => {
    const d = new Date(m.birthday);
    const month = d.getMonth();
    const day = d.getDate();
    return isBirthdayToday(month, day) || isBirthdayTomorrow(month, day);
  }).map((m) => {
    const d = new Date(m.birthday);
    const month = d.getMonth();
    const day = d.getDate();
    return {
      ...m,
      isToday: isBirthdayToday(month, day),
      isTomorrow: isBirthdayTomorrow(month, day),
    };
  });
}
