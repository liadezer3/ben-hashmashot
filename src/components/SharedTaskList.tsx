import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, Plus, Trash2, User } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface SharedTask {
  id: string;
  group_id: string;
  title: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_by_name: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

interface SharedTaskListProps {
  groupId: string;
  groupName: string;
}

export const SharedTaskList = ({ groupId, groupName }: SharedTaskListProps) => {
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
    loadUserDisplayName();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`shared_tasks_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_tasks',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as SharedTask]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new as SharedTask : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const loadUserDisplayName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from('family_group_members')
      .select('display_name')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (member?.display_name) {
      setDisplayName(member.display_name);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_tasks')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('shared_tasks')
        .insert({
          group_id: groupId,
          title: newTaskTitle,
          created_by: user.id,
          created_by_name: displayName || 'אנונימי',
        });

      if (error) throw error;
      setNewTaskTitle("");
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להוסיף את המשימה",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: SharedTask) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('shared_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_by: !task.is_completed ? user.id : null,
          completed_by_name: !task.is_completed ? displayName : null,
        })
        .eq('id', task.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('shared_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-fade-in">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">משימות משותפות - {groupName}</h2>
        </div>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} הושלמו
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="הוסף משימה חדשה..."
          className="flex-1"
        />
        <Button onClick={addTask} disabled={saving || !newTaskTitle.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              task.is_completed ? 'bg-muted/50' : 'bg-background'
            }`}
          >
            <Checkbox
              checked={task.is_completed}
              onCheckedChange={() => toggleTask(task)}
            />
            <div className="flex-1">
              <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                {task.title}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <User className="w-3 h-3" />
                <span>נוצר ע"י {task.created_by_name}</span>
                {task.is_completed && task.completed_by_name && (
                  <span className="text-primary">• הושלם ע"י {task.completed_by_name}</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            אין משימות עדיין. הוסף משימה ראשונה! ✨
          </p>
        )}
      </div>
    </Card>
  );
};
