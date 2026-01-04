# 🎙️ Alexa Skill - זמני שבת (Shabbat Times)

מדריך מלא לפרסום האפליקציה כ-Alexa Skill.

## 📋 תוכן עניינים

1. [דרישות מוקדמות](#דרישות-מוקדמות)
2. [יצירת חשבון Amazon Developer](#יצירת-חשבון-amazon-developer)
3. [יצירת ה-Skill](#יצירת-ה-skill)
4. [הגדרת Lambda Function](#הגדרת-lambda-function)
5. [בדיקות](#בדיקות)
6. [פרסום](#פרסום)

---

## דרישות מוקדמות

- חשבון [Amazon Developer](https://developer.amazon.com/)
- חשבון [AWS](https://aws.amazon.com/) (לחינם לשנה הראשונה)
- ה-API של זמני שבת פועל (Supabase Edge Function)

---

## יצירת חשבון Amazon Developer

1. **גש ל-[developer.amazon.com](https://developer.amazon.com/)**

2. **לחץ על "Sign In"** ובחר "Create your Amazon Developer account"

3. **מלא את הפרטים:**
   - שם מלא
   - כתובת אימייל
   - סיסמה
   - מספר טלפון לאימות

4. **אשר את חשבונך** דרך האימייל שתקבל

---

## יצירת ה-Skill

### שלב 1: יצירת Skill חדש

1. **גש ל-[Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)**

2. **לחץ על "Create Skill"**

3. **הגדרות בסיסיות:**
   - **Skill name:** `Shabbat Times` (או `זמני שבת`)
   - **Primary locale:** `English (US)` ו-`Hebrew (Israel)`
   - **Choose a model:** `Custom`
   - **Choose a backend:** `Alexa-hosted (Node.js)` או `Provision your own` (אם יש לך AWS)

4. **לחץ "Create skill"**

### שלב 2: העלאת Interaction Model

1. **בתפריט הצד, לחץ על "Interaction Model" → "JSON Editor"**

2. **העתק את התוכן מ:**
   - `interactionModels/custom/en-US.json` לאנגלית
   - `interactionModels/custom/he-IL.json` לעברית

3. **לחץ "Save Model"** ואז **"Build Model"**

### שלב 3: הגדרת Invocation Name

1. **בתפריט "Invocation"**
2. **הגדר את שם ההפעלה:**
   - אנגלית: `shabbat times`
   - עברית: `זמני שבת`

---

## הגדרת Lambda Function

### אפשרות א': Alexa-Hosted (מומלץ למתחילים)

1. **בתפריט "Code"** ב-Alexa Developer Console

2. **החלף את התוכן של `index.js`** בתוכן מ-`lambda/index.js`

3. **עדכן את ה-URL של ה-API:**
   ```javascript
   const SHABBAT_API_URL = 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/shabbat-api';
   ```
   
   החלף `YOUR_PROJECT_ID` ב-Project ID שלך מ-Supabase.

4. **לחץ "Deploy"**

### אפשרות ב': AWS Lambda (מתקדם)

1. **גש ל-[AWS Lambda Console](https://console.aws.amazon.com/lambda)**

2. **לחץ "Create function":**
   - **Function name:** `shabbat-times-alexa`
   - **Runtime:** `Node.js 18.x`
   - **Region:** `us-east-1` (חובה לאלקסה)

3. **העלה את הקוד:**
   ```bash
   cd alexa-skill/lambda
   npm install
   zip -r function.zip .
   ```
   העלה את `function.zip` ל-Lambda

4. **הוסף Alexa Trigger:**
   - לחץ "Add trigger"
   - בחר "Alexa Skills Kit"
   - הכנס את ה-Skill ID מ-Alexa Developer Console

5. **עדכן את ה-Endpoint ב-Alexa Console:**
   - עבור ל-"Endpoint" בתפריט
   - בחר "AWS Lambda ARN"
   - הכנס את ה-ARN של ה-Lambda function

---

## בדיקות

### בדיקה בסימולטור

1. **בתפריט "Test"** ב-Alexa Developer Console

2. **הפעל את המצב "Development"**

3. **נסה את הפקודות הבאות:**

   **באנגלית:**
   ```
   "alexa, open shabbat times"
   "when is candle lighting"
   "what is this week's parsha"
   "when is havdalah in tel aviv"
   ```

   **בעברית:**
   ```
   "אלקסה, פתח זמני שבת"
   "מתי הדלקת נרות"
   "מה הפרשה השבוע"
   "מתי הבדלה בתל אביב"
   ```

### בדיקה במכשיר אמיתי

1. **ודא שאותו חשבון Amazon מחובר למכשיר האלקסה שלך**

2. **אמור:** "Alexa, open Shabbat Times"

---

## פרסום

### שלב 1: הכנת ה-Skill

1. **בתפריט "Distribution":**

2. **מלא את הפרטים:**
   - **Public Name:** Shabbat Times / זמני שבת
   - **One Sentence Description:** Get Shabbat times and Jewish holiday information
   - **Detailed Description:** (השתמש בתיאור מ-`skill.json`)
   - **Example Phrases:** (השתמש בדוגמאות מ-`skill.json`)

3. **העלה אייקונים:**
   - **Small Icon:** 108x108 pixels (PNG)
   - **Large Icon:** 512x512 pixels (PNG)

4. **בחר קטגוריה:** `Religion & Spirituality`

### שלב 2: Privacy & Compliance

1. **ענה על השאלות:**
   - Does this skill allow users to make purchases? **No**
   - Does this skill collect users' personal information? **No**
   - Is this skill directed to children? **No**
   - Does this skill contain advertising? **No**

2. **הוסף קישורים:**
   - Privacy Policy URL
   - Terms of Use URL

### שלב 3: Submission

1. **בתפריט "Certification"**

2. **הרץ את הבדיקות האוטומטיות** - ודא שכולן עוברות

3. **לחץ "Submit for review"**

4. **המתן לאישור** (בדרך כלל 1-5 ימי עבודה)

---

## 🎯 פקודות נתמכות

| עברית | English | תיאור |
|-------|---------|-------|
| "מתי הדלקת נרות" | "when is candle lighting" | זמן הדלקת נרות |
| "מתי הבדלה" | "when is havdalah" | זמן הבדלה |
| "מה הפרשה השבוע" | "what is the parsha" | פרשת השבוע |
| "זמני שבת בתל אביב" | "shabbat times in tel aviv" | זמנים לעיר ספציפית |

---

## 🔧 פתרון בעיות

### "Skill not found"
- ודא שה-Skill במצב "Development" ומחובר לאותו חשבון Amazon

### "Error getting data"
- בדוק שה-API URL נכון
- ודא שה-Edge Function פועלת

### שגיאות Lambda
- בדוק את ה-CloudWatch Logs ב-AWS
- ודא שה-permissions נכונות

---

## 📞 תמיכה

- [Alexa Skills Kit Documentation](https://developer.amazon.com/docs/alexa-skills-kit-sdk-for-nodejs/overview.html)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)

---

## 📜 רישיון

MIT License - ראה קובץ LICENSE בפרויקט הראשי.
