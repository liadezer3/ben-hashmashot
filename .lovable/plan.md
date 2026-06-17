אישרתי שהבעיה חיצונית לקוד: כרגע `ben-hashmashot.com` עדיין משתמש ב־NS של Netlify/NSOne:

```text
dns1.p06.nsone.net
dns2.p06.nsone.net
dns3.p06.nsone.net
dns4.p06.nsone.net
```

וה־A records עדיין מצביעים לכתובות של Netlify:

```text
35.157.26.135
63.176.8.218
```

## תוכנית תיקון

1. **להחזיר את ספק ה־DNS ל־Cloudflare אצל רשם הדומיין**
   - להיכנס למקום שבו נרכש הדומיין / מנוהל ה־Registrar.
   - למחוק את ארבעת ה־Nameservers של Netlify/NSOne:
     ```text
     dns1.p06.nsone.net
     dns2.p06.nsone.net
     dns3.p06.nsone.net
     dns4.p06.nsone.net
     ```
   - להגדיר במקום אותם את שני ה־Nameservers של Cloudflare:
     ```text
     rustam.ns.cloudflare.com
     adel.ns.cloudflare.com
     ```

2. **לוודא שב־Cloudflare קיימים רשומות האתר הנכונות**
   לאחר שה־NS חוזרים ל־Cloudflare, Cloudflare הוא זה שינהל את הרשומות בפועל. שם צריך לוודא ש־`ben-hashmashot.com` ו־`www.ben-hashmashot.com` מפנים ל־Lovable, לא ל־Netlify.

   אם משתמשים בחיבור רגיל ל־Lovable:
   ```text
   A     @      185.158.133.1
   A     www    185.158.133.1
   ```

   אם משתמשים במצב Cloudflare Proxy ב־Lovable, צריך להשלים את חיבור הדומיין דרך Lovable עם האפשרות:
   ```text
   Domain uses Cloudflare or a similar proxy
   ```
   ואז להשתמש ברשומות ש־Lovable יציג במסך החיבור.

3. **לחבר מחדש את הדומיינים בפרויקט Lovable**
   כרגע לפי פרטי הפרויקט אין Custom Domain מחובר. צריך להוסיף מחדש:
   ```text
   ben-hashmashot.com
   www.ben-hashmashot.com
   ```
   דרך:
   ```text
   Project Settings → Domains → Connect Domain
   ```

4. **בדיקת תקינות אחרי העדכון**
   לאחר שינוי ה־NS אצל הרשם, נבדוק שוב שה־DNS חזר ל־Cloudflare:
   ```text
   ben-hashmashot.com NS → rustam.ns.cloudflare.com, adel.ns.cloudflare.com
   ```
   ואז נבדוק שהאתר כבר לא מגיע ל־Netlify וששני הכתובות עולות:
   ```text
   https://ben-hashmashot.com
   https://www.ben-hashmashot.com
   ```

## חשוב

את שינוי ה־NS עצמו אי אפשר לבצע מתוך קוד האתר או מתוך Supabase/Lovable אם הדומיין לא נרכש דרך Lovable; הוא חייב להתבצע במסך ניהול הדומיין אצל הרשם שבו הדומיין רשום. אחרי שתעדכן שם את שני ה־Nameservers של Cloudflare, אוכל לבדוק לך שהשינוי נקלט ולהנחות בדיוק אילו רשומות לשים ב־Cloudflare.