// Home Assistant API integration for smart home control
// Supports lights, climate (AC), covers (blinds), switches, and more

export interface HomeAssistantConfig {
  url: string; // e.g., http://homeassistant.local:8123
  accessToken: string;
}

export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    brightness?: number;
    temperature?: number;
    current_temperature?: number;
    hvac_mode?: string;
    position?: number;
    [key: string]: any;
  };
  last_changed: string;
  last_updated: string;
}

export interface HAService {
  domain: string;
  service: string;
  target?: {
    entity_id: string | string[];
  };
  service_data?: Record<string, any>;
}

// Entity domain types
export type EntityDomain = 'light' | 'switch' | 'climate' | 'cover' | 'fan' | 'scene' | 'script' | 'automation';

const DOMAIN_ICONS: Record<EntityDomain, string> = {
  light: '💡',
  switch: '🔌',
  climate: '❄️',
  cover: '🪟',
  fan: '🌀',
  scene: '🎬',
  script: '📜',
  automation: '⚙️',
};

const DOMAIN_NAMES_HE: Record<EntityDomain, string> = {
  light: 'תאורה',
  switch: 'מתגים',
  climate: 'מיזוג',
  cover: 'תריסים',
  fan: 'מאווררים',
  scene: 'סצנות',
  script: 'סקריפטים',
  automation: 'אוטומציות',
};

export const getDomainIcon = (domain: EntityDomain): string => DOMAIN_ICONS[domain] || '🏠';
export const getDomainNameHe = (domain: EntityDomain): string => DOMAIN_NAMES_HE[domain] || domain;

/**
 * Make API request to Home Assistant
 */
