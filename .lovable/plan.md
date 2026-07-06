# תוכנית שדרוג — בן השמשות

בדקתי את הקוד הקיים. חלק גדול מהרשימה **כבר קיים** באפליקציה, ולכן התוכנית מתמקדת רק בפערים האמיתיים.

## מה כבר קיים (לא נבנה מחדש)
- **טלגרם + Web Push** — קיימים ב-`scheduled-push` וב-`WebPushSettings` ✓
- **בית חכם** — `SmartHomeSettings` (Home Assistant / Philips Hue) ✓
- **מנגנון משפחות** — `FamilyGroups` / `EnhancedFamilyHub` ✓
- **תקציר פרשה AI** — `generate-parsha-content` (אך ללא התאמת קהל) — נרחיב
- **הוספה ליומן** — `CalendarAddButton` (חד־פעמי בלבד) — נרחיב למנוי דינמי
- **תוכן הלכתי** — `SefariaContent` + שקיעה ב-`ShabbatTimes` (אך ללא לוח זמני יום מלא)

## מה חסר ויוטמע

### 1. אופטימיזציית זמנים חכמה (AI Time Optimization)
- Edge Function חדש `time-optimizer` שמקבל מיקום + זמן כניסת שבת, מושך מזג אוויר (Open-Meteo, ללא מפתח) ומחשב "חלון יציאה מומלץ".
- ניתוח AI (Lovable AI Gateway, `google/gemini-3-flash-preview`) שמנסח המלצה קצרה בעברית ("מומלץ להקדים ב-20 דקות").
- קומפוננטה `SmartDepartureCard` בעמוד הבית, מוצגת בשלבי ההכנה לשבת.

### 2. קונסיירז' ערב שבת (AI Friday Concierge)
- Edge Function `friday-concierge` — צ'אט מבוסס LLM שמקבל את משימות המשתמש ומחזיר לו"ז מותאם לפי זמן כניסת השבת של אותו שבוע.
- קומפוננטת צ'אט `FridayConcierge` (עם `react-markdown` לתצוגה) בלשונית ייעודית / בעמוד הבית.

### 3. תקצירי פרשה מותאמים לקהל
- הרחבת `generate-parsha-content` בפרמטר `audience` (`kids` / `business` / `table` / `general`).
- בורר קהל ב-`ParshaContent` + אפשרות שליחה במייל/וואטסאפ של התקציר הנבחר.

### 4. מנוי יומן דינמי (Auto-updating Calendar)
- Edge Function `calendar-feed` שמחזיר קובץ `.ics` מנוי (webcal) עם אירועי שבת מתעדכנים ל-52 שבועות קדימה לפי מיקום המשתמש.
- כפתור "הרשמה ליומן דינמי" ב-`CalendarAddButton` (קישור `webcal://` ל-Google/Apple/Outlook).

### 5. כפתור ניווט Waze / Google Maps
- הוספת כפתור "נוסעים לשבת? ניווט הביתה" בתזכורות ובעמוד הבית, שבונה קישור `waze://`/`https://waze.com/ul` ו-Google Maps ליעד הבית של המשתמש, עם חישוב האם יגיע לפני כניסת שבת.

### 6. לוח זמני הלכה יומי מלא
- קומפוננטה `DailyHalachicTimes` המחשבת מקומית עם `@hebcal/core` (כבר בשימוש): עלות השחר, הנץ, סוף זמן ק"ש, חצות, מנחה גדולה, פלג המנחה, שקיעה, צאת הכוכבים.
- מוצגת למשתמשים דתיים/מסורתיים (`showReligiousContent`) עם בחירת תזכורות יומיות.

## פרטים טכניים
- כל קריאות ה-AI דרך Lovable AI Gateway (`LOVABLE_API_KEY` כבר מוגדר), ברירת מחדל `google/gemini-3-flash-preview`.
- מזג אוויר: Open-Meteo (חינם, ללא מפתח). ניווט: קישורי URL בצד לקוח בלבד.
- Edge Functions חדשים יתווספו ל-`supabase/config.toml` עם `verify_jwt` מתאים.
- נדרש שדה `home_address`/יעד בית ב-`user_preferences` עבור הניווט — יתווסף במיגרציה (כולל GRANTs).
- אין שינויי סכימה מעבר לכך; כל שאר התכונות משתמשות בטבלאות קיימות.

## סדר עבודה מוצע
שלב א': זמני הלכה יומיים + מנוי יומן דינמי (מקומי, ללא AI).
שלב ב': תקצירי פרשה מותאמים + כפתור ניווט.
שלב ג': אופטימיזציית זמנים AI + קונסיירז' ערב שבת.
