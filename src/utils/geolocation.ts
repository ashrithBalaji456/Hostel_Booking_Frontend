export interface ReverseGeocodedAddress {
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

/**
 * Reverse-geocodes latitude/longitude into street address, locality, city,
 * state, and pincode using OpenStreetMap Nominatim.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodedAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&addressdetails=1&accept-language=en`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    const addr = data.address ?? {};
    const streetParts = [addr.house_number, addr.building, addr.road, addr.residential].filter(Boolean);
    const locality =
      addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.town || addr.village || '';
    const city = addr.city || addr.town || addr.state_district || addr.county || '';
    const state = addr.state || '';
    const rawPostcode = addr.postcode || '';
    const pincode = rawPostcode.replace(/\s+/g, '');

    return {
      address: streetParts.length > 0 ? streetParts.join(', ') : (data.display_name?.split(',').slice(0, 2).join(', ').trim() ?? ''),
      locality,
      city,
      state,
      pincode,
    };
  } catch {
    return null;
  }
}

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  source: 'gps' | 'network' | 'ip';
  city?: string;
}

function getPositionPromise(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function fetchIpLocation(): Promise<ResolvedLocation | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = (await res.json()) as {
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
      };
      if (data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: null,
          source: 'ip',
          city: data.city,
        };
      }
    }
  } catch {
    // Fall through to secondary IP provider
  }

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = (await res.json()) as {
        latitude?: number;
        longitude?: number;
        city?: string;
      };
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: null,
          source: 'ip',
          city: data.city,
        };
      }
    }
  } catch {
    // Ignore network fallback failure
  }

  return null;
}

/**
 * Resolves the user's current coordinates using browser geolocation first
 * (with a low-accuracy network fallback for desktop browsers) and IP
 * geolocation as a final fallback when device location services are unavailable.
 */
export async function resolveCurrentLocation(preferHighAccuracy = false): Promise<ResolvedLocation> {
  if ('geolocation' in navigator) {
    try {
      const pos = await getPositionPromise(
        preferHighAccuracy
          ? { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
          : { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      );
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null,
        source: preferHighAccuracy ? 'gps' : 'network',
      };
    } catch (err) {
      const geoErr = err as GeolocationPositionError | undefined;
      if (geoErr?.code === 1) {
        throw new Error('PERMISSION_DENIED');
      }
      if (preferHighAccuracy) {
        try {
          const lowAccPos = await getPositionPromise({
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000,
          });
          return {
            latitude: lowAccPos.coords.latitude,
            longitude: lowAccPos.coords.longitude,
            accuracyMeters: lowAccPos.coords.accuracy ? Math.round(lowAccPos.coords.accuracy) : null,
            source: 'network',
          };
        } catch (retryErr) {
          const retryGeoErr = retryErr as GeolocationPositionError | undefined;
          if (retryGeoErr?.code === 1) {
            throw new Error('PERMISSION_DENIED');
          }
        }
      }
    }
  }

  const ipLoc = await fetchIpLocation();
  if (ipLoc) {
    return ipLoc;
  }

  throw new Error('UNAVAILABLE');
}
