import { NextRequest } from "next/server";

export function getClientIP(request: NextRequest): string | null {
  // Check for IP in headers (in order of preference)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Check for CF-Connecting-IP (Cloudflare)
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Check for X-Client-IP
  const clientIP = request.headers.get("x-client-ip");
  if (clientIP) {
    return clientIP;
  }

  // Check for remote address
  const remoteAddr = request.headers.get("x-remote-addr");
  if (remoteAddr) {
    return remoteAddr;
  }

  // Try to get IP from the connection (Next.js specific)
  const ip = request.ip;
  if (ip) {
    return ip;
  }

  // Return null if no IP found
  return null;
}

export async function getLocationFromIP(ip: string): Promise<string | null> {
  // Always attempt to get location for any IP
  try {
    // Using ip-api.com - free for non-commercial use, no API key required
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,message`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      },
    );

    if (!response.ok) {
      console.error(`IP geolocation API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check if the request was successful
    if (data.status === "fail") {
      console.error(`IP geolocation failed: ${data.message}`);
      return null;
    }

    // Build location string from available parts
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.regionName && data.regionName !== data.city)
      parts.push(data.regionName);
    if (data.country) parts.push(data.country);

    return parts.length > 0 ? parts.join(", ") : null;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("IP geolocation request timed out");
      } else {
        console.error("Error getting location from IP:", error.message);
      }
    } else {
      console.error("Error getting location from IP:", error);
    }
    return null;
  }
}
