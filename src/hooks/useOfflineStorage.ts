 import { useEffect, useState, useCallback } from 'react';
 
 const STORAGE_KEY = 'ben-hashmashot-offline-data';
 
 interface OfflineShabbatData {
   candleLighting: string;
   havdalah: string;
   parashat: string;
   shabbatEntry: string;
   sunrise?: string;
   sunset?: string;
   tzeit?: string;
   alot?: string;
   city: string;
   tradition: string;
   halachot?: string[];
   lastUpdated: number;
 }
 
 interface OfflineData {
   shabbat: OfflineShabbatData | null;
   hebrewDate: string;
   tasks: Array<{ id: string; title: string; isCompleted: boolean }>;
 }
 
 const DEFAULT_DATA: OfflineData = {
   shabbat: null,
   hebrewDate: '',
   tasks: [],
 };
 
 export const useOfflineStorage = () => {
   const [offlineData, setOfflineData] = useState<OfflineData>(DEFAULT_DATA);
   const [isOnline, setIsOnline] = useState(navigator.onLine);
 
   // Load from localStorage on mount
   useEffect(() => {
     try {
       const stored = localStorage.getItem(STORAGE_KEY);
       if (stored) {
         const parsed = JSON.parse(stored);
         setOfflineData(parsed);
       }
     } catch (error) {
       console.error('Error loading offline data:', error);
     }
   }, []);
 
   // Monitor online status
   useEffect(() => {
     const handleOnline = () => setIsOnline(true);
     const handleOffline = () => setIsOnline(false);
 
     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
 
     return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
     };
   }, []);
 
   // Save data to localStorage
   const saveOfflineData = useCallback((data: Partial<OfflineData>) => {
     setOfflineData(prev => {
       const newData = { ...prev, ...data };
       try {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
       } catch (error) {
         console.error('Error saving offline data:', error);
       }
       return newData;
     });
   }, []);
 
   // Save Shabbat times
   const saveShabbatTimes = useCallback((data: OfflineShabbatData) => {
     saveOfflineData({ shabbat: { ...data, lastUpdated: Date.now() } });
   }, [saveOfflineData]);
 
   // Save Hebrew date
   const saveHebrewDate = useCallback((date: string) => {
     saveOfflineData({ hebrewDate: date });
   }, [saveOfflineData]);
 
   // Save tasks
   const saveTasks = useCallback((tasks: OfflineData['tasks']) => {
     saveOfflineData({ tasks });
   }, [saveOfflineData]);
 
   // Check if data is stale (older than 24 hours)
   const isDataStale = useCallback(() => {
     if (!offlineData.shabbat?.lastUpdated) return true;
     const dayInMs = 24 * 60 * 60 * 1000;
     return Date.now() - offlineData.shabbat.lastUpdated > dayInMs;
   }, [offlineData.shabbat?.lastUpdated]);
 
   return {
     offlineData,
     isOnline,
     isDataStale,
     saveShabbatTimes,
     saveHebrewDate,
     saveTasks,
   };
 };
 
 // Halachic traditions with candle lighting offsets
 export const HALACHIC_TRADITIONS = {
   ashkenaz: {
     id: 'ashkenaz',
     name: 'אשכנז',
     candleLightingOffset: 18, // 18 minutes before sunset
     havdalahOffset: 42, // 42 minutes after sunset (Rabbeinu Tam)
   },
   sephard: {
     id: 'sephard',
     name: 'ספרד',
     candleLightingOffset: 20, // 20 minutes before sunset
     havdalahOffset: 30, // 30 minutes after sunset
   },
   chabad: {
     id: 'chabad',
     name: 'חב"ד',
     candleLightingOffset: 18,
     havdalahOffset: 72, // Rabbeinu Tam (72 minutes)
   },
   teimani: {
     id: 'teimani',
     name: 'תימני',
     candleLightingOffset: 20,
     havdalahOffset: 25,
   },
   jerusalem: {
     id: 'jerusalem',
     name: 'ירושלים',
     candleLightingOffset: 40, // 40 minutes before sunset
     havdalahOffset: 42,
   },
 } as const;
 
 export type HalachicTradition = keyof typeof HALACHIC_TRADITIONS;