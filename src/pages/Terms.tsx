const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">תנאי שימוש</h1>
      <div className="space-y-4 text-muted-foreground">
        <p>ברוכים הבאים לתנאי השימוש של בין השמשות.</p>
        <h2 className="text-xl font-semibold text-foreground">קבלת התנאים</h2>
        <p>בשימוש באפליקציה זו, אתם מסכימים לתנאי שימוש אלה. אם אינכם מסכימים, אנא הימנעו משימוש באפליקציה.</p>
        <h2 className="text-xl font-semibold text-foreground">שימוש בשירות</h2>
        <p>השירות מספק זמני שבת וחגים, תזכורות, ותוכן יהודי. השירות ניתן כמות שהוא ("as is").</p>
        <h2 className="text-xl font-semibold text-foreground">חשבון משתמש</h2>
        <p>אתם אחראים לשמירה על סודיות חשבונכם ולכל הפעילות המתבצעת תחתיו.</p>
        <h2 className="text-xl font-semibold text-foreground">הגבלת אחריות</h2>
        <p>איננו אחראים לנזקים הנובעים משימוש בשירות. זמני השבת והחגים הם לצורך התייחסות בלבד.</p>
        <h2 className="text-xl font-semibold text-foreground">שינויים בתנאים</h2>
        <p>אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה בכל עת. שימוש מתמשך בשירות מהווה הסכמה לתנאים המעודכנים.</p>
      </div>
    </div>
  );
};

export default Terms;
