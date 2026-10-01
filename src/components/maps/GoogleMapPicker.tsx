'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { env } from '@/config/env';
import {
  loadGoogleMaps,
  DARK_MAP_STYLE,
  extractAddressComponents,
  type ParsedAddress,
} from '@/lib/maps/google-maps';

interface GoogleMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  onLocationChange?: (data: ParsedAddress) => void;
  className?: string;
  height?: string;
}

export function GoogleMapPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
  className = '',
  height = '320px',
}: GoogleMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(() => {
    return {
      lat: latitude && !isNaN(Number(latitude)) ? Number(latitude) : 18.5913,
      lng: longitude && !isNaN(Number(longitude)) ? Number(longitude) : 73.7389,
    };
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Sync map center and marker when external coordinates change
  useEffect(() => {
    if (
      latitude != null &&
      longitude != null &&
      !isNaN(Number(latitude)) &&
      !isNaN(Number(longitude))
    ) {
      const newLat = Number(latitude);
      const newLng = Number(longitude);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: newLat, lng: newLng });
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition({ lat: newLat, lng: newLng });
        }
      }
    }
  }, [latitude, longitude]);

  // Reverse geocodes coordinates to address details
  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
        const data = await res.json();

        if (data.success && data.result) {
          const result = data.result;
          const formattedAddress = result.formatted_address || `${lat}, ${lng}`;
          const parsed = extractAddressComponents(result.address_components, formattedAddress);
          const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

          if (onLocationChange) {
            onLocationChange({
              address: formattedAddress,
              city: parsed.city,
              area: parsed.area,
              state: parsed.state,
              postalCode: parsed.postalCode,
              latitude: lat,
              longitude: lng,
              mapsLink,
              placeId: result.place_id,
            });
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [onLocationChange]
  );

  const addressRef = useRef(address);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const initialCoordsRef = useRef(currentCoords);

  // Initialize Google Maps instance
  useEffect(() => {
    let isMounted = true;
    const apiKey =
      env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      'AIzaSyCCWonK_9QaSv9_vhRM3bKsVJUoU2e4MRM';

    loadGoogleMaps(apiKey)
      .then((gMaps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const initialLat = initialCoordsRef.current.lat;
        const initialLng = initialCoordsRef.current.lng;

        const map = new gMaps.maps.Map(mapContainerRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 15,
          styles: DARK_MAP_STYLE as google.maps.MapTypeStyle[],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          backgroundColor: '#090d16',
        });

        // Custom emerald map pin
        const marker = new gMaps.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map,
          draggable: true,
          animation: gMaps.maps.Animation.DROP,
          title: addressRef.current || 'Property Location',
        });

        // Click on map to place pin
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          marker.setPosition({ lat, lng });
          setCurrentCoords({ lat, lng });
          handleReverseGeocode(lat, lng);
        });

        // Drag marker
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const lat = pos.lat();
          const lng = pos.lng();
          setCurrentCoords({ lat, lng });
          handleReverseGeocode(lat, lng);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load Google Maps SDK:', err);
        setLoadError(
          'Google Maps preview is currently unavailable. You can still enter or search address manually.'
        );
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleReverseGeocode]);

  // Locate user with HTML5 geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(16);
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition({ lat, lng });
          }
        }
        handleReverseGeocode(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const effectiveLat =
    latitude && !isNaN(Number(latitude)) ? Number(latitude) : currentCoords.lat;
  const effectiveLng =
    longitude && !isNaN(Number(longitude)) ? Number(longitude) : currentCoords.lng;
  const mapsUrl = `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl backdrop-blur-md ${className}`}>
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-4 py-2.5 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-white">Google Map Location</span>
          {isReverseGeocoding && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating address...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Coordinates chip */}
          <div className="hidden sm:inline-flex items-center rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] font-mono text-slate-400">
            {effectiveLat.toFixed(4)}, {effectiveLng.toFixed(4)}
          </div>

          {/* Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
            title="Pin current location"
          >
            {isLocating ? (
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            ) : (
              <Navigation className="h-3 w-3 text-emerald-400" />
            )}
            <span className="hidden sm:inline">Locate Me</span>
          </button>

          {/* External Map Link */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-400 hover:text-emerald-300 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Map Body Container */}
      <div className="relative w-full" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
            <p className="mt-2 text-xs font-medium text-slate-400">
              Loading Google Maps...
            </p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="mt-2 text-xs text-slate-300 max-w-sm">{loadError}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>Coordinates: {currentCoords.lat}, {currentCoords.lng}</span>
            </div>
          </div>
        )}

        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Map Help Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950 px-4 py-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-emerald-400" />
          <span>Tip: Click on map or drag the pin to set the exact PG building entrance</span>
        </span>
        <span className="text-[10px] text-slate-500">Powered by Google Maps</span>
      </div>
    </div>
  );
}
