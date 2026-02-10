export interface BrandColor {
  name: string;
  hex: string;
}

export interface LogoRule {
  rule: string;
  type: "do" | "dont";
}

export interface ExtractedBrandData {
  colors: BrandColor[];
  fonts: { name: string; size: string; usage: string }[];
  logoRules: LogoRule[];
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  brandColors: BrandColor[];
  fonts: string[];
}

export const clients: Client[] = [
  {
    id: "leumi",
    name: "בנק לאומי",
    industry: "פיננסים",
    brandColors: [
      { name: "כחול ראשי", hex: "#003DA5" },
      { name: "כחול כהה", hex: "#001A5C" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור בהיר", hex: "#F0F0F0" },
    ],
    fonts: ["Almoni", "Open Sans"],
  },
  {
    id: "coca-cola",
    name: "קוקה קולה",
    industry: "מזון ומשקאות",
    brandColors: [
      { name: "אדום קוקה קולה", hex: "#F40009" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "שחור", hex: "#000000" },
      { name: "כסף", hex: "#C4C4C4" },
    ],
    fonts: ["Spencerian Script", "TCCC Unity"],
  },
  {
    id: "tnuva",
    name: "תנובה",
    industry: "מזון ומשקאות",
    brandColors: [
      { name: "כחול תנובה", hex: "#004B93" },
      { name: "ירוק", hex: "#7AB648" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור", hex: "#6D6E71" },
    ],
    fonts: ["Heebo", "Noto Sans Hebrew"],
  },
  {
    id: "bezeq",
    name: "בזק",
    industry: "טלקום",
    brandColors: [
      { name: "סגול", hex: "#6B2D8B" },
      { name: "ירוק", hex: "#78BE20" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור כהה", hex: "#333333" },
    ],
    fonts: ["Heebo", "Assistant"],
  },
  {
    id: "elal",
    name: "אל על",
    industry: "תעופה ותיירות",
    brandColors: [
      { name: "כחול אל על", hex: "#003087" },
      { name: "כחול בהיר", hex: "#0072CE" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "זהב", hex: "#B58B00" },
    ],
    fonts: ["Heebo", "Rubik"],
  },
  {
    id: "strauss",
    name: "שטראוס",
    industry: "מזון ומשקאות",
    brandColors: [
      { name: "ירוק שטראוס", hex: "#006633" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "זהב", hex: "#C5A55A" },
      { name: "אפור", hex: "#808080" },
    ],
    fonts: ["Almoni", "Heebo"],
  },
  {
    id: "partner",
    name: "פרטנר",
    industry: "טלקום",
    brandColors: [
      { name: "כתום פרטנר", hex: "#FF6600" },
      { name: "שחור", hex: "#000000" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור", hex: "#999999" },
    ],
    fonts: ["Heebo", "Open Sans"],
  },
  {
    id: "super-pharm",
    name: "סופר-פארם",
    industry: "קמעונאות",
    brandColors: [
      { name: "ירוק סופר-פארם", hex: "#00A651" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "כחול כהה", hex: "#1C3664" },
      { name: "אפור בהיר", hex: "#E8E8E8" },
    ],
    fonts: ["Heebo", "Noto Sans Hebrew"],
  },
  {
    id: "mizrahi",
    name: "בנק מזרחי",
    industry: "פיננסים",
    brandColors: [
      { name: "אדום מזרחי", hex: "#CC0000" },
      { name: "שחור", hex: "#1A1A1A" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור", hex: "#B3B3B3" },
    ],
    fonts: ["Almoni", "Assistant"],
  },
];

/** Simulated extracted data per client for demo purposes */
export const simulatedExtractions: Record<string, ExtractedBrandData> = {
  leumi: {
    colors: [
      { name: "כחול ראשי", hex: "#003DA5" },
      { name: "כחול כהה", hex: "#001A5C" },
      { name: "תכלת משני", hex: "#4D9DE0" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור ניטרלי", hex: "#E5E5E5" },
      { name: "זהב פרימיום", hex: "#C5A43B" },
    ],
    fonts: [
      { name: "Almoni DL", size: "32-48px", usage: "כותרות ראשיות" },
      { name: "Almoni DL Light", size: "18-24px", usage: "כותרות משניות" },
      { name: "Open Sans", size: "14-16px", usage: "גוף טקסט" },
      { name: "Open Sans Bold", size: "14px", usage: "הדגשות וכפתורים" },
    ],
    logoRules: [
      { rule: "שימוש בלוגו על רקע לבן או כחול כהה בלבד", type: "do" },
      { rule: "שמירה על מרווח מינימלי של 20px סביב הלוגו", type: "do" },
      { rule: "אין לשנות את יחס הגובה-רוחב של הלוגו", type: "dont" },
      { rule: "אין להוסיף אפקטים כמו צל או שיפוע", type: "dont" },
      { rule: "אין להשתמש בלוגו על רקע תמונה עמוסה", type: "dont" },
    ],
  },
  "coca-cola": {
    colors: [
      { name: "אדום קוקה קולה", hex: "#F40009" },
      { name: "אדום כהה", hex: "#C8102E" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "שחור", hex: "#000000" },
      { name: "כסף מטאלי", hex: "#C4C4C4" },
      { name: "קרם", hex: "#F5F0EB" },
    ],
    fonts: [
      { name: "Spencerian Script", size: "N/A", usage: "לוגו בלבד" },
      { name: "TCCC Unity", size: "28-40px", usage: "כותרות" },
      { name: "TCCC Unity Light", size: "16-20px", usage: "גוף טקסט" },
      { name: "Noto Sans", size: "14px", usage: "טקסט עברי" },
    ],
    logoRules: [
      { rule: "הלוגו חייב להופיע בצבע אדום או לבן בלבד", type: "do" },
      { rule: "שימוש ב-Dynamic Ribbon בכל חומר שיווקי", type: "do" },
      { rule: "אין לשנות את הגופן של הלוגו", type: "dont" },
      { rule: "אין לסובב או להטות את הלוגו", type: "dont" },
    ],
  },
  default: {
    colors: [
      { name: "צבע ראשי", hex: "#2B5EA7" },
      { name: "צבע משני", hex: "#E8573A" },
      { name: "רקע בהיר", hex: "#F8F9FA" },
      { name: "טקסט כהה", hex: "#1A1A2E" },
      { name: "אפור ממשק", hex: "#6C757D" },
      { name: "הצלחה", hex: "#28A745" },
    ],
    fonts: [
      { name: "Heebo Bold", size: "28-36px", usage: "כותרות ראשיות" },
      { name: "Heebo Medium", size: "18-22px", usage: "כותרות משניות" },
      { name: "Heebo Regular", size: "14-16px", usage: "גוף טקסט" },
      { name: "Heebo Light", size: "12px", usage: "הערות וכיתובים" },
    ],
    logoRules: [
      { rule: "שימוש בגרסה צבעונית על רקע בהיר", type: "do" },
      { rule: "שימוש בגרסה לבנה על רקע כהה", type: "do" },
      { rule: "שמירה על אזור בטחון מסביב ללוגו", type: "do" },
      { rule: "אין למתוח או לעוות את הלוגו", type: "dont" },
      { rule: "אין להציב את הלוגו על רקע דומה בצבע", type: "dont" },
    ],
  },
};
