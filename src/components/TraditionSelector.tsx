 import { useState, useEffect } from 'react';
 import { Card } from '@/components/ui/card';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { Label } from '@/components/ui/label';
 import { HALACHIC_TRADITIONS, HalachicTradition } from '@/hooks/useOfflineStorage';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 interface TraditionSelectorProps {
   onTraditionChange?: (tradition: HalachicTradition) => void;
 }
 
 export const TraditionSelector = ({ onTraditionChange }: TraditionSelectorProps) => {
   const [selectedTradition, setSelectedTradition] = useState<HalachicTradition>('ashkenaz');
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   useEffect(() => {
     loadTradition();
   }, []);
 
   const loadTradition = async () => {
     try {
       // First check localStorage
       const stored = localStorage.getItem('halachic-tradition');
       if (stored && stored in HALACHIC_TRADITIONS) {
         setSelectedTradition(stored as HalachicTradition);
       }
     } catch (error) {
       console.error('Error loading tradition:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const handleTraditionChange = async (tradition: HalachicTradition) => {
     setSelectedTradition(tradition);
     
     // Save to localStorage for offline access
     localStorage.setItem('halachic-tradition', tradition);
     
     // Notify parent
     onTraditionChange?.(tradition);
 
     toast({
       title: 'המסורת עודכנה',
       description: `הזמנים יחושבו לפי מסורת ${HALACHIC_TRADITIONS[tradition].name}`,
     });
   };
 
   if (loading) {
     return (
       <Card className="p-6 animate-pulse">
         <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
         <div className="space-y-3">
           <div className="h-12 bg-muted rounded"></div>
           <div className="h-12 bg-muted rounded"></div>
         </div>
       </Card>
     );
   }
 
   return (
     <Card className="p-6">
       <h3 className="text-lg font-bold mb-4">בחירת מסורת הלכתית</h3>
       <p className="text-sm text-muted-foreground mb-4">
         בחר את המסורת שלך לחישוב זמני הדלקת נרות והבדלה
       </p>
       
       <RadioGroup
         value={selectedTradition}
         onValueChange={(value) => handleTraditionChange(value as HalachicTradition)}
         className="space-y-3"
       >
         {Object.entries(HALACHIC_TRADITIONS).map(([key, tradition]) => (
           <div
             key={key}
             className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
           >
             <RadioGroupItem value={key} id={key} />
             <Label htmlFor={key} className="flex-1 cursor-pointer">
               <div className="flex items-center justify-between">
                 <span className="font-medium">{tradition.name}</span>
                 <span className="text-xs text-muted-foreground">
                   נרות: {tradition.candleLightingOffset} דק׳ | הבדלה: {tradition.havdalahOffset} דק׳
                 </span>
               </div>
             </Label>
           </div>
         ))}
       </RadioGroup>
 
       <div className="mt-4 p-3 bg-muted/50 rounded-lg">
         <p className="text-xs text-muted-foreground">
           💡 הזמנים מחושבים לפי שקיעת החמה במיקום שנבחר
         </p>
       </div>
     </Card>
   );
 };