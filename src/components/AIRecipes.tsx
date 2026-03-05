import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Loader2, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIRecipesProps {
  userId: string;
}

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  servings: number;
  prepTime: string;
  emoji: string;
}

export const AIRecipes = ({ userId }: AIRecipesProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCount] = useState("6");
  const [dietary, setDietary] = useState("regular");
  const [mealType, setMealType] = useState("friday-dinner");

  const generateRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recipes", {
        body: { guestCount: parseInt(guestCount), dietary, mealType },
      });
      if (error) throw error;
      if (data?.recipes) setRecipes(data.recipes);
    } catch {
      toast.error("שגיאה ביצירת מתכונים");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          מתכונים לשבת
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">סועדים</label>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                min="1"
                max="50"
                className="h-9"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">תזונה</label>
            <Select value={dietary} onValueChange={setDietary}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">רגיל</SelectItem>
                <SelectItem value="gluten-free">ללא גלוטן</SelectItem>
                <SelectItem value="vegetarian">צמחוני</SelectItem>
                <SelectItem value="vegan">טבעוני</SelectItem>
                <SelectItem value="low-carb">דל פחמימות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ארוחה</label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friday-dinner">סעודת ליל שבת</SelectItem>
                <SelectItem value="saturday-lunch">סעודת שבת</SelectItem>
                <SelectItem value="seuda-shlishit">סעודה שלישית</SelectItem>
                <SelectItem value="kiddush">קידוש</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={generateRecipes} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "מייצר מתכונים..." : "הצע מתכונים"}
        </Button>

        {recipes.map((recipe, i) => (
          <div key={i} className="p-4 rounded-lg border space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{recipe.emoji}</span>
              <div>
                <p className="font-semibold">{recipe.name}</p>
                <p className="text-xs text-muted-foreground">
                  {recipe.servings} מנות • {recipe.prepTime}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
            <div>
              <p className="text-xs font-medium mb-1">מצרכים:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {recipe.ingredients.map((ing, j) => (
                  <li key={j}>• {ing}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
