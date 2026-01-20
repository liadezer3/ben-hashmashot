import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface ShabbatTimes {
  candle_lighting_time: string;
  havdalah_time: string;
  parasha: string;
  date: string;
}

async function getShabbatTimes(city: string = "Jerusalem"): Promise<ShabbatTimes | null> {
  try {
    const cityGeoIds: Record<string, string> = {
      "Jerusalem": "281184",
      "ירושלים": "281184",
      "Tel Aviv": "293397",
      "תל אביב": "293397",
      "Haifa": "294801",
      "חיפה": "294801",
      "Beer Sheva": "295530",
      "באר שבע": "295530",
    };

    const geoId = cityGeoIds[city] || "281184";
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on`
    );

    if (!response.ok) return null;

    const data = await response.json();
    let candleLighting = "";
    let havdalah = "";
    let parasha = "";
    let date = "";

    for (const item of data.items || []) {
      if (item.category === "candles") {
        candleLighting = item.title?.replace("Candle lighting: ", "") || "";
        date = item.date?.split("T")[0] || "";
      } else if (item.category === "havdalah") {
        havdalah = item.title?.replace("Havdalah: ", "") || "";
      } else if (item.category === "parashat") {
        parasha = item.title || "";
      }
    }

    return {
      candle_lighting_time: candleLighting,
      havdalah_time: havdalah,
      parasha: parasha,
      date: date,
    };
  } catch (error) {
    console.error("Error fetching Shabbat times:", error);
    return null;
  }
}

// Convert Uint8Array to ArrayBuffer
function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

// Base64 URL encoding/decoding utilities
function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Create VAPID JWT for authorization
async function createVapidJwt(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ token: string; publicKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:notifications@benhashmashot.app'
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  // For ES256, we need a proper JWK format
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
    y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    d: base64UrlEncode(privateKeyBytes)
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format if needed
  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = base64UrlEncode(signatureBytes);

  return {
    token: `${unsignedToken}.${signatureB64}`,
    publicKey: vapidPublicKey
  };
}

// Generate encryption keys for Web Push
async function generateEncryptionKeys(): Promise<{
  localKeyPair: CryptoKeyPair;
  salt: Uint8Array;
}> {
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { localKeyPair, salt };
}

// HKDF implementation
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(ikm),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(info)
    },
    keyMaterial,
    length * 8
  );

  return new Uint8Array(bits);
}

// Create info for HKDF
function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(`Content-Encoding: ${type}\0`);
  const result = new Uint8Array(typeBytes.length + 1 + context.length);
  result.set(typeBytes);
  result[typeBytes.length] = 0; // Separator
  if (context.length > 0) {
    result.set(context, typeBytes.length + 1);
  }
  return result;
}

// Encrypt payload using aes128gcm
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  
  // Decode subscription keys
  const userPublicKeyBytes = base64UrlDecode(p256dh);
  const authSecret = base64UrlDecode(auth);
  
  // Generate local key pair and salt
  const { localKeyPair, salt } = await generateEncryptionKeys();
  
  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);
  
  // Import user's public key
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(userPublicKeyBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  // Create context for key derivation
  const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
  context[0] = 0; // Recipient type
  context[1] = 0; context[2] = 65; // Recipient public key length
  context.set(userPublicKeyBytes, 3);
  context[68] = 0; context[69] = 65; // Sender public key length
  context.set(localPublicKey, 70);
  
  // Derive IKM
  const ikm = await hkdf(authSecret, sharedSecret, new TextEncoder().encode('Content-Encoding: auth\0'), 32);
  
  // Derive content encryption key and nonce
  const cekInfo = createInfo('aes128gcm', context);
  const nonceInfo = createInfo('nonce', context);
  
  const cek = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  // Import CEK for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(cek),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Add padding
  const paddingLength = 2;
  const paddedPayload = new Uint8Array(payloadBytes.length + paddingLength);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, paddingLength);
  
  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
    aesKey,
    paddedPayload
  );
  
  return {
    encrypted: new Uint8Array(encryptedBuffer),
    salt,
    localPublicKey
  };
}

// Send Web Push notification
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    console.log(`Sending push to: ${subscription.endpoint.substring(0, 60)}...`);
    
    // Create VAPID authorization
    const vapid = await createVapidJwt(subscription.endpoint, vapidPublicKey, vapidPrivateKey);
    
    // Encrypt the payload
    const { encrypted, salt, localPublicKey } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );
    
    // Build the body with aes128gcm header
    const recordSize = 4096;
    const header = new Uint8Array(86);
    header.set(salt, 0); // Salt (16 bytes)
    header[16] = (recordSize >> 24) & 0xff;
    header[17] = (recordSize >> 16) & 0xff;
    header[18] = (recordSize >> 8) & 0xff;
    header[19] = recordSize & 0xff;
    header[20] = 65; // Key ID length
    header.set(localPublicKey, 21); // Server public key (65 bytes)
    
    const body = new Uint8Array(header.length + encrypted.length);
    body.set(header);
    body.set(encrypted, header.length);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${vapid.token}, k=${vapid.publicKey}`,
        'Content-Length': body.length.toString()
      },
      body: body
    });

    if (response.ok || response.status === 201) {
      console.log('Push notification sent successfully');
      return true;
    }
    
    const errorText = await response.text();
    console.error(`Push failed with status ${response.status}: ${errorText}`);
    
    // 410 Gone or 404 means subscription is invalid
    if (response.status === 410 || response.status === 404) {
      console.log('Subscription is invalid and should be removed');
    }
    
    return false;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured. Please add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('VAPID keys found, proceeding...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is ok for scheduled calls
    }
    
    console.log('Request body:', JSON.stringify(body));
    
    // Get user from auth header (for test notifications)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      console.log('Authenticated user:', userId);
    }

    // Test notification - send to current user only
    if (body.test && userId) {
      console.log('Sending test notification to user:', userId);
      
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscriptions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!subscriptions?.length) {
        console.log('No subscriptions found for user');
        return new Response(
          JSON.stringify({ error: 'No push subscriptions found. Please enable push notifications first.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${subscriptions.length} subscription(s)`);

      const payload = JSON.stringify({
        title: (body.title as string) || '🕯️ בין השמשות',
        body: (body.body as string) || 'התראה חדשה',
        icon: '/icon-512.png',
        badge: '/icon-512.png'
      });

      let sent = 0;
      const failedIds: string[] = [];
      
      for (const sub of subscriptions) {
        const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (success) {
          sent++;
        } else {
          failedIds.push(sub.id);
        }
      }

      // Clean up failed subscriptions
      if (failedIds.length > 0) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .in('id', failedIds);
        console.log(`Cleaned up ${failedIds.length} invalid subscriptions`);
      }

      console.log(`Test notifications sent: ${sent}/${subscriptions.length}`);
      return new Response(
        JSON.stringify({ success: sent > 0, sent, total: subscriptions.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scheduled/bulk send - send to all users with push enabled
    console.log('Starting scheduled push notification send...');
    
    // Get all users with push enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    const userIds = preferences?.map(p => p.user_id) || [];
    console.log(`Found ${userIds.length} users with push enabled`);
    
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users with push enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    // Get Shabbat times for the notification
    const shabbatTimes = await getShabbatTimes();
    
    let notificationBody = (body.body as string) || (body.message as string);
    if (!notificationBody && shabbatTimes) {
      notificationBody = `הדלקת נרות: ${shabbatTimes.candle_lighting_time} | מוצאי שבת: ${shabbatTimes.havdalah_time} | ${shabbatTimes.parasha}`;
    } else if (!notificationBody) {
      notificationBody = 'בדוק את זמני השבת באפליקציה';
    }

    const payload = JSON.stringify({
      title: (body.title as string) || '🕯️ זמני שבת',
      body: notificationBody,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      url: '/'
    });

    let sent = 0;
    const failedIds: string[] = [];
    
    for (const sub of subscriptions || []) {
      const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
      if (success) {
        sent++;
      } else {
        failedIds.push(sub.id);
      }
    }

    // Clean up invalid subscriptions
    if (failedIds.length > 0) {
      console.log(`Cleaning up ${failedIds.length} invalid subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedIds);
    }

    console.log(`Push notifications sent: ${sent}/${subscriptions?.length || 0}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent,
        total: subscriptions?.length || 0,
        cleaned: failedIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
