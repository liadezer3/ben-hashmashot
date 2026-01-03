// Philips Hue API integration for smart home lighting

export interface HueBridge {
  ip: string;
  username: string;
}

export interface HueLight {
  id: string;
  name: string;
  state: {
    on: boolean;
    bri: number; // 0-254
    hue?: number;
    sat?: number;
    ct?: number; // color temperature
  };
}

export interface HueGroup {
  id: string;
  name: string;
  lights: string[];
  type: string;
  state: {
    all_on: boolean;
    any_on: boolean;
  };
}

/**
 * Discover Hue bridges on local network using meethue.com
 */
export const discoverBridges = async (): Promise<{ id: string; internalipaddress: string }[]> => {
  try {
    const response = await fetch('https://discovery.meethue.com/');
    if (!response.ok) {
      throw new Error('Failed to discover bridges');
    }
    return await response.json();
  } catch (error) {
    console.error('Error discovering Hue bridges:', error);
    return [];
  }
};

/**
 * Create a new user/app key on the Hue bridge
 * The user must press the link button on the bridge first!
 */
export const createBridgeUser = async (bridgeIp: string): Promise<string | null> => {
  try {
    const response = await fetch(`http://${bridgeIp}/api`, {
      method: 'POST',
      body: JSON.stringify({
        devicetype: 'shabbat_times_app#browser',
      }),
    });
    
    const data = await response.json();
    
    if (data[0]?.error) {
      if (data[0].error.type === 101) {
        throw new Error('LINK_BUTTON_NOT_PRESSED');
      }
      throw new Error(data[0].error.description);
    }
    
    return data[0]?.success?.username || null;
  } catch (error) {
    console.error('Error creating bridge user:', error);
    throw error;
  }
};

/**
 * Get all lights from the bridge
 */
export const getLights = async (bridge: HueBridge): Promise<HueLight[]> => {
  try {
    const response = await fetch(`http://${bridge.ip}/api/${bridge.username}/lights`);
    if (!response.ok) {
      throw new Error('Failed to get lights');
    }
    
    const data = await response.json();
    
    return Object.entries(data).map(([id, light]: [string, any]) => ({
      id,
      name: light.name,
      state: light.state,
    }));
  } catch (error) {
    console.error('Error getting lights:', error);
    return [];
  }
};

/**
 * Get all groups/rooms from the bridge
 */
export const getGroups = async (bridge: HueBridge): Promise<HueGroup[]> => {
  try {
    const response = await fetch(`http://${bridge.ip}/api/${bridge.username}/groups`);
    if (!response.ok) {
      throw new Error('Failed to get groups');
    }
    
    const data = await response.json();
    
    return Object.entries(data).map(([id, group]: [string, any]) => ({
      id,
      name: group.name,
      lights: group.lights,
      type: group.type,
      state: group.state,
    }));
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
};

/**
 * Set light state
 */
export const setLightState = async (
  bridge: HueBridge,
  lightId: string,
  state: Partial<{ on: boolean; bri: number; hue: number; sat: number; ct: number; transitiontime: number }>
): Promise<boolean> => {
  try {
    const response = await fetch(`http://${bridge.ip}/api/${bridge.username}/lights/${lightId}/state`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
    
    const data = await response.json();
    return !data[0]?.error;
  } catch (error) {
    console.error('Error setting light state:', error);
    return false;
  }
};

/**
 * Set group state (all lights in a room)
 */
export const setGroupState = async (
  bridge: HueBridge,
  groupId: string,
  state: Partial<{ on: boolean; bri: number; hue: number; sat: number; ct: number; transitiontime: number }>
): Promise<boolean> => {
  try {
    const response = await fetch(`http://${bridge.ip}/api/${bridge.username}/groups/${groupId}/action`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
    
    const data = await response.json();
    return !data[0]?.error;
  } catch (error) {
    console.error('Error setting group state:', error);
    return false;
  }
};

/**
 * Dim all lights gradually for Shabbat
 * This creates a warm, dimmed atmosphere
 */
export const dimForShabbat = async (
  bridge: HueBridge,
  targetBrightness: number = 100, // 0-254
  transitionTime: number = 600 // in 100ms units (600 = 60 seconds)
): Promise<boolean> => {
  try {
    const groups = await getGroups(bridge);
    
    // Dim all room groups
    const roomGroups = groups.filter(g => g.type === 'Room');
    
    const results = await Promise.all(
      roomGroups.map(group =>
        setGroupState(bridge, group.id, {
          on: true,
          bri: targetBrightness,
          ct: 400, // Warm white color temperature
          transitiontime: transitionTime,
        })
      )
    );
    
    return results.every(r => r);
  } catch (error) {
    console.error('Error dimming for Shabbat:', error);
    return false;
  }
};

/**
 * Turn off all lights
 */
export const turnOffAllLights = async (bridge: HueBridge): Promise<boolean> => {
  try {
    // Group 0 is "all lights"
    return await setGroupState(bridge, '0', { on: false, transitiontime: 10 });
  } catch (error) {
    console.error('Error turning off all lights:', error);
    return false;
  }
};

/**
 * Validate bridge connection
 */
export const validateBridgeConnection = async (bridge: HueBridge): Promise<boolean> => {
  try {
    const response = await fetch(`http://${bridge.ip}/api/${bridge.username}/config`);
    if (!response.ok) return false;
    
    const data = await response.json();
    return !!data.bridgeid;
  } catch (error) {
    return false;
  }
};
