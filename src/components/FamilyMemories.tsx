import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, BookHeart, Plus, ChefHat, Calendar, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Memory {
  id: string;
  type: 'memory' | 'recipe';
  title: string;
  content: string | null;
  date: string | null;
  parsha: string | null;
  tags: string[] | null;
  created_at: string;
}

const FamilyMemories = ({ userId }: { userId: string }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [formData, setFormData] = useState({
    type: 'memory' as 'memory' | 'recipe',
    title: '',
    content: '',
    parsha: '',
    tags: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMemories();
  }, [userId]);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories((data || []) as Memory[]);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "יש להזין כותרת", variant: "destructive" });
      return;
    }

    try {
      const memoryData = {
        user_id: userId,
        type: formData.type,
        title: formData.title,
        content: formData.content || null,
        parsha: formData.parsha || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
        date: new Date().toISOString().split('T')[0]
      };

      if (editingMemory) {
        const { error } = await supabase
          .from('family_memories')
          .update(memoryData)
          .eq('id', editingMemory.id);

        if (error) throw error;
        toast({ title: "הזיכרון עודכן בהצלחה" });
      } else {
        const { error } = await supabase
          .from('family_memories')
          .insert(memoryData);

        if (error) throw error;
        toast({ title: formData.type === 'memory' ? "הזיכרון נשמר" : "המתכון נשמר" });
      }

      resetForm();
      fetchMemories();
    } catch (error) {
      console.error('Error saving memory:', error);
      toast({ title: "שגיאה בשמירה", variant: "destructive" });
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('family_memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMemories(prev => prev.filter(m => m.id !== id));
      toast({ title: "נמחק בהצלחה" });
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const resetForm = () => {
    setFormData({ type: 'memory', title: '', content: '', parsha: '', tags: '' });
    setEditingMemory(null);
    setDialogOpen(false);
  };

  const startEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      type: memory.type,
      title: memory.title,
      content: memory.content || '',
      parsha: memory.parsha || '',
      tags: memory.tags?.join(', ') || ''
    });
    setDialogOpen(true);
  };

  const memoriesList = memories.filter(m => m.type === 'memory');
  const recipesList = memories.filter(m => m.type === 'recipe');

  const MemoryCard = ({ memory }: { memory: Memory }) => (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium text-right">{memory.title}</h4>
            {memory.content && (
              <p className="text-sm text-muted-foreground mt-1 text-right line-clamp-3">
                {memory.content}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {memory.parsha && (
                <Badge variant="outline" className="text-xs">
                  פרשת {memory.parsha}
                </Badge>
              )}
              {memory.date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(memory.date), 'dd/MM/yyyy', { locale: he })}
                </span>
              )}
              {memory.tags?.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(memory)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMemory(memory.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-pink-500/20 bg-gradient-to-br from-card to-pink-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>זיכרונות משפחתיים ומתכונים</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                הוסף
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-right">
                  {editingMemory ? 'ערוך' : 'הוסף'} {formData.type === 'memory' ? 'זיכרון' : 'מתכון'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-right">
                <div className="flex gap-2">
                  <Button
                    variant={formData.type === 'memory' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'memory' }))}
                    className="flex-1 gap-2"
                  >
                    <BookHeart className="h-4 w-4" />
                    זיכרון
                  </Button>
                  <Button
                    variant={formData.type === 'recipe' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'recipe' }))}
                    className="flex-1 gap-2"
                  >
                    <ChefHat className="h-4 w-4" />
                    מתכון
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>כותרת</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={formData.type === 'memory' ? "שבת אצל סבא וסבתא..." : "עוגת שוקולד של סבתא..."}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{formData.type === 'memory' ? 'תיאור הזיכרון' : 'המתכון'}</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={formData.type === 'memory' ? "ספר על הזיכרון המשפחתי..." : "רשום את המתכון..."}
                    className="text-right min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>פרשה (אופציונלי)</Label>
                  <Input
                    value={formData.parsha}
                    onChange={(e) => setFormData(prev => ({ ...prev, parsha: e.target.value }))}
                    placeholder="בראשית, נח..."
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label>תגיות (מופרדות בפסיק)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="חג, משפחה, מסורת..."
                    className="text-right"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingMemory ? 'עדכן' : 'שמור'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    ביטול
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="memories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="memories" className="gap-2">
              <BookHeart className="h-4 w-4" />
              זיכרונות ({memoriesList.length})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-2">
              <ChefHat className="h-4 w-4" />
              מתכונים ({recipesList.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="memories" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {memoriesList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                עדיין אין זיכרונות. הוסף את הזיכרון הראשון!
              </p>
            ) : (
              memoriesList.map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))
            )}
          </TabsContent>
          <TabsContent value="recipes" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {recipesList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                עדיין אין מתכונים. הוסף את המתכון הראשון!
              </p>
            ) : (
              recipesList.map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FamilyMemories;
