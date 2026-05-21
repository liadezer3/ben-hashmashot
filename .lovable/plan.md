
# חיבור שירותי Google + כפתורים ייעודיים

## מה ייעשה

### 1. חיבור קונקטורים (דרך Lovable Connectors)
אבקש ממך לאשר חיבור לכל אחד מהשירותים הבאים (כל אחד פותח דיאלוג OAuth נפרד):

- **Gmail** (`google_mail`) — שליחה/קריאה של מיילים
- **Google Calendar** (`google_calendar`) — אירועים ביומן
- **Google Drive** (`google_drive`) — קבצים
- **Google Maps Platform** (`google_maps`) — מפות, גאוקודינג, מקומות
- **Google Sheets** (`google_sheets`) — גיליונות
- **Google Docs** (`google_docs`) — מסמכים
- **Google Slides** (`google_slides`) — מצגות
- **Gemini Enterprise** (`gemini_enterprise`) — חיפוש/סיכום AI על נתוני גוגל
- **Google Search Console** (`google_search_console`) — אנליטיקת חיפוש (אופציונלי לאתר שלך)

> הערה חשובה: כל הקונקטורים האלה מתחברים **לחשבון Google שלך כבעל האפליקציה** — לא לחשבון של כל משתמש קצה. כלומר Gmail ישלח מהמייל שלך, Calendar יקרא מהיומן שלך וכו'. אם תרצה שכל משתמש יחבר את החשבון שלו (למשל כל משפחה תסנכרן את היומן שלה) — נצטרך לבנות OAuth ידני נפרד דרך Google Cloud Console. אשאל אותך על זה אחרי שתבחר.

### 2. Edge Functions
לכל קונקטור (פרט ל-Maps ו-Gemini שיכולים לרוץ מהפרונט/מ-edge קיים) ייווצר Edge Function ב-Supabase שעוטף את ה-gateway של Lovable:
- `google-gmail-send` — שליחת מייל
- `google-calendar-create-event` — יצירת אירוע שבת ביומן
- `google-drive-list` — רשימת קבצים
- `google-sheets-read` — קריאת גיליון
- `google-docs-create` — יצירת מסמך
- `google-slides-create` — יצירת מצגת
- `gemini-enterprise-query` — שאילתת AI
- `google-search-console-stats` — סטטיסטיקות SEO

כל פונקציה: CORS, ולידציית JWT, Zod, החזרת שגיאות 402/429 בצורה ידידותית.

### 3. UI — קומפוננטה חדשה `GoogleIntegrationsHub`
כרטיס מרכזי עם **9 כפתורים ייעודיים** (גריד 3x3 רספונסיבי, צבעוני לפי לוגו של כל שירות):

```text
┌──────────┬──────────┬──────────┐
│  Gmail   │ Calendar │  Drive   │
├──────────┼──────────┼──────────┤
│   Maps   │  Sheets  │   Docs   │
├──────────┼──────────┼──────────┤
│  Slides  │  Gemini  │  Search  │
└──────────┴──────────┴──────────┘
```

כל כפתור פותח דיאלוג ייעודי עם פעולה מובנית רלוונטית לאפליקציה:
- **Gmail** → שליחת הזמנת שבת/הודעה למשפחה
- **Calendar** → הוספת זמני שבת והדלקת נרות ליומן (מחבר לפונקציה קיימת `CalendarAddButton`)
- **Drive** → גיבוי תמונות/זכרונות משפחתיים
- **Maps** → איתור בתי כנסת קרובים (משדרג את `SynagoguesFinder` הקיים)
- **Sheets** → ייצוא רשימת קניות לשבת
- **Docs** → יצירת חוברת פרשת השבוע
- **Slides** → מצגת ד״ת לסעודת שבת (משתמש ב-AI)
- **Gemini** → שאלות חכמות על תורה/פרשה
- **Search Console** → דשבורד SEO לאתר (מוצג רק לאדמין)

### 4. מיקום ב-UI
טאב חדש "**Google**" ב-`Settings.tsx` (אחרי "מרכז התראות"), אייקון: `<Globe />` או לוגו G מותאם.

---

## פרטים טכניים

- שמירת אסימוני OAuth: לא נדרשת — gateway של Lovable מטפל ברענון אוטומטית
- כל קריאות ה-gateway: `https://connector-gateway.lovable.dev/{connector_id}/...` עם headers `Authorization: Bearer ${LOVABLE_API_KEY}` ו-`X-Connection-Api-Key: ${CONNECTOR_API_KEY}`
- Maps יעבוד גם בפרונט עם `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`
- עיצוב: שימוש בטוקנים של design system (orange/brown — לפי memory), עם accent קל בצבעי המותג של כל שירות גוגל באייקון בלבד
- תמיכה דו-לשונית (he/en) דרך i18n קיים

## שאלות לפני התחלה

1. האם להמשיך במצב "חשבון אחד שלך לכולם" או שאתה רוצה OAuth פר-משתמש (יותר עבודה, צריך Google Cloud Project משלך)?
2. האם לכלול את **Google Search Console** (דורש שתאמת את הבעלות על `ben-hashmashot.com` או על הדומיין של Lovable)?
3. האם להציג את כל 9 הכפתורים לכל משתמש, או רק את הרלוונטיים לרמת השומרת המצוות (`observance_level`)?

