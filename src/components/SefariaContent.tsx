import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, BookOpen, ExternalLink, RefreshCw, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchParshaCommentaries,
  fetchTextByRef,
  fetchDafYomi,
  fetchDailyHalacha,
  getParshaRef,
  type SefariaLink,
  type SefariaText,
} from "@/lib/sefariaApi";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SefariaContentProps {
  currentParsha?: string;
}

interface Commentary {
  heRef: string;
  text: string;
  loading: boolean;
}

const SefariaContent = ({ currentParsha }: SefariaContentProps) => {
  const [commentaries, setCommentaries] = useState<SefariaLink[]>([]);
  const [loadingCommentaries, setLoadingCommentaries] = useState(false);
  const [selectedCommentary, setSelectedCommentary] = useState<Commentary | null>(null);
  const [dafYomi, setDafYomi] = useState<{ ref: string; heRef: string } | null>(null);
  const [dailyHalacha, setDailyHalacha] = useState<{ ref: string; heRef: string } | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDailyContent();
  }, []);

  useEffect(() => {
    if (currentParsha) {
      loadCommentaries();
    }
  }, [currentParsha]);

  const fetchDailyContent = async () => {
    setLoadingDaily(true);
    try {
      const [daf, halacha] = await Promise.all([
        fetchDafYomi(),
        fetchDailyHalacha(),
      ]);
      setDafYomi(daf);
      setDailyHalacha(halacha);
    } catch (error) {
      console.error('Error fetching daily content:', error);
    } finally {
      setLoadingDaily(false);
    }
  };

  const loadCommentaries = async () => {
    if (!currentParsha) return;
    
    setLoadingCommentaries(true);
    try {
      const links = await fetchParshaCommentaries(currentParsha);
      setCommentaries(links);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הפירושים",
        variant: "destructive",
      });
    } finally {
      setLoadingCommentaries(false);
    }
  };

  const loadCommentaryText = async (link: SefariaLink) => {
    setSelectedCommentary({
      heRef: link.sourceHeRef || link.heRef,
      text: '',
      loading: true,
    });

    try {
      const text = await fetchTextByRef(link.sourceRef || link.ref);
      if (text) {
        const heText = Array.isArray(text.he) ? text.he.join(' ') : text.he;
        setSelectedCommentary({
          heRef: link.sourceHeRef || link.heRef,
          text: heText,
          loading: false,
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הפירוש",
        variant: "destructive",
      });
      setSelectedCommentary(null);
    }
  };

  const openInSefaria = (ref: string) => {
    window.open(`https://www.sefaria.org/${encodeURIComponent(ref)}`, '_blank');
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">מקורות ופירושים</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchDailyContent}
          title="רענן"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="daily">לימוד יומי</TabsTrigger>
          <TabsTrigger value="parsha" disabled={!currentParsha}>
            פירושי הפרשה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {loadingDaily ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              {dafYomi && (
                <Card 
                  className="p-4 bg-background/50 cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={() => openInSefaria(dafYomi.ref)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">דף יומי</p>
                        <p className="font-semibold">{dafYomi.heRef}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              )}

              {dailyHalacha && (
                <Card 
                  className="p-4 bg-background/50 cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={() => openInSefaria(dailyHalacha.ref)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">לימוד יומי</p>
                        <p className="font-semibold">{dailyHalacha.heRef}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              )}

              {!dafYomi && !dailyHalacha && (
                <p className="text-center text-muted-foreground py-4">
                  לא נמצא תוכן יומי
                </p>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="parsha">
          {loadingCommentaries ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : commentaries.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <Accordion type="single" collapsible className="w-full">
                {commentaries.map((link, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger 
                      className="text-right"
                      onClick={() => loadCommentaryText(link)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {link.category}
                        </Badge>
                        <span>{link.sourceHeRef || link.heRef}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedCommentary?.heRef === (link.sourceHeRef || link.heRef) ? (
                        selectedCommentary.loading ? (
                          <Skeleton className="h-20 w-full" />
                        ) : (
                          <div className="space-y-3">
                            <p 
                              className="text-sm leading-relaxed text-right"
                              dir="rtl"
                              dangerouslySetInnerHTML={{ __html: selectedCommentary.text }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInSefaria(link.sourceRef || link.ref)}
                              className="gap-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              פתח בספריא
                            </Button>
                          </div>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">לחץ לטעינה...</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Book className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {currentParsha 
                  ? "לא נמצאו פירושים לפרשה זו"
                  : "בחר פרשה לצפייה בפירושים"}
              </p>
              {currentParsha && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => {
                    const ref = getParshaRef(currentParsha);
                    if (ref) openInSefaria(ref);
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  פתח בספריא
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default SefariaContent;
