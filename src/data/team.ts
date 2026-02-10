import { format } from "date-fns";

export interface TeamMember {
  id: number;
  name: string;
  department: string;
  email: string;
  birthday: string;
  birthdayDisplay: string;
  avatar: string;
}

const currentYear = new Date().getFullYear();
const today = new Date();
const todayMonth = today.getMonth();
const todayDate = today.getDate();

function isBirthdayToday(month: number, day: number): boolean {
  return todayMonth === month && todayDate === day;
}

function isBirthdayTomorrow(month: number, day: number): boolean {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getMonth() === month && tomorrow.getDate() === day;
}

const tm = todayMonth;
const td = todayDate;
const tomorrowDate = new Date(today);
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tmrMonth = tomorrowDate.getMonth();
const tmrDay = tomorrowDate.getDate();

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "נועה לוי",
    department: "קריאייטיב",
    email: "noa.levi@openagency.com",
    birthday: `${currentYear}-${String(tm + 1).padStart(2, "0")}-${String(td).padStart(2, "0")}`,
    birthdayDisplay: format(new Date(currentYear, tm, td), "dd/MM"),
    avatar: "נל",
  },
  {
    id: 2,
    name: "אורי כהן",
    department: "אסטרטגיה",
    email: "ori.cohen@openagency.com",
    birthday: `${currentYear}-${String(tmrMonth + 1).padStart(2, "0")}-${String(tmrDay).padStart(2, "0")}`,
    birthdayDisplay: format(new Date(currentYear, tmrMonth, tmrDay), "dd/MM"),
    avatar: "אכ",
  },
  {
    id: 3,
    name: "תמר אברהם",
    department: "ניהול לקוח",
    email: "tamar.avraham@openagency.com",
    birthday: `${currentYear}-03-14`,
    birthdayDisplay: "14/03",
    avatar: "תא",
  },
  {
    id: 4,
    name: "יונתן מזרחי",
    department: "סטודיו",
    email: "yonatan.mizrahi@openagency.com",
    birthday: `${currentYear}-07-22`,
    birthdayDisplay: "22/07",
    avatar: "ימ",
  },
  {
    id: 5,
    name: "שירה גולן",
    department: "קריאייטיב",
    email: "shira.golan@openagency.com",
    birthday: `${currentYear}-11-05`,
    birthdayDisplay: "05/11",
    avatar: "שג",
  },
  {
    id: 6,
    name: "דניאל רוזן",
    department: "אסטרטגיה",
    email: "daniel.rosen@openagency.com",
    birthday: `${currentYear}-01-30`,
    birthdayDisplay: "30/01",
    avatar: "דר",
  },
  {
    id: 7,
    name: "מאיה פרידמן",
    department: "ניהול לקוח",
    email: "maya.friedman@openagency.com",
    birthday: `${currentYear}-09-18`,
    birthdayDisplay: "18/09",
    avatar: "מפ",
  },
  {
    id: 8,
    name: "עידו שפירא",
    department: "סטודיו",
    email: "ido.shapira@openagency.com",
    birthday: `${currentYear}-05-09`,
    birthdayDisplay: "09/05",
    avatar: "עש",
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
