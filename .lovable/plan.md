

# תוכנית: הוספת התחברות דרך גוגל + החלפת Twilio ב-Meta WhatsApp Cloud API

## סקירה
שני שינויים עיקריים: (1) הוספת כפתור "התחבר עם גוגל" בדף ה-Auth, (2) החלפת מערכת ההתראות של Twilio (SMS + WhatsApp) ב-Meta WhatsApp Cloud API לשליחת הודעות WhatsApp אוטומטיות.

---

## חלק א': התחברות דרך גוגל

### מה נדרש מהמשתמש (הגדרות חיצוניות)
1. **Google Cloud Console**: יצירת OAuth Client ID מסוג Web Application
   - הוספת `https://jpxyczlocqmfumkakdyx.supabase.co` כ-Authorized JavaScript Origin
   - הוספת `https://jpxyczlocqmfumkakdyx.supabase.co/auth/v1/callback` כ-Authorized Redirect URL
2. **Supabase Dashboard** (Authentication > Providers): הפעלת Google Provider והזנת Client ID + Client Secret
3. **Supabase Dashboard** (Authentication > URL Configuration): וידוא ש-Site URL מוגדר ל-`https://ben-hashmashot.lovable.app`

### שינויי קוד
- **`src/pages/Auth.tsx`**: הוספת כפתור "התחבר עם Google" שקורא ל-`supabase.auth.signInWithOAuth({ provider: 'google' })`. הכפתור יופיע מעל הטאבים (login/signup) עם מפריד "או"

---

## חלק ב': החלפת Twilio ב-Meta WhatsApp Cloud API

### מה נדרש מהמשתמש (הגדרות חיצוניות)
1. **Meta Business Account**: יצירת אפליקציה ב-[Meta for Developers](https://developers.facebook.com/)
2. קבלת **WhatsApp Business Phone Number ID** ו-**Access Token**
3. יצירת **Message Template** (למשל: תבנית עם שם `shabbat_times` שמכילה פרמטרים של זמנים)

### שינויי קוד
- **`supabase/functions/scheduled-push/index.ts`**:
  - הסרת פונקציות `sendSMS` ו-`sendWhatsApp` (Twilio)
  - הוספת פונקציית `sendWhatsAppMeta` שמשתמשת ב-Meta WhatsApp Cloud API (`https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`)
  - עדכון הלוגיקה הראשית להשתמש בפונקציה החדשה במקום Twilio
  - הסרת התלות ב-SMS (אם לא נדרש)

- **Supabase Secrets**: הוספת `WHATSAPP_PHONE_NUMBER_ID` ו-`WHATSAPP_ACCESS_TOKEN` (החלפת secrets של Twilio)

- **`src/components/NotificationSettings.tsx`**: עדכון ה-UI להסרת אופציית SMS (אם לא רלוונטית יותר) ועדכון ההסברים לגבי WhatsApp

---

## פרטים טכניים

### Google OAuth Flow
```typescript
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  });
};
```

### Meta WhatsApp Cloud API Call
```typescript
async function sendWhatsAppMeta(to: string, message: string): Promise<ChannelResult> {
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      }),
    }
  );
}
```

### שלבי ביצוע
1. הוספת כפתור Google Login ב-Auth.tsx
2. בקשת Secrets חדשים (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`)
3. עדכון `scheduled-push/index.ts` - החלפת Twilio ב-Meta API
4. עדכון NotificationSettings.tsx - הסרת SMS, עדכון WhatsApp UI

