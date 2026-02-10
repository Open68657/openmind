export interface Client {
  id: string;
  name: string;
  industry: string;
}

export const clients: Client[] = [
  { id: "leumi", name: "בנק לאומי", industry: "פיננסים" },
  { id: "coca-cola", name: "קוקה קולה", industry: "מזון ומשקאות" },
  { id: "tnuva", name: "תנובה", industry: "מזון ומשקאות" },
  { id: "bezeq", name: "בזק", industry: "טלקום" },
  { id: "elal", name: "אל על", industry: "תעופה ותיירות" },
  { id: "strauss", name: "שטראוס", industry: "מזון ומשקאות" },
  { id: "partner", name: "פרטנר", industry: "טלקום" },
  { id: "super-pharm", name: "סופר-פארם", industry: "קמעונאות" },
  { id: "mizrahi", name: "בנק מזרחי", industry: "פיננסים" },
];
