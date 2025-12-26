import { NextResponse } from "next/server";
import { SEEDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";
import prisma from "@/app/lib/prisma";

interface GeoLocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

async function getGeolocation(ip: string): Promise<GeoLocation> {
  // Check database cache first
  try {
    const cached = await prisma.geoLocation.findUnique({
      where: { ip },
    });
    if (cached) {
      return {
        country: cached.country,
        city: cached.city ?? undefined,
        latitude: cached.latitude,
        longitude: cached.longitude,
      };
    }
  } catch (error) {
    // Silent fail
  }
  // Try ip-api.com first
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.country) {
        const geo = {
          country: data.country,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon
        };
        // Save to database cache
        try {
          await prisma.geoLocation.create({
            data: {
              ip,
              country: data.country,
              city: data.city || null,
              latitude: data.lat,
              longitude: data.lon,
            },
          });
        } catch (error) {
          // Ignore duplicate errors
        }
        return geo;
      }
    }
  } catch (error) {
    // Try fallback
  }
  // Fallback to ipapi.co
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.country_name) {
        const geo = {
          country: data.country_name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude
        };
        // Save to database cache
        try {
          await prisma.geoLocation.create({
            data: {
              ip,
              country: data.country_name,
              city: data.city || null,
              latitude: data.latitude,
              longitude: data.longitude,
            },
          });
        } catch (error) {
          // Ignore duplicate errors
        }
        return geo;
      }
    }
  } catch (error) {
    // Silent fail
  }
  return {};
}

// Helper to fetch pods from any seed
async function fetchPods() {
  for (const seed of SEEDS) {
    try {
      const result = await callPRPC(seed, "get-pods");
      return result.pods;
    } catch (err) {
      // Try next seed
    }
  }
  throw new Error("All pNode seeds unreachable");
}

export async function GET() {
  try {
    const pods = await fetchPods();
    const countryCount: Record<string, number> = {};
    // Fetch geolocation for each pod
    await Promise.all(
      pods.map(async (pod: any) => {
        const ip = pod.address.split(":")[0];
        const geo = await getGeolocation(ip);
        if (geo.country) {
          countryCount[geo.country] = (countryCount[geo.country] ?? 0) + 1;
        }
      })
    );
    return NextResponse.json({ countryDistribution: countryCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to fetch country distribution" }, { status: 500 });
  }
}
