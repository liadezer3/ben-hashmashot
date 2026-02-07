import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommunityPostCard from "./CommunityPostCard";
import CreatePostDialog from "./CreatePostDialog";

interface CommunityPost {
  id: string;
  user_id: string;
  display_name: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

const CommunityFeed = ({ userId }: { userId: string }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("אנונימי");
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts((data || []) as CommunityPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserLikes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_post_likes')
        .select('post_id')
        .eq('user_id', userId);

      if (error) throw error;
      setLikedPostIds(new Set((data || []).map(l => l.post_id)));
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  }, [userId]);

  const fetchDisplayName = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (data?.full_name) setDisplayName(data.full_name);
  }, [userId]);

  useEffect(() => {
    fetchPosts();
    fetchUserLikes();
    fetchDisplayName();
  }, [fetchPosts, fetchUserLikes, fetchDisplayName]);

  const handleLikeToggle = (postId: string, nowLiked: boolean) => {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (nowLiked) next.add(postId);
      else next.delete(postId);
      return next;
    });
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (nowLiked ? 1 : -1) }
          : p
      )
    );
  };

  const handleDelete = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      
      // Delete image from storage if exists
      if (post?.image_url) {
        const url = new URL(post.image_url);
        const pathParts = url.pathname.split('/community-images/');
        if (pathParts[1]) {
          await supabase.storage.from('community-images').remove([pathParts[1]]);
        }
      }

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: "הפוסט נמחק" });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: "שגיאה במחיקה", variant: "destructive" });
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <span>פינת קהילה</span>
          </div>
          <CreatePostDialog
            userId={userId}
            displayName={displayName}
            onPostCreated={fetchPosts}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users2 className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">עדיין אין שיתופים.</p>
            <p className="text-sm text-muted-foreground/70">
              היה הראשון לשתף חוויית שבת! 🕯️
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {posts.map(post => (
              <CommunityPostCard
                key={post.id}
                post={post}
                currentUserId={userId}
                isLiked={likedPostIds.has(post.id)}
                onLikeToggle={handleLikeToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityFeed;
