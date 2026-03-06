import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Copy, LogOut, Crown, UserPlus } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { SharedTaskList } from "./SharedTaskList";

interface FamilyGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  members?: GroupMember[];
}

interface GroupMember {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export const FamilyGroups = () => {
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get user's display name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.full_name) {
        setDisplayName(profile.full_name);
      }

      // Get groups the user is a member of
      const { data: memberOf } = await supabase
        .from('family_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = memberOf?.map(m => m.group_id) || [];

      // Get groups created by user OR that user is a member of
      const { data: groupsData, error } = await supabase
        .from('family_groups')
        .select('*')
        .or(`created_by.eq.${user.id}${groupIds.length > 0 ? `,id.in.(${groupIds.join(',')})` : ''}`);

      if (error) throw error;

      // Get members for each group
      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: members } = await supabase
            .from('family_group_members')
            .select('*')
            .eq('group_id', group.id);
          return { ...group, members: members || [] };
        })
      );

      setGroups(groupsWithMembers);
      
      // Set active group to first group if available
      if (groupsWithMembers.length > 0 && !activeGroupId) {
        setActiveGroupId(groupsWithMembers[0].id);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !displayName.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם קבוצה ושם תצוגה",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create the group
      const { data: group, error } = await supabase
        .from('family_groups')
        .insert({
          name: newGroupName,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('family_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          display_name: displayName,
          role: 'admin',
        });

      if (memberError) throw memberError;

      setNewGroupName("");
      setShowCreateForm(false);
      loadGroups();

      toast({
        title: "הצלחה!",
        description: "הקבוצה נוצרה בהצלחה",
      });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את הקבוצה",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim() || !displayName.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין קוד הזמנה ושם תצוגה",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('יש להתחבר כדי להצטרף לקבוצה');
      }

      const normalizedCode = joinCode.trim().toLowerCase();

      const { error: joinError } = await (supabase as any).rpc('join_family_group_by_code', {
        p_invite_code: normalizedCode,
        p_display_name: displayName.trim(),
      });

      if (joinError) {
        if (joinError.message?.includes('INVALID_INVITE_CODE')) {
          throw new Error('קוד הזמנה לא תקין');
        }
        if (joinError.message?.includes('ALREADY_MEMBER')) {
          throw new Error('את/ה כבר חבר/ה בקבוצה זו');
        }
        if (joinError.message?.includes('UNAUTHENTICATED')) {
          throw new Error('יש להתחבר כדי להצטרף לקבוצה');
        }
        throw joinError;
      }

      setJoinCode("");
      setShowJoinForm(false);
      await loadGroups();

      toast({
        title: "הצלחה!",
        description: "הצטרפת לקבוצה בהצלחה",
      });
    } catch (error: any) {
      console.error("Error joining group:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו להצטרף לקבוצה",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('family_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      loadGroups();
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }

      toast({
        title: "הצלחה!",
        description: "עזבת את הקבוצה",
      });
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעזוב את הקבוצה",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "הקוד הועתק!",
      description: "שתף את הקוד עם בני המשפחה",
    });
  };

  if (loading) {
    return (
      <Card className="p-6 animate-fade-in">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="space-y-6">
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">קבוצות משפחתיות</h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowJoinForm(!showJoinForm)} size="sm" variant="outline">
              <UserPlus className="w-4 h-4 ml-1" />
              הצטרף
            </Button>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
              <Plus className="w-4 h-4 ml-1" />
              צור קבוצה
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          צור קבוצה משפחתית ושתף רשימת משימות משותפת בזמן אמת
        </p>

        {/* Create Group Form */}
        {showCreateForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/30">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="השם שלך (יוצג לבני המשפחה)"
            />
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="שם הקבוצה (למשל: משפחת כהן)"
            />
            <div className="flex gap-2">
              <Button onClick={createGroup} disabled={saving}>
                {saving ? "יוצר..." : "צור קבוצה"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                ביטול
              </Button>
            </div>
          </div>
        )}

        {/* Join Group Form */}
        {showJoinForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/30">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="השם שלך (יוצג לבני המשפחה)"
            />
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="קוד הזמנה"
              dir="ltr"
            />
            <div className="flex gap-2">
              <Button onClick={joinGroup} disabled={saving}>
                {saving ? "מצטרף..." : "הצטרף לקבוצה"}
              </Button>
              <Button variant="outline" onClick={() => setShowJoinForm(false)}>
                ביטול
              </Button>
            </div>
          </div>
        )}

        {/* Groups List */}
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  activeGroupId === group.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                }`}
                onClick={() => setActiveGroupId(group.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{group.name}</span>
                    {group.created_by === currentUserId && (
                      <Crown className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteCode(group.invite_code);
                      }}
                      title="העתק קוד הזמנה"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {group.created_by !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          leaveGroup(group.id);
                        }}
                        title="עזוב קבוצה"
                      >
                        <LogOut className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{group.members?.length || 0} חברים</span>
                  {group.members && group.members.length > 0 && (
                    <span className="text-xs">
                      ({group.members.map(m => m.display_name).join(', ')})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>קוד הזמנה:</span>
                  <code className="bg-muted px-2 py-0.5 rounded" dir="ltr">{group.invite_code}</code>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            עדיין לא הצטרפת לקבוצה משפחתית
          </p>
        )}
      </Card>

      {/* Shared Task List for Active Group */}
      {activeGroup && (
        <SharedTaskList 
          groupId={activeGroup.id} 
          groupName={activeGroup.name}
        />
      )}
    </div>
  );
};
