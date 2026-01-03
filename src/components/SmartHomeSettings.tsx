import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Lightbulb,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Home,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  discoverBridges,
  createBridgeUser,
  getLights,
  getGroups,
  dimForShabbat,
  validateBridgeConnection,
  type HueBridge,
  type HueLight,
  type HueGroup,
} from "@/lib/philipsHueApi";

const STORAGE_KEY = 'hue_bridge_config';

interface HueSettings {
  enabled: boolean;
  bridge: HueBridge | null;
  dimBrightness: number;
  dimMinutesBefore: number;
}

const SmartHomeSettings = () => {
  const [settings, setSettings] = useState<HueSettings>({
    enabled: false,
    bridge: null,
    dimBrightness: 40, // percentage
    dimMinutesBefore: 30,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredBridges, setDiscoveredBridges] = useState<{ id: string; internalipaddress: string }[]>([]);
  const [lights, setLights] = useState<HueLight[]>([]);
  const [groups, setGroups] = useState<HueGroup[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<'search' | 'link' | 'done'>('search');
  const [selectedBridgeIp, setSelectedBridgeIp] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.bridge) {
      checkConnection();
    }
  }, [settings.bridge]);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Error loading Hue settings:', error);
    }
  };

  const saveSettings = (newSettings: HueSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const checkConnection = async () => {
    if (!settings.bridge) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('checking');
    const isValid = await validateBridgeConnection(settings.bridge);
    setConnectionStatus(isValid ? 'connected' : 'disconnected');

    if (isValid) {
      const [fetchedLights, fetchedGroups] = await Promise.all([
        getLights(settings.bridge),
        getGroups(settings.bridge),
      ]);
      setLights(fetchedLights);
      setGroups(fetchedGroups.filter(g => g.type === 'Room'));
    }
  };

  const handleSearchBridges = async () => {
    setIsSearching(true);
    try {
      const bridges = await discoverBridges();
      setDiscoveredBridges(bridges);
      
      if (bridges.length === 0) {
        toast({
          title: "לא נמצאו גשרים",
          description: "ודא שגשר Hue מחובר לרשת",
          variant: "destructive",
        });
      } else if (bridges.length === 1) {
        setSelectedBridgeIp(bridges[0].internalipaddress);
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לחפש גשרים ברשת",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnectBridge = async () => {
    if (!selectedBridgeIp) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת IP של הגשר",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setSetupStep('link');

    // Try to create user every 2 seconds for 30 seconds
    let attempts = 0;
    const maxAttempts = 15;

    const tryConnect = async (): Promise<boolean> => {
      try {
        const username = await createBridgeUser(selectedBridgeIp);
        if (username) {
          const newBridge: HueBridge = {
            ip: selectedBridgeIp,
            username,
          };
          
          saveSettings({
            ...settings,
            enabled: true,
            bridge: newBridge,
          });
          
          setSetupStep('done');
          toast({
            title: "הגשר חובר בהצלחה!",
            description: "כעת תוכל לשלוט באורות לקראת שבת",
          });
          return true;
        }
      } catch (error: any) {
        if (error.message !== 'LINK_BUTTON_NOT_PRESSED') {
          throw error;
        }
      }
      return false;
    };

    const interval = setInterval(async () => {
      attempts++;
      const connected = await tryConnect();
      
      if (connected || attempts >= maxAttempts) {
        clearInterval(interval);
        setIsConnecting(false);
        
        if (!connected && attempts >= maxAttempts) {
          setSetupStep('search');
          toast({
            title: "הזמן פג",
            description: "לא לחצת על כפתור הגשר בזמן",
            variant: "destructive",
          });
        }
      }
    }, 2000);
  };

  const handleDisconnect = () => {
    saveSettings({
      ...settings,
      enabled: false,
      bridge: null,
    });
    setLights([]);
    setGroups([]);
    setConnectionStatus('disconnected');
    toast({
      title: "הגשר נותק",
    });
  };

  const handleTestDim = async () => {
    if (!settings.bridge) return;

    toast({
      title: "מעמעם אורות...",
      description: "האורות יעמעמו בהדרגה",
    });

    const brightness = Math.round((settings.dimBrightness / 100) * 254);
    const success = await dimForShabbat(settings.bridge, brightness, 100); // 10 seconds transition for test

    if (success) {
      toast({
        title: "האורות עומעמו!",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעמעם את האורות",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">בית חכם</h3>
        </div>
        <Badge 
          variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
          className="gap-1"
        >
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-3 h-3" />
              מחובר
            </>
          ) : connectionStatus === 'checking' ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              בודק...
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              לא מחובר
            </>
          )}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        חבר את Philips Hue לעמעום אוטומטי של האורות לפני כניסת שבת
      </p>

      {!settings.bridge ? (
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Lightbulb className="w-4 h-4" />
              חבר Philips Hue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>חיבור Philips Hue</DialogTitle>
              <DialogDescription>
                {setupStep === 'search' && "נחפש את גשר Hue ברשת הביתית שלך"}
                {setupStep === 'link' && "לחץ על הכפתור שעל גבי גשר Hue"}
              </DialogDescription>
            </DialogHeader>

            {setupStep === 'search' && (
              <div className="space-y-4">
                <Button 
                  onClick={handleSearchBridges} 
                  disabled={isSearching}
                  className="w-full gap-2"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      מחפש...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      חפש גשרים ברשת
                    </>
                  )}
                </Button>

                {discoveredBridges.length > 0 && (
                  <div className="space-y-2">
                    <Label>גשרים שנמצאו:</Label>
                    {discoveredBridges.map((bridge) => (
                      <Button
                        key={bridge.id}
                        variant={selectedBridgeIp === bridge.internalipaddress ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedBridgeIp(bridge.internalipaddress)}
                      >
                        {bridge.internalipaddress}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>או הזן כתובת IP ידנית:</Label>
                  <Input
                    placeholder="192.168.1.X"
                    value={selectedBridgeIp}
                    onChange={(e) => setSelectedBridgeIp(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleConnectBridge}
                  disabled={!selectedBridgeIp || isConnecting}
                  className="w-full"
                >
                  המשך
                </Button>
              </div>
            )}

            {setupStep === 'link' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Lightbulb className="w-12 h-12 text-primary" />
                </div>
                <p className="font-medium">לחץ על הכפתור העגול שעל גבי גשר Hue</p>
                <p className="text-sm text-muted-foreground">
                  יש לך 30 שניות ללחוץ על הכפתור...
                </p>
                {isConnecting && (
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-primary" />
                )}
              </div>
            )}

            {setupStep === 'done' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-24 h-24 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-12 h-12 text-green-500" />
                </div>
                <p className="font-medium text-green-600">הגשר חובר בהצלחה!</p>
                <Button onClick={() => setShowSetupDialog(false)} className="w-full">
                  סיום
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : (
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <Label htmlFor="hue-enabled" className="text-sm">
              עמעום אוטומטי לפני שבת
            </Label>
            <Switch
              id="hue-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => saveSettings({ ...settings, enabled: checked })}
            />
          </div>

          {/* Brightness Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Sun className="w-4 h-4" />
                עוצמת אור
              </Label>
              <span className="text-sm font-medium">{settings.dimBrightness}%</span>
            </div>
            <Slider
              value={[settings.dimBrightness]}
              onValueChange={([value]) => saveSettings({ ...settings, dimBrightness: value })}
              min={5}
              max={100}
              step={5}
            />
          </div>

          {/* Minutes Before */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Moon className="w-4 h-4" />
              דקות לפני כניסת שבת
            </Label>
            <Input
              type="number"
              value={settings.dimMinutesBefore}
              onChange={(e) => saveSettings({ ...settings, dimMinutesBefore: parseInt(e.target.value) || 30 })}
              min={5}
              max={120}
            />
          </div>

          {/* Connected Lights */}
          {lights.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">אורות מחוברים ({lights.length})</Label>
              <div className="flex flex-wrap gap-2">
                {groups.slice(0, 5).map((group) => (
                  <Badge key={group.id} variant="outline" className="gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {group.name}
                  </Badge>
                ))}
                {groups.length > 5 && (
                  <Badge variant="outline">+{groups.length - 5}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={handleTestDim}
            >
              <Lightbulb className="w-4 h-4" />
              בדוק עמעום
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={checkConnection}
              title="רענן חיבור"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDisconnect}
              title="נתק"
            >
              <WifiOff className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            העמעום יופעל {settings.dimMinutesBefore} דקות לפני הדלקת נרות
          </p>
        </div>
      )}
    </Card>
  );
};

export default SmartHomeSettings;
