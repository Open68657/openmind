export interface BrandColor {
  name: string;
  hex: string;
  cmyk?: string;
  rgb?: string;
  pantone?: string;
  page?: number;
  confidence?: "exact" | "inferred";
}

export interface LogoRule {
  rule: string;
  type: "do" | "dont";
  page?: number;
  confidence?: "exact" | "inferred";
}

export interface ExtractedFont {
  name: string;
  weight?: string;
  size: string;
  usage: string;
  page?: number;
  confidence?: "exact" | "inferred";
}

export interface ExtractedBrandData {
  colors: BrandColor[];
  fonts: ExtractedFont[];
  logoRules: LogoRule[];
  subBrands?: { name: string; nameHe: string | null; page?: number }[];
  sourceFileName?: string;
  summary?: {
    totalPages?: number;
    colorsFound: boolean;
    fontsFound: boolean;
    logoRulesFound: boolean;
    subBrandsFound: boolean;
  };
}

export interface SubBrand {
  name: string;
  nameHe: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  brandColors: BrandColor[];
  fonts: string[];
  subBrands?: SubBrand[];
  adLayout?: {
    logoPosition: string;
    colorBlocks: boolean;
    stampa?: { text: string };
  };
}

export const clients: Client[] = [
  {
    id: "big",
    name: "BIG",
    industry: "מרכזי קניות",
    brandColors: [
      { name: "אדום BIG", hex: "#E30613", cmyk: "M100 Y100" },
      { name: "כחול BIG", hex: "#0054A6", cmyk: "C100 M70" },
      { name: "צהוב BIG", hex: "#FFED00", cmyk: "Y100" },
      { name: "לבן", hex: "#FFFFFF" },
    ],
    fonts: ["Heebo", "Open Sans"],
    subBrands: [
      { name: "BIG CENTERS", nameHe: "ביג סנטרס" },
      { name: "BIG FASHION", nameHe: "ביג פאשן" },
    ],
    adLayout: {
      logoPosition: "bottom-center",
      colorBlocks: true,
      stampa: { text: "הכניסה חופשית" },
    },
  },
  {
    id: "yale",
    name: "Yale",
    industry: "פתרונות נעילה",
    brandColors: [
      { name: "כחול Yale", hex: "#003B73" },
      { name: "זהב", hex: "#C5A55A" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "שחור", hex: "#1A1A1A" },
    ],
    fonts: ["Montserrat", "Heebo"],
  },
  {
    id: "philharmonic",
    name: "הפילהרמונית",
    industry: "תרבות ומוזיקה",
    brandColors: [
      { name: "זהב קלאסי", hex: "#B8860B" },
      { name: "שחור", hex: "#1A1A1A" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "בורדו", hex: "#800020" },
    ],
    fonts: ["Playfair Display", "Heebo"],
  },
  {
    id: "poalim-tech",
    name: "פועלים טק",
    industry: "פיננסים וטכנולוגיה",
    brandColors: [
      { name: "אדום פועלים", hex: "#CC0000" },
      { name: "כחול טק", hex: "#0052CC" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור", hex: "#6D6E71" },
    ],
    fonts: ["Heebo", "Inter"],
  },
  {
    id: "good-pharm",
    name: "גוד פארם",
    industry: "פארמה וקמעונאות",
    brandColors: [
      { name: "ירוק גוד פארם", hex: "#00A651" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "כחול כהה", hex: "#1C3664" },
      { name: "אפור בהיר", hex: "#E8E8E8" },
    ],
    fonts: ["Heebo", "Noto Sans Hebrew"],
  },
  {
    id: "nordic",
    name: "נורדיק",
    industry: "מוצרי צריכה",
    brandColors: [
      { name: "כחול נורדי", hex: "#2E5090" },
      { name: "לבן שלג", hex: "#F8F9FA" },
      { name: "אפור קר", hex: "#8B9DAF" },
      { name: "כהה", hex: "#1E293B" },
    ],
    fonts: ["Heebo", "Rubik"],
  },
  {
    id: "fanta",
    name: "פאנטה",
    industry: "משקאות",
    brandColors: [
      { name: "כתום פאנטה", hex: "#FF6600" },
      { name: "כחול", hex: "#003DA5" },
      { name: "ירוק", hex: "#009639" },
      { name: "לבן", hex: "#FFFFFF" },
    ],
    fonts: ["Heebo", "Open Sans"],
  },
  {
    id: "sprite",
    name: "ספרייט",
    industry: "משקאות",
    brandColors: [
      { name: "ירוק ספרייט", hex: "#008B47" },
      { name: "צהוב לימון", hex: "#FFD700" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "כהה", hex: "#1A1A2E" },
    ],
    fonts: ["Heebo", "Open Sans"],
  },
  {
    id: "fuze-tea",
    name: "פיוזטי",
    industry: "משקאות",
    brandColors: [
      { name: "ירוק תה", hex: "#5B8C5A" },
      { name: "כתום אפרסק", hex: "#FF8C42" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "חום טבעי", hex: "#6B4226" },
    ],
    fonts: ["Heebo", "Open Sans"],
  },
  {
    id: "yellow",
    name: "Yellow",
    industry: "חנויות נוחות בתחנות דלק",
    brandColors: [
      { name: "צהוב Yellow", hex: "#FFD100" },
      { name: "שחור", hex: "#1A1A1A" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "אפור כהה", hex: "#333333" },
    ],
    fonts: ["Heebo", "Open Sans"],
  },
];

/** Simulated extracted data per client for demo purposes */
export const simulatedExtractions: Record<string, ExtractedBrandData> = {
  big: {
    colors: [
      { name: "אדום BIG ראשי", hex: "#E30613", cmyk: "M100 Y100" },
      { name: "כחול BIG", hex: "#0054A6", cmyk: "C100 M70" },
      { name: "צהוב BIG", hex: "#FFED00", cmyk: "Y100" },
      { name: "לבן", hex: "#FFFFFF" },
      { name: "שחור", hex: "#1A1A1A" },
    ],
    fonts: [
      { name: "Heebo Bold", size: "32-48px", usage: "כותרות ראשיות" },
      { name: "Heebo Medium", size: "18-24px", usage: "כותרות משניות" },
      { name: "Open Sans", size: "14-16px", usage: "גוף טקסט" },
      { name: "Open Sans Bold", size: "14px", usage: "הדגשות וכפתורים" },
    ],
    logoRules: [
      { rule: "לוגו ממוקם תמיד במרכז-תחתון של הפרסום", type: "do" },
      { rule: "שימוש בבלוקים מלבניים צבעוניים למבצעים", type: "do" },
      { rule: "הוספת סטמפת 'הכניסה חופשית' בכל פרסום", type: "do" },
      { rule: "שמירה על מרווח מינימלי סביב הלוגו", type: "do" },
      { rule: "אין לשנות את יחס הגובה-רוחב של הלוגו", type: "dont" },
      { rule: "אין להוסיף אפקטים כמו צל או שיפוע", type: "dont" },
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
