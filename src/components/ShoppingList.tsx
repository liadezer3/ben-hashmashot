import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface ShoppingListProps {
  groupId: string;
  groupName: string;
}

interface ShoppingItem {
  id: string;
  title: string;
  quantity: string;
  category: string;
  is_purchased: boolean;
  added_by_name: string;
  purchased_by_name: string | null;
}

export const ShoppingList = ({ groupId, groupName }: ShoppingListProps) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("אני");

  useEffect(() => {
    fetchItems();
    fetchDisplayName();

    // Real-time subscription
    const channel = supabase
      .channel(`shopping-${groupId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "shopping_list_items",
        filter: `group_id=eq.${groupId}`,
      }, () => {
        fetchItems();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  const fetchDisplayName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("family_group_members")
      .select("display_name")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();
    if (data) setDisplayName(data.display_name);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("shopping_list_items")
      .select("*")
      .eq("group_id", groupId)
      .order("is_purchased", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setItems(data as ShoppingItem[]);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("shopping_list_items").insert({
      group_id: groupId,
      title: newItem.trim(),
      quantity: newQuantity,
      added_by: session.user.id,
      added_by_name: displayName,
    });
    if (error) toast.error("שגיאה בהוספת פריט");
    else { setNewItem(""); setNewQuantity("1"); }
  };

  const togglePurchased = async (item: ShoppingItem) => {
    await supabase.from("shopping_list_items").update({
      is_purchased: !item.is_purchased,
      purchased_by_name: !item.is_purchased ? displayName : null,
    }).eq("id", item.id);
  };

  const deleteItem = async (id: string) => {
    await supabase.from("shopping_list_items").delete().eq("id", id);
  };

  const clearPurchased = async () => {
    await supabase.from("shopping_list_items")
      .delete()
      .eq("group_id", groupId)
      .eq("is_purchased", true);
    toast.success("פריטים שנקנו נמחקו");
  };

  const unpurchased = items.filter(i => !i.is_purchased);
  const purchased = items.filter(i => i.is_purchased);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          רשימת קניות — {groupName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add item */}
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="הוסף פריט..."
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1"
            dir="rtl"
          />
          <Input
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="כמות"
            className="w-20"
            dir="rtl"
          />
          <Button size="icon" onClick={addItem}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Unpurchased items */}
        {unpurchased.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
            <Checkbox
              checked={false}
              onCheckedChange={() => togglePurchased(item)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} • הוסף ע״י {item.added_by_name}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)}>
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}

        {/* Purchased items */}
        {purchased.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">נקנו ({purchased.length})</p>
              <Button variant="ghost" size="sm" onClick={clearPurchased} className="text-xs">
                נקה הכל
              </Button>
            </div>
            {purchased.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg opacity-50">
                <Checkbox checked={true} onCheckedChange={() => togglePurchased(item)} />
                <div className="flex-1">
                  <p className="text-sm line-through">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.purchased_by_name && `נקנה ע״י ${item.purchased_by_name}`}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {items.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground py-4">
            הרשימה ריקה 🛒 הוסף פריטים לקניות לשבת
          </p>
        )}
      </CardContent>
    </Card>
  );
};