const haRequest = async <T>(
  config: HomeAssistantConfig,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, any>
): Promise<T | null> => {
  try {
    const response = await fetch(`${config.url}/api/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      console.error(`HA API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Home Assistant API error:', error);
    return null;
  }
};

/**
 * Validate Home Assistant connection
 */
export const validateConnection = async (config: HomeAssistantConfig): Promise<boolean> => {
  try {
    const result = await haRequest<any>(config, '');
    return result?.message === 'API running.';
  } catch {
    return false;
  }
};

/**
 * Get Home Assistant configuration info
 */
export const getConfig = async (config: HomeAssistantConfig): Promise<any> => {
  return await haRequest(config, 'config');
};

/**
 * Get all entities
 */
export const getEntities = async (config: HomeAssistantConfig): Promise<HAEntity[]> => {
  const result = await haRequest<HAEntity[]>(config, 'states');
  return result || [];
};

/**
 * Get entities by domain
 */
export const getEntitiesByDomain = async (
  config: HomeAssistantConfig,
  domain: EntityDomain
): Promise<HAEntity[]> => {
  const entities = await getEntities(config);
  return entities.filter(e => e.entity_id.startsWith(`${domain}.`));
};

/**
 * Get entity state
 */
export const getEntityState = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<HAEntity | null> => {
  return await haRequest<HAEntity>(config, `states/${entityId}`);
};

/**
 * Call a Home Assistant service
 */
export const callService = async (
  config: HomeAssistantConfig,
  domain: string,
  service: string,
  entityId?: string | string[],
  serviceData?: Record<string, any>
): Promise<boolean> => {
  const body: Record<string, any> = { ...serviceData };
  if (entityId) {
    body.entity_id = entityId;
  }

  const result = await haRequest(config, `services/${domain}/${service}`, 'POST', body);
  return result !== null;
};

// ============ Light Controls ============

/**
 * Turn on a light
 */
export const turnOnLight = async (
  config: HomeAssistantConfig,
  entityId: string,
  brightness?: number, // 0-255
  colorTemp?: number // in Kelvin
): Promise<boolean> => {
  const serviceData: Record<string, any> = {};
  if (brightness !== undefined) {
    serviceData.brightness = brightness;
  }
  if (colorTemp !== undefined) {
    serviceData.color_temp_kelvin = colorTemp;
  }
  return await callService(config, 'light', 'turn_on', entityId, serviceData);
};

/**
 * Turn off a light
 */
export const turnOffLight = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<boolean> => {
  return await callService(config, 'light', 'turn_off', entityId);
};

/**
 * Dim all lights for Shabbat
 */
export const dimAllLightsForShabbat = async (
  config: HomeAssistantConfig,
  brightness: number = 100, // 0-255
  colorTemp: number = 2700 // Warm white in Kelvin
): Promise<boolean> => {
  const lights = await getEntitiesByDomain(config, 'light');
  const onLights = lights.filter(l => l.state === 'on');

  if (onLights.length === 0) {
    // Turn on all lights and dim them
    const allLightIds = lights.map(l => l.entity_id);
    return await callService(config, 'light', 'turn_on', allLightIds, {
      brightness,
      color_temp_kelvin: colorTemp,
      transition: 60, // 60 second transition
    });
  }

  // Dim only lights that are on
  const results = await Promise.all(
    onLights.map(light =>
      turnOnLight(config, light.entity_id, brightness, colorTemp)
    )
  );

  return results.every(r => r);
};

// ============ Climate (AC) Controls ============

/**
 * Set climate mode
 */
export const setClimateMode = async (
  config: HomeAssistantConfig,
  entityId: string,
  mode: 'off' | 'heat' | 'cool' | 'auto' | 'dry' | 'fan_only'
): Promise<boolean> => {
  if (mode === 'off') {
    return await callService(config, 'climate', 'turn_off', entityId);
  }
  return await callService(config, 'climate', 'set_hvac_mode', entityId, { hvac_mode: mode });
};

/**
 * Set climate temperature
 */
export const setClimateTemperature = async (
  config: HomeAssistantConfig,
  entityId: string,
  temperature: number
): Promise<boolean> => {
  return await callService(config, 'climate', 'set_temperature', entityId, { temperature });
};

/**
 * Turn off all climate devices
 */
export const turnOffAllClimate = async (config: HomeAssistantConfig): Promise<boolean> => {
  const climates = await getEntitiesByDomain(config, 'climate');
  const results = await Promise.all(
    climates.map(c => setClimateMode(config, c.entity_id, 'off'))
  );
  return results.every(r => r);
};

// ============ Cover (Blinds/Shutters) Controls ============

/**
 * Open a cover
 */
export const openCover = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<boolean> => {
  return await callService(config, 'cover', 'open_cover', entityId);
};

/**
 * Close a cover
 */
export const closeCover = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<boolean> => {
  return await callService(config, 'cover', 'close_cover', entityId);
};

/**
 * Set cover position
 */
export const setCoverPosition = async (
  config: HomeAssistantConfig,
  entityId: string,
  position: number // 0-100
): Promise<boolean> => {
  return await callService(config, 'cover', 'set_cover_position', entityId, { position });
};

/**
 * Close all covers for Shabbat
 */
export const closeAllCovers = async (config: HomeAssistantConfig): Promise<boolean> => {
  const covers = await getEntitiesByDomain(config, 'cover');
  const results = await Promise.all(
    covers.map(c => closeCover(config, c.entity_id))
  );
  return results.every(r => r);
};

/**
 * Open all covers for Motzei Shabbat
 */
export const openAllCovers = async (config: HomeAssistantConfig): Promise<boolean> => {
  const covers = await getEntitiesByDomain(config, 'cover');
  const results = await Promise.all(
    covers.map(c => openCover(config, c.entity_id))
  );
  return results.every(r => r);
};

// ============ Switch Controls ============

/**
 * Turn on a switch
 */
export const turnOnSwitch = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<boolean> => {
  return await callService(config, 'switch', 'turn_on', entityId);
};

/**
 * Turn off a switch
 */
export const turnOffSwitch = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<boolean> => {
  return await callService(config, 'switch', 'turn_off', entityId);
};

// ============ Scene Controls ============

/**
 * Activate a scene
 */
export const activateScene = async (
  config: HomeAssistantConfig,
  entityId: string
): Promise<boolean> => {
  return await callService(config, 'scene', 'turn_on', entityId);
};

// ============ Shabbat-Specific Functions ============

/**
 * Prepare home for Shabbat
 * - Dim lights to warm ambiance
 * - Close blinds
 * - Turn off unnecessary devices
 */
export const prepareForShabbat = async (
  config: HomeAssistantConfig,
  options: {
    dimLights?: boolean;
    lightBrightness?: number;
    closeCovers?: boolean;
    turnOffClimate?: boolean;
    turnOffSwitches?: string[]; // specific switch entity_ids to turn off
  } = {}
): Promise<{ success: boolean; actions: string[] }> => {
  const {
    dimLights = true,
    lightBrightness = 100,
    closeCovers = false,
    turnOffClimate = false,
    turnOffSwitches = [],
  } = options;

  const actions: string[] = [];
  let allSuccess = true;

  if (dimLights) {
    const success = await dimAllLightsForShabbat(config, lightBrightness);
    if (success) {
      actions.push('האורות עומעמו');
    } else {
      allSuccess = false;
    }
  }

  if (closeCovers) {
    const success = await closeAllCovers(config);
    if (success) {
      actions.push('התריסים נסגרו');
    } else {
      allSuccess = false;
    }
  }

  if (turnOffClimate) {
    const success = await turnOffAllClimate(config);
    if (success) {
      actions.push('המזגנים כובו');
    } else {
      allSuccess = false;
    }
  }

  for (const switchId of turnOffSwitches) {
    const success = await turnOffSwitch(config, switchId);
    if (success) {
      actions.push(`כובה: ${switchId}`);
    } else {
      allSuccess = false;
    }
  }

  return { success: allSuccess, actions };
};

/**
 * Get summary of home state
 */
export const getHomeSummary = async (
  config: HomeAssistantConfig
): Promise<{
  lights: { total: number; on: number };
  climate: { total: number; on: number };
  covers: { total: number; open: number };
  switches: { total: number; on: number };
}> => {
  const entities = await getEntities(config);

  const lights = entities.filter(e => e.entity_id.startsWith('light.'));
  const climate = entities.filter(e => e.entity_id.startsWith('climate.'));
  const covers = entities.filter(e => e.entity_id.startsWith('cover.'));
  const switches = entities.filter(e => e.entity_id.startsWith('switch.'));

  return {
    lights: { total: lights.length, on: lights.filter(l => l.state === 'on').length },
    climate: { total: climate.length, on: climate.filter(c => c.state !== 'off').length },
    covers: { total: covers.length, open: covers.filter(c => c.state === 'open').length },
    switches: { total: switches.length, on: switches.filter(s => s.state === 'on').length },
  };
};
