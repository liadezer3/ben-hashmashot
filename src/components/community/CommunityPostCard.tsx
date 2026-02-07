import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface CommunityPost {
  id: string;
  user_id: string;
  display_name: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId: string;
  isLiked: boolean;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
  onDelete: (postId: string) => void;
}

const CommunityPostCard = ({ post, currentUserId, isLiked, onLikeToggle, onDelete }: CommunityPostCardProps) => {
  const [likeLoading, setLikeLoading] = useState(false);
  const isOwner = post.user_id === currentUserId;

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('community_post_likes')
          .insert({ post_id: post.id, user_id: currentUserId });
      }
      onLikeToggle(post.id, !isLiked);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
      {post.image_url && (
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={post.image_url}
            alt="שיתוף קהילתי"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
              </span>
              <Badge variant="secondary" className="text-xs font-medium">
                {post.display_name}
              </Badge>
            </div>
            {post.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
              onClick={handleLike}
              disabled={likeLoading}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{post.likes_count}</span>
            </Button>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityPostCard;
