import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
}

const DEFAULT_TASKS = [
  "לנקות את הבית",
  "להכין את האוכל לשבת",
  "לקנות חלות",
  "לקנות יין לקידוש",
  "להכין את השולחן",
  "להדליק נרות שבת",
  "להכין בגדי שבת",
  "לטעון את הטלפון",
];

const ShabbatTaskList = ({ userId }: { userId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('shabbat_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');

      if (error) throw error;

      if (data.length === 0) {
        // Initialize with default tasks
        await initializeDefaultTasks();
      } else {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultTasks = async () => {
    const defaultTasksData = DEFAULT_TASKS.map((title, index) => ({
      user_id: userId,
      title,
      is_completed: false,
      is_default: true,
      sort_order: index
    }));

    const { data, error } = await supabase
      .from('shabbat_tasks')
      .insert(defaultTasksData)
      .select();

    if (error) {
      console.error('Error initializing tasks:', error);
      return;
    }

    setTasks(data);
  };

  const toggleTask = async (taskId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('shabbat_tasks')
        .update({ is_completed: !currentState })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, is_completed: !currentState } : t)
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const { data, error } = await supabase
        .from('shabbat_tasks')
        .insert({
          user_id: userId,
          title: newTask.trim(),
          sort_order: tasks.length
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data]);
      setNewTask("");
      toast({ title: "המשימה נוספה בהצלחה" });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('shabbat_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const resetTasks = async () => {
    try {
      const { error } = await supabase
        .from('shabbat_tasks')
        .update({ is_completed: false })
        .eq('user_id', userId);

      if (error) throw error;

      setTasks(prev => prev.map(t => ({ ...t, is_completed: false })));
      toast({ title: "כל המשימות אופסו" });
    } catch (error) {
      console.error('Error resetting tasks:', error);
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span>הכנות לשבת</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{tasks.length}
          </span>
        </CardTitle>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="הוסף משימה חדשה..."
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            className="text-right"
          />
          <Button onClick={addTask} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                task.is_completed ? 'bg-primary/10 border-primary/20' : 'bg-card border-border'
              }`}
            >
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={() => toggleTask(task.id, task.is_completed)}
              />
              <span className={`flex-1 text-right ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-50 hover:opacity-100"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {tasks.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetTasks}
            className="w-full mt-2"
          >
            אפס את כל המשימות לשבת הבאה
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ShabbatTaskList;
