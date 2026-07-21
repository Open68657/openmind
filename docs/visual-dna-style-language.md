# Visual DNA — "Everyday Abundance" Style Language
### שפת השפע היומיומי — פרומפט-אב לייצור תמונות בקו ויזואלי אחיד

מסמך זה מפרק את ה-DNA הוויזואלי של סדרת התמונות ומספק פרומפט-אב (master prompt)
עם משתנים, כך שאפשר לייצר תמונות בכל נושא שימשיכו בדיוק את אותו קו.

---

## 1. הרעיון הגדול (The Big Idea)

מותג "הכל-בחיים" / קוויק-קומרס רב-קטגוריה. אותן חמש קטגוריות חוזרות בכל פריים:
**FOOD · PETS · SPORT · HOME · PHARM**. כל תמונה היא *אריזה אחת מלאה בחיים שלמים* —
מצרכים + מוצרי בית + חיות מחמד + ספורט + פארמה + עציץ — מקובצים יחד במיכל אחד.
המסר: "אנחנו נושאים הכל, לכל תחומי החיים שלך".

---

## 2. הקבועים (Constants) — אלה אף פעם לא משתנים

| רכיב | מה קבוע |
|------|---------|
| **רקע** | צבע יחיד, שטוח, רווי לחלוטין (seamless), אחד לכל תמונה |
| **הנושא (Hero)** | אשכול צפוף ושופע של מוצרי יומיום מכמה קטגוריות, ביחד |
| **מיכל / מארגן** | ידיים בחיבוק, סל קניות פלסטיק, קופסת אקריל שקופה, או ארגונית עם תוויות |
| **האדם** | נטול-פנים או עם הבעה נייטרלית/דדפאן (בלי חיוך). נשא נייטרלי — המוצרים הם הגיבור |
| **לבוש** | נורמקור מינימלי בגוונים עמומים: ג'קט זית, מכנסי קמל, טי אפור/לבן, ג'ינס, כובע בז' |
| **פלטת מוצרים** | פסטלים "סוכריה" + 1–2 פופ חם |
| **תאורה** | תאורת אי-קומרס נקייה, key רך + צל כיווני חד על הרקע |
| **מרקם** | פוטוגרפי אמיתי ומוחשי — לא איור, לא רנדר. רואים נקבוביות ספוג, אריג, אדים, קליפת פרי |
| **קומפוזיציה** | מרוכזת, צפופה, "כמה דברים אפשר לדחוס", שופעת ומשועשעת |
| **טון** | אופטימי אך קריר, שנון, מושקע, elevated-mundane (יומיומי מוגבה) |

### פלטת הצבעים המדויקת
- **רקעים:** ירוק אביבי · מנטה · נייבי · תכלת שמיים · צהוב מרים (marigold)
- **מוצרים (פסטל):** תכלת אבקתי, מנטה, לבנדר, ורוד בייבי, אפרסק, ליים/שרטרז, חרדל
- **פופ חם (מבטא):** קורל, כתום
- **בגדים (נייטרל):** זית, קמל, בז', אפור, לבן, כחול ג'ינס

### ה"קאסט" של החפצים (אוצר מילים חוזר של אובייקטים)
בגט · קרטון חלב · פטרוזיליה/חסה · תפוח ירוק · שקית "DOGS" קראפט עם טביעת כף · חטיפי כלב ·
מזרן יוגה · כדור טניס · פוטבול · בקבוק מים · מנורת שולחן · כבל מאריך · מגבות · ספוג ·
מברשת כלים · בקבוק תרסיס · כוס · בקבוק תרופות/תוסף ענברי · שמפו · סבון · לוף · עציץ.
*הישנות של אותם חפצים בין הפריימים היא מה שיוצר את המשכיות המותג.*

---

## 3. ה"מהלכים" החתומים (Signature Moves)
1. רקע צבע שטוח ורווי אחד, נבחר מחדש לכל פריים.
2. אשכול צפוף של מוצרי יומיום מרובי-קטגוריה בתור הנושא.
3. מיכל/מארגן חכם: זרועות, סל, קופסה שקופה, או ארונית תיוק עם תוויות.
4. אדם נטול-פנים או דדפאן כנשא נייטרלי, בלבוש נורמקור עמום.
5. מוצרים פסטליים + פופ חם אחד-שניים, הכל פוטוגרפי ומוחשי.
6. קאסט חפצים חוזר (בגט, חלב, שקית כלב עם כף, מזרן יוגה, בקבוק תרופות, עציץ, מנורה).
7. תאורת אי-קומרס נקייה עם צל כיווני חד.
8. קריצה קונספטואלית — דרך לא צפויה לארגן/להציג את הסחורה.

