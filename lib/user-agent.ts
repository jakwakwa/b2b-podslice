export type ParsedUserAgent = {
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown"
  browserName: string | null
  osName: string | null
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  if (!userAgent) {
    return { deviceType: "unknown", browserName: null, osName: null }
  }

  const ua = userAgent

  // Device type
  const deviceType = /bot|crawler|spider|slurp|bingpreview/i.test(ua)
    ? "bot"
    : /ipad|tablet/i.test(ua)
    ? "tablet"
    : /mobi|android/i.test(ua)
    ? "mobile"
    : "desktop"

  // Browser
  let browserName: string | null = null
  if (/edg\//i.test(ua)) browserName = "Edge"
  else if (/opr\//i.test(ua)) browserName = "Opera"
  else if (/chrome\//i.test(ua)) browserName = "Chrome"
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browserName = "Safari"
  else if (/firefox\//i.test(ua)) browserName = "Firefox"
  else if (/msie|trident/i.test(ua)) browserName = "IE"

  // OS
  let osName: string | null = null
  if (/windows nt/i.test(ua)) osName = "Windows"
  else if (/mac os x/i.test(ua)) osName = "macOS"
  else if (/android/i.test(ua)) osName = "Android"
  else if (/(iphone|ipad|ipod)/i.test(ua)) osName = "iOS"
  else if (/linux/i.test(ua)) osName = "Linux"

  return { deviceType, browserName, osName }
}

