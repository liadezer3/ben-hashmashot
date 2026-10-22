import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function AIDisclosureFooter() {
  return (
    <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm">
      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      <span className="text-amber-800 dark:text-amber-200">
        חלק מהתכנים נוצרים בעזרת בינה מלאכותית
      </span>
      <Link
        to="/ai-disclosure"
        className="text-amber-600 dark:text-amber-400 hover:underline font-medium mr-1"
      >
        למידע נוסף
      </Link>
    </div>
  );
}

export default AIDisclosureFooter;