---

## 4. המשתנים (Variables) — אלה מה שמחליפים לכל נושא חדש

- `[TOPIC]` — הנושא/התמה (למשל: חזרה ללימודים, טיסה, מטבח, גיימינג, תינוק חדש)
- `[BACKGROUND COLOR]` — צבע רקע שטוח ורווי אחד
- `[CARRIER]` — סל קניות צבעוני / חיבוק בשתי ידיים / קופסת אקריל שקופה / ארגונית עם תוויות / מיכל שנון אחר
- `[PRODUCT LIST]` — 8–14 חפצים מוחשיים רלוונטיים ל-`[TOPIC]`, בפלטת פסטל + פופ חם
- `[HUMAN CROP]` — סנטר-עד-מותן / צוואר-עד-רגליים / ידיים בלבד / בלי אדם
- `[RATIO]` — 9:16 / 4:5 / 1:1 / 3:4

---

## 5. פרומפט-האב (Master Prompt — paste-ready, English)

> Studio commercial photograph, medium-format look, hyper-real and tactile — a real
> photograph, **not** illustration or 3D render.
>
> **SUBJECT:** an abundant, densely-packed cluster of everyday **[TOPIC]** products —
> **[PRODUCT LIST]** — presented together as one curated bundle, carried in **[CARRIER]**.
> The products are the hero.
>
> **CAST:** a real person shown **[HUMAN CROP]**, face hidden or with a calm deadpan
> neutral expression (no smiling), wearing muted normcore basics (olive utility jacket,
> camel trousers, grey/white tee, denim, beige cap). The human is a neutral carrier.
>
> **PALETTE:** one single flat, fully-saturated, seamless background of **[BACKGROUND
> COLOR]**. Products in a soft candy-pastel palette (powder blue, mint, lavender, blush
> pink, peach, chartreuse, mustard) with one or two hot accent pops (coral, orange).
>
> **LIGHT:** clean modern e-commerce lighting, soft key with a crisp directional cast
> shadow on the seamless backdrop.
>
> **COMPOSITION:** centered, object-dense, playful abundance; every surface texture
> readable (fabric weave, sponge pores, condensation, fruit skin). Editorial, contemporary,
> witty, optimistic-but-cool; premium CPG / quick-commerce campaign aesthetic.
> **[RATIO]**. No text, no logos.

---

## 6. דוגמאות מיושמות (הוכחת המשכיות)

**נושא: "חזרה ללימודים"**
> …an abundant cluster of everyday **back-to-school** products — a lavender backpack, mint
> pencil case, powder-blue notebooks, a chartreuse water bottle, colored markers, an apple,
> a small potted plant, a coral stapler, headphones — cradled in both arms, chin-to-hip crop…
> flat saturated **sky-blue** background… coral accent… 4:5.

**נושא: "פינת קפה"**
> …a densely-packed bundle of everyday **coffee** objects — a pastel-pink moka pot, a mint
> mug, a bag of beans, a powder-blue grinder, a small milk carton, a chartreuse tin, a
> croissant, a potted plant — inside a **clear transparent acrylic tote** held by one hand…
> flat saturated **marigold-yellow** background… one orange accent pop… 1:1.

---

## 7. טיפים לשמירה על הקו
- החלף **צבע רקע** בין תמונות בסדרה, אבל שמור אותו **שטוח ורווי ובודד**.
- שמור **1–2 פופ חם** בלבד מול הפסטלים — זה מה שנותן את המתח.
- אל תיתן לאדם לחייך; פנים נייטרליות/מוסתרות = הקוד של הסדרה.
- החזר **לפחות חפץ אחד מהקאסט הקבוע** (בגט / עציץ / שקית כלב / מזרן יוגה) לכל פריים —
  זה מה ש"מדביק" נושא חדש לשפה הקיימת.
- תמיד **פוטוגרפי ומוחשי**, אף פעם לא איור או תלת-ממד.
