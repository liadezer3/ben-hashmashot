import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Home,
  AlertCircle,
  Thermometer,
  Wind,
  ArrowUpDown,
  Power,
  Settings2,
  CheckCircle2,
  XCircle,
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
import {
  validateConnection as validateHAConnection,
  getEntitiesByDomain,
  getHomeSummary,
  prepareForShabbat,
  dimAllLightsForShabbat,
  closeAllCovers,
  turnOffAllClimate,
  type HomeAssistantConfig,
  type HAEntity,
  getDomainIcon,
  getDomainNameHe,
  type EntityDomain,
} from "@/lib/homeAssistantApi";

const HUE_STORAGE_KEY = 'hue_bridge_config';
const HA_STORAGE_KEY = 'home_assistant_config';

interface HueSettings {
  enabled: boolean;
  bridge: HueBridge | null;
  dimBrightness: number;
  dimMinutesBefore: number;
}

interface HASettings {
  enabled: boolean;
  config: HomeAssistantConfig | null;
  dimBrightness: number;
  dimMinutesBefore: number;
  closeCovers: boolean;
  turnOffClimate: boolean;
}

type SmartHomePlatform = 'philips_hue' | 'home_assistant';

const SmartHomeSettings = () => {
  // Platform selection
  const [activePlatform, setActivePlatform] = useState<SmartHomePlatform>('home_assistant');
  
  // Philips Hue state
  const [hueSettings, setHueSettings] = useState<HueSettings>({
    enabled: false,
    bridge: null,
    dimBrightness: 40,
    dimMinutesBefore: 30,
  });
  const [hueConnecting, setHueConnecting] = useState(false);
  const [hueSearching, setHueSearching] = useState(false);
  const [discoveredBridges, setDiscoveredBridges] = useState<{ id: string; internalipaddress: string }[]>([]);
  const [hueLights, setHueLights] = useState<HueLight[]>([]);
  const [hueGroups, setHueGroups] = useState<HueGroup[]>([]);
  const [hueStatus, setHueStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [hueSetupDialog, setHueSetupDialog] = useState(false);
  const [hueSetupStep, setHueSetupStep] = useState<'search' | 'link' | 'done'>('search');
  const [selectedBridgeIp, setSelectedBridgeIp] = useState('');

  // Home Assistant state
  const [haSettings, setHASettings] = useState<HASettings>({
    enabled: false,
    config: null,
    dimBrightness: 40,
    dimMinutesBefore: 30,
    closeCovers: false,
    turnOffClimate: false,
  });
  const [haStatus, setHAStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const [haSetupDialog, setHASetupDialog] = useState(false);
  const [haUrl, setHAUrl] = useState('');
  const [haToken, setHAToken] = useState('');
  const [haSummary, setHASummary] = useState<{
    lights: { total: number; on: number };
    climate: { total: number; on: number };
    covers: { total: number; open: number };
    switches: { total: number; on: number };
  } | null>(null);
  const [haConnecting, setHAConnecting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadAllSettings();
  }, []);

  useEffect(() => {
    if (hueSettings.bridge) {
      checkHueConnection();
    }
  }, [hueSettings.bridge]);

  useEffect(() => {
    if (haSettings.config) {
      checkHAConnection();
    }
  }, [haSettings.config]);

  const loadAllSettings = () => {
    try {
      const savedHue = localStorage.getItem(HUE_STORAGE_KEY);
      if (savedHue) {
        setHueSettings(JSON.parse(savedHue));
      }
      const savedHA = localStorage.getItem(HA_STORAGE_KEY);
      if (savedHA) {
        setHASettings(JSON.parse(savedHA));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveHueSettings = (newSettings: HueSettings) => {
    setHueSettings(newSettings);
    localStorage.setItem(HUE_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const saveHASettings = (newSettings: HASettings) => {
    setHASettings(newSettings);
    localStorage.setItem(HA_STORAGE_KEY, JSON.stringify(newSettings));
  };

  // ============ Philips Hue Functions ============
  const checkHueConnection = async () => {
    if (!hueSettings.bridge) {
      setHueStatus('disconnected');
      return;
    }
    setHueStatus('checking');
    const isValid = await validateBridgeConnection(hueSettings.bridge);
    setHueStatus(isValid ? 'connected' : 'disconnected');

    if (isValid) {
      const [fetchedLights, fetchedGroups] = await Promise.all([
        getLights(hueSettings.bridge),
        getGroups(hueSettings.bridge),
      ]);
      setHueLights(fetchedLights);
      setHueGroups(fetchedGroups.filter(g => g.type === 'Room'));
    }
  };

  const handleSearchBridges = async () => {
    setHueSearching(true);
    try {
      const bridges = await discoverBridges();
      setDiscoveredBridges(bridges);
      if (bridges.length === 0) {
        toast({ title: "לא נמצאו גשרים", description: "ודא שגשר Hue מחובר לרשת", variant: "destructive" });
      } else if (bridges.length === 1) {
        setSelectedBridgeIp(bridges[0].internalipaddress);
      }
    } catch {
      toast({ title: "שגיאה", description: "לא הצלחנו לחפש גשרים ברשת", variant: "destructive" });
    } finally {
      setHueSearching(false);
    }
  };

  const handleConnectHueBridge = async () => {
    if (!selectedBridgeIp) {
      toast({ title: "שגיאה", description: "נא להזין כתובת IP של הגשר", variant: "destructive" });
      return;
    }
    setHueConnecting(true);
    setHueSetupStep('link');

    let attempts = 0;
    const maxAttempts = 15;

    const tryConnect = async (): Promise<boolean> => {
      try {
        const username = await createBridgeUser(selectedBridgeIp);
        if (username) {
          const newBridge: HueBridge = { ip: selectedBridgeIp, username };
          saveHueSettings({ ...hueSettings, enabled: true, bridge: newBridge });
          setHueSetupStep('done');
          toast({ title: "הגשר חובר בהצלחה!", description: "כעת תוכל לשלוט באורות לקראת שבת" });
          return true;
        }
      } catch (error: any) {
        if (error.message !== 'LINK_BUTTON_NOT_PRESSED') throw error;
      }
      return false;
    };

    const interval = setInterval(async () => {
      attempts++;
      const connected = await tryConnect();
      if (connected || attempts >= maxAttempts) {
        clearInterval(interval);
        setHueConnecting(false);
        if (!connected && attempts >= maxAttempts) {
          setHueSetupStep('search');
          toast({ title: "הזמן פג", description: "לא לחצת על כפתור הגשר בזמן", variant: "destructive" });
        }
      }
    }, 2000);
  };

  const handleDisconnectHue = () => {
    saveHueSettings({ ...hueSettings, enabled: false, bridge: null });
    setHueLights([]);
    setHueGroups([]);
    setHueStatus('disconnected');
    toast({ title: "הגשר נותק" });
  };

  const handleTestHueDim = async () => {
    if (!hueSettings.bridge) return;
    toast({ title: "מעמעם אורות...", description: "האורות יעמעמו בהדרגה" });
    const brightness = Math.round((hueSettings.dimBrightness / 100) * 254);
    const success = await dimForShabbat(hueSettings.bridge, brightness, 100);
    toast(success ? { title: "האורות עומעמו!" } : { title: "שגיאה", description: "לא הצלחנו לעמעם את האורות", variant: "destructive" });
  };

  // ============ Home Assistant Functions ============
  const checkHAConnection = async () => {
    if (!haSettings.config) {
      setHAStatus('disconnected');
      return;
    }
    setHAStatus('checking');
    const isValid = await validateHAConnection(haSettings.config);
    setHAStatus(isValid ? 'connected' : 'disconnected');

    if (isValid) {
      const summary = await getHomeSummary(haSettings.config);
      setHASummary(summary);
    }
  };

  const handleConnectHA = async () => {
    if (!haUrl || !haToken) {
      toast({ title: "שגיאה", description: "נא למלא את כל השדות", variant: "destructive" });
      return;
    }

    setHAConnecting(true);
    const config: HomeAssistantConfig = {
      url: haUrl.replace(/\/$/, ''), // Remove trailing slash
      accessToken: haToken,
    };

    const isValid = await validateHAConnection(config);
    setHAConnecting(false);

    if (isValid) {
      saveHASettings({ ...haSettings, enabled: true, config });
      setHASetupDialog(false);
      toast({ title: "Home Assistant מחובר!", description: "כעת תוכל לשלוט בבית החכם" });
    } else {
      toast({ title: "שגיאת חיבור", description: "ודא שהכתובת והטוקן נכונים", variant: "destructive" });
    }
  };

  const handleDisconnectHA = () => {
    saveHASettings({ ...haSettings, enabled: false, config: null });
    setHASummary(null);
    setHAStatus('disconnected');
    toast({ title: "Home Assistant נותק" });
  };

  const handleTestHAShabbat = async () => {
    if (!haSettings.config) return;
    
    toast({ title: "מכין את הבית לשבת...", description: "מבצע פעולות..." });
    
    const brightness = Math.round((haSettings.dimBrightness / 100) * 255);
    const result = await prepareForShabbat(haSettings.config, {
      dimLights: true,
      lightBrightness: brightness,
      closeCovers: haSettings.closeCovers,
      turnOffClimate: haSettings.turnOffClimate,
    });

    if (result.success) {
      toast({ 
        title: "הבית מוכן לשבת!", 
        description: result.actions.join(', ') || 'הפעולות בוצעו בהצלחה'
      });
    } else {
      toast({ 
        title: "חלק מהפעולות נכשלו", 
        description: result.actions.join(', '),
        variant: "destructive" 
      });
    }

    // Refresh summary
    const summary = await getHomeSummary(haSettings.config);
    setHASummary(summary);
  };

  const handleQuickAction = async (action: 'dim_lights' | 'close_covers' | 'turn_off_climate') => {
    if (!haSettings.config) return;

    const actionNames: Record<string, string> = {
      dim_lights: 'מעמעם אורות',
      close_covers: 'סוגר תריסים',
      turn_off_climate: 'מכבה מזגנים',
    };

    toast({ title: actionNames[action] + '...' });

    let success = false;
    const brightness = Math.round((haSettings.dimBrightness / 100) * 255);

    switch (action) {
      case 'dim_lights':
        success = await dimAllLightsForShabbat(haSettings.config, brightness);
        break;
      case 'close_covers':
        success = await closeAllCovers(haSettings.config);
        break;
      case 'turn_off_climate':
        success = await turnOffAllClimate(haSettings.config);
        break;
    }

    toast(success 
      ? { title: "בוצע בהצלחה!" }
      : { title: "שגיאה", variant: "destructive" }
    );

    const summary = await getHomeSummary(haSettings.config);
    setHASummary(summary);
  };

  const renderStatusBadge = (status: 'connected' | 'disconnected' | 'checking') => (
    <Badge variant={status === 'connected' ? 'default' : 'secondary'} className="gap-1">
      {status === 'connected' ? (
        <><Wifi className="w-3 h-3" /> מחובר</>
      ) : status === 'checking' ? (
        <><RefreshCw className="w-3 h-3 animate-spin" /> בודק...</>
      ) : (
        <><WifiOff className="w-3 h-3" /> לא מחובר</>
      )}
    </Badge>
  );

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">בית חכם</h3>
        </div>
      </div>

      <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as SmartHomePlatform)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="home_assistant" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Home Assistant
          </TabsTrigger>
          <TabsTrigger value="philips_hue" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Philips Hue
          </TabsTrigger>
        </TabsList>

        {/* Home Assistant Tab */}
        <TabsContent value="home_assistant" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              שלוט בכל מכשירי הבית החכם - תאורה, מזגנים, תריסים ועוד
            </p>
            {haSettings.config && renderStatusBadge(haStatus)}
          </div>

          {!haSettings.config ? (
            <Dialog open={haSetupDialog} onOpenChange={setHASetupDialog}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  חבר Home Assistant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>חיבור Home Assistant</DialogTitle>
                  <DialogDescription>
                    הזן את כתובת ה-URL וטוקן הגישה של Home Assistant
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>כתובת URL</Label>
                    <Input
                      placeholder="http://homeassistant.local:8123"
                      value={haUrl}
                      onChange={(e) => setHAUrl(e.target.value)}
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      לדוגמה: http://192.168.1.100:8123
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>טוקן גישה (Long-Lived Access Token)</Label>
                    <Input
                      type="password"
                      placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                      value={haToken}
                      onChange={(e) => setHAToken(e.target.value)}
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      ניתן ליצור טוקן ב: הגדרות → פרופיל → טוקנים
                    </p>
                  </div>
                  <Button onClick={handleConnectHA} disabled={haConnecting} className="w-full">
                    {haConnecting ? (
                      <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> מתחבר...</>
                    ) : (
                      'התחבר'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="space-y-4">
              {/* Home Summary */}
              {haSummary && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                    <Lightbulb className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
                    <div className="text-xs text-muted-foreground">תאורה</div>
                    <div className="font-bold">{haSummary.lights.on}/{haSummary.lights.total}</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-500/10">
                    <Thermometer className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <div className="text-xs text-muted-foreground">מזגנים</div>
                    <div className="font-bold">{haSummary.climate.on}/{haSummary.climate.total}</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-500/10">
                    <ArrowUpDown className="w-5 h-5 mx-auto text-green-500 mb-1" />
                    <div className="text-xs text-muted-foreground">תריסים</div>
                    <div className="font-bold">{haSummary.covers.open}/{haSummary.covers.total}</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-500/10">
                    <Power className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                    <div className="text-xs text-muted-foreground">מתגים</div>
                    <div className="font-bold">{haSummary.switches.on}/{haSummary.switches.total}</div>
                  </div>
                </div>
              )}

              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <Label htmlFor="ha-enabled" className="text-sm">הפעלה אוטומטית לפני שבת</Label>
                <Switch
                  id="ha-enabled"
                  checked={haSettings.enabled}
                  onCheckedChange={(checked) => saveHASettings({ ...haSettings, enabled: checked })}
                />
              </div>

              {/* Brightness Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    עוצמת אור
                  </Label>
                  <span className="text-sm font-medium">{haSettings.dimBrightness}%</span>
                </div>
                <Slider
                  value={[haSettings.dimBrightness]}
                  onValueChange={([value]) => saveHASettings({ ...haSettings, dimBrightness: value })}
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
                  value={haSettings.dimMinutesBefore}
                  onChange={(e) => saveHASettings({ ...haSettings, dimMinutesBefore: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={120}
                />
              </div>

              {/* Additional Options */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="close-covers" className="text-sm flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    סגור תריסים אוטומטית
                  </Label>
                  <Switch
                    id="close-covers"
                    checked={haSettings.closeCovers}
                    onCheckedChange={(checked) => saveHASettings({ ...haSettings, closeCovers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="turn-off-climate" className="text-sm flex items-center gap-2">
                    <Wind className="w-4 h-4" />
                    כבה מזגנים אוטומטית
                  </Label>
                  <Switch
                    id="turn-off-climate"
                    checked={haSettings.turnOffClimate}
                    onCheckedChange={(checked) => saveHASettings({ ...haSettings, turnOffClimate: checked })}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('dim_lights')}>
                  <Lightbulb className="w-4 h-4 mr-1" />
                  עמעם
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('close_covers')}>
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  סגור
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('turn_off_climate')}>
                  <Wind className="w-4 h-4 mr-1" />
                  כבה
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="default" className="flex-1 gap-2" onClick={handleTestHAShabbat}>
                  <Home className="w-4 h-4" />
                  הכן לשבת
                </Button>
                <Button variant="ghost" size="icon" onClick={checkHAConnection} title="רענן">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDisconnectHA} title="נתק">
                  <WifiOff className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                הפעולות יבוצעו {haSettings.dimMinutesBefore} דקות לפני הדלקת נרות
              </p>
            </div>
          )}
        </TabsContent>

        {/* Philips Hue Tab */}
        <TabsContent value="philips_hue" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              עמעום אוטומטי של אורות Philips Hue לפני כניסת שבת
            </p>
            {hueSettings.bridge && renderStatusBadge(hueStatus)}
          </div>

          {!hueSettings.bridge ? (
            <Dialog open={hueSetupDialog} onOpenChange={setHueSetupDialog}>
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
                    {hueSetupStep === 'search' && "נחפש את גשר Hue ברשת הביתית שלך"}
                    {hueSetupStep === 'link' && "לחץ על הכפתור שעל גבי גשר Hue"}
                  </DialogDescription>
                </DialogHeader>

                {hueSetupStep === 'search' && (
                  <div className="space-y-4">
                    <Button onClick={handleSearchBridges} disabled={hueSearching} className="w-full gap-2">
                      {hueSearching ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> מחפש...</>
                      ) : (
                        <><Wifi className="w-4 h-4" /> חפש גשרים ברשת</>
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
                    <Button onClick={handleConnectHueBridge} disabled={!selectedBridgeIp || hueConnecting} className="w-full">
                      המשך
                    </Button>
                  </div>
                )}

                {hueSetupStep === 'link' && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                      <Lightbulb className="w-12 h-12 text-primary" />
                    </div>
                    <p className="font-medium">לחץ על הכפתור העגול שעל גבי גשר Hue</p>
                    <p className="text-sm text-muted-foreground">יש לך 30 שניות ללחוץ על הכפתור...</p>
                    {hueConnecting && <RefreshCw className="w-6 h-6 mx-auto animate-spin text-primary" />}
                  </div>
                )}

                {hueSetupStep === 'done' && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-24 h-24 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <p className="font-medium text-green-600">הגשר חובר בהצלחה!</p>
                    <Button onClick={() => setHueSetupDialog(false)} className="w-full">סיום</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="hue-enabled" className="text-sm">עמעום אוטומטי לפני שבת</Label>
                <Switch
                  id="hue-enabled"
                  checked={hueSettings.enabled}
                  onCheckedChange={(checked) => saveHueSettings({ ...hueSettings, enabled: checked })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    עוצמת אור
                  </Label>
                  <span className="text-sm font-medium">{hueSettings.dimBrightness}%</span>
                </div>
                <Slider
                  value={[hueSettings.dimBrightness]}
                  onValueChange={([value]) => saveHueSettings({ ...hueSettings, dimBrightness: value })}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  דקות לפני כניסת שבת
                </Label>
                <Input
                  type="number"
                  value={hueSettings.dimMinutesBefore}
                  onChange={(e) => saveHueSettings({ ...hueSettings, dimMinutesBefore: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={120}
                />
              </div>

              {hueLights.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">אורות מחוברים ({hueLights.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {hueGroups.slice(0, 5).map((group) => (
                      <Badge key={group.id} variant="outline" className="gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {group.name}
                      </Badge>
                    ))}
                    {hueGroups.length > 5 && <Badge variant="outline">+{hueGroups.length - 5}</Badge>}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleTestHueDim}>
                  <Lightbulb className="w-4 h-4" />
                  בדוק עמעום
                </Button>
                <Button variant="ghost" size="icon" onClick={checkHueConnection} title="רענן חיבור">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDisconnectHue} title="נתק">
                  <WifiOff className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                העמעום יופעל {hueSettings.dimMinutesBefore} דקות לפני הדלקת נרות
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default SmartHomeSettings;
