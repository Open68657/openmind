export interface BrandColor {
  name: string;
  hex: string;
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
