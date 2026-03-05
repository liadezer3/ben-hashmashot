import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingList } from "@/components/ShoppingList";

interface FamilyShoppingProps {
  userId: string;
}

interface Group {
  id: string;
  name: string;
}

export const FamilyShoppingLists = ({ userId }: FamilyShoppingProps) => {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase
        .from("family_group_members")
        .select("group_id, family_groups(id, name)")
        .eq("user_id", userId);
      
      if (data) {
        const g = data
          .map((d: any) => d.family_groups)
          .filter(Boolean) as Group[];
        setGroups(g);
      }
    };
    fetchGroups();
  }, [userId]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <ShoppingList key={group.id} groupId={group.id} groupName={group.name} />
      ))}
    </div>
  );
};
