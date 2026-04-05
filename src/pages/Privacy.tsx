const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">מדיניות פרטיות</h1>
      <div className="space-y-4 text-muted-foreground">
        <p>ברוכים הבאים למדיניות הפרטיות של בין השמשות.</p>
        <h2 className="text-xl font-semibold text-foreground">איסוף מידע</h2>
        <p>אנו אוספים מידע שאתם מספקים לנו באופן ישיר, כגון כתובת דוא"ל, שם ומיקום לצורך חישוב זמני שבת.</p>
        <h2 className="text-xl font-semibold text-foreground">שימוש במידע</h2>
        <p>המידע משמש אותנו לספק לכם את השירותים שלנו, כולל זמני שבת מותאמים, תזכורות והתראות.</p>
        <h2 className="text-xl font-semibold text-foreground">שיתוף מידע</h2>
        <p>איננו משתפים את המידע האישי שלכם עם צדדים שלישיים, למעט כנדרש על פי חוק.</p>
        <h2 className="text-xl font-semibold text-foreground">אבטחת מידע</h2>
        <p>אנו נוקטים באמצעי אבטחה סבירים כדי להגן על המידע האישי שלכם.</p>
        <h2 className="text-xl font-semibold text-foreground">יצירת קשר</h2>
        <p>לשאלות בנוגע למדיניות פרטיות זו, אנא פנו אלינו דרך האפליקציה.</p>
      </div>
    </div>
  );
};

export default Privacy;
