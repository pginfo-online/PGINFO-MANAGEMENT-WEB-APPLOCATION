/**
 * google-maps.ts
 * Enterprise-grade Google Maps utilities for PG Management
 */

export interface ParsedAddress {
  address: string;
  city: string;
  area: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  mapsLink?: string;
  placeId?: string;
}

/**
 * Extracts city and area/locality from Google Place Details address_components
 * Following the exact logic from mobile application
 */
export function extractAddressComponents(
  components: Array<{ long_name: string; short_name: string; types: string[] }> = [],
  formattedAddress = ''
): { city: string; area: string; state: string; postalCode: string } {
  let city = '';
  let area = '';
  let state = '';
  let postalCode = '';

  for (const comp of components) {
    const types = comp.types || [];

    // City priority: locality -> administrative_area_level_2
    if (!city) {
      if (types.includes('locality')) {
        city = comp.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        city = comp.long_name;
      }
    }

    // Area priority: sublocality_level_1 -> sublocality -> neighborhood -> sublocality_level_2
    if (!area) {
      if (types.includes('sublocality_level_1')) {
        area = comp.long_name;
      } else if (types.includes('sublocality')) {
        area = comp.long_name;
      } else if (types.includes('neighborhood')) {
        area = comp.long_name;
      } else if (types.includes('sublocality_level_2')) {
        area = comp.long_name;
      }
    }

    if (!state && types.includes('administrative_area_level_1')) {
      state = comp.long_name;
    }

    if (!postalCode && types.includes('postal_code')) {
      postalCode = comp.long_name;
    }
  }

  // Handle Indian city administrative nuances (e.g. Pune vs Pimpri-Chinchwad, Bangalore Urban, Mumbai Suburban)
  const admin2 = components.find((c) => c.types?.includes('administrative_area_level_2'));
  const admin2Name = admin2?.long_name?.replace(/\s*(Division|District)$/i, '').trim();

  if (city === 'Pimpri-Chinchwad' || (admin2Name && admin2Name.toLowerCase() === 'pune')) {
    if (city === 'Hinjawadi' || city === 'Hinjewadi') {
      if (!area || area === 'Phase 1' || area === 'Phase 2' || area === 'Phase 3') {
        area = area ? `Hinjewadi ${area}` : 'Hinjewadi';
      }
    }
    city = 'Pune';
  } else if (city === 'Bengaluru' || city === 'Bengaluru Urban') {
    city = 'Bangalore';
  } else if (city === 'Mumbai Suburban') {
    city = 'Mumbai';
  }

  if (!city && admin2Name) {
    city = admin2Name;
  }

  // Fallbacks if area or city not cleanly detected
  if (!city) {
    const adminArea = components.find((c) =>
      c.types?.includes('administrative_area_level_1')
    );
    if (adminArea) city = adminArea.long_name;
  }

  if (!area && formattedAddress) {
    const parts = formattedAddress.split(',').map((p) => p.trim());
    if (parts.length > 1) {
      area = parts[0];
    }
  }

  return {
    city: city || 'Pune',
    area: area || '',
    state: state || 'Maharashtra',
    postalCode: postalCode || '',
  };
}

/**
 * Validate and sanitize Google Maps URLs
 */
export function sanitizeMapsUrl(link: string): string {
  if (!link || !link.trim()) return '';
  let str = link.trim();
  if (!/^https?:\/\//i.test(str)) {
    str = `https://${str}`;
  }
  return str;
}

export function isValidMapsUrl(link: string): boolean {
  if (!link || !link.trim()) return true;
  try {
    const sanitized = sanitizeMapsUrl(link);
    const parsed = new URL(sanitized);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.includes('.')
    );
  } catch {
    return false;
  }
}

/**
 * Clean and format 10-digit Indian mobile number
 */
export function cleanPhoneNumber(rawPhone: string | number): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

/**
 * Sleek Dark Theme JSON styling for Google Maps
 * Accents emerald points of interest and obsidian/slate surfaces
 */
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#090d16' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#132e29' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6ee7b7' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#071526' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#090d16' }],
  },
];

/**
 * Promise-based singleton loader for Google Maps JS API script
 */
let googleMapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script') as HTMLScriptElement;
    if (existingScript) {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps SDK loaded but window.google.maps is unavailable'));
      }
    };

    script.onerror = (err) => {
      reject(new Error('Failed to load Google Maps JavaScript API: ' + String(err)));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
