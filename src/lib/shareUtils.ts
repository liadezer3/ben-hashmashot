// Sharing utilities for Shabbat times

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

// Check if Web Share API is supported
export function isWebShareSupported(): boolean {
  return 'share' in navigator;
}

// Share using Web Share API
export async function shareNatively(data: ShareData): Promise<boolean> {
  if (!isWebShareSupported()) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or error
    console.error('Share failed:', error);
    return false;
  }
}

// Copy to clipboard fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Format Shabbat times for sharing
export function formatShabbatTimesForShare(
  city: string,
  candleLighting: string,
  havdalah: string,
  parashat: string
): string {
  return `🕯️ זמני שבת ב${city}

📖 ${parashat}

🌅 הדלקת נרות: ${candleLighting}
🌃 הבדלה: ${havdalah}

שבת שלום! ✨`;
}

// Share via WhatsApp
export function shareViaWhatsApp(text: string): void {
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// Share via SMS
export function shareViaSMS(text: string): void {
  const encodedText = encodeURIComponent(text);
  window.open(`sms:?body=${encodedText}`, '_blank');
}

// Share via Email
export function shareViaEmail(subject: string, body: string): void {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
}

// Main share function with fallbacks
export async function shareShabbatTimes(
  city: string,
  candleLighting: string,
  havdalah: string,
  parashat: string
): Promise<{ success: boolean; method: string }> {
  const text = formatShabbatTimesForShare(city, candleLighting, havdalah, parashat);
  const title = `זמני שבת - ${parashat}`;

  // Try native share first
  if (isWebShareSupported()) {
    const success = await shareNatively({ title, text });
    if (success) {
      return { success: true, method: 'native' };
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(text);
  return { success: copied, method: 'clipboard' };
}
