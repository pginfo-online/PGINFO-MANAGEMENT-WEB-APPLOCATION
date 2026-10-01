'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, Edit3, CheckCircle2 } from 'lucide-react';
import { extractAddressComponents, sanitizeMapsUrl, type ParsedAddress } from '@/lib/maps/google-maps';

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

interface GoogleAddressAutocompleteProps {
  value?: string;
  onSelectAddress: (data: ParsedAddress) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function GoogleAddressAutocomplete({
  value = '',
  onSelectAddress,
  label = 'Search Address (Google Maps) *',
  placeholder = 'Type building, landmark, street, or locality...',
  error,
  className = '',
  disabled = false,
}: GoogleAddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(Boolean(value));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
    if (value) setIsConfirmed(true);
  }

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(text.trim())}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
        setIsOpen(data.predictions.length > 0);
      } else {
        setPredictions([]);
      }
    } catch (err) {
      console.warn('Google Places Autocomplete error:', err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setIsConfirmed(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isManualEdit) {
      debounceTimerRef.current = setTimeout(() => {
        searchPlaces(text);
      }, 250);
    } else {
      // In manual mode, simply trigger update to parent
      onSelectAddress({
        address: text,
        city: '',
        area: '',
      });
    }
  };

  const handleSelectPrediction = async (prediction: Prediction) => {
    setLoading(true);
    setIsOpen(false);

    const fullDescription = prediction.description;
    setInputValue(fullDescription);

    try {
      const res = await fetch(`/api/maps/details?place_id=${encodeURIComponent(prediction.place_id)}`);
      const data = await res.json();

      let formattedAddress = fullDescription;
      let city = 'Pune';
      let area = prediction.structured_formatting?.main_text || '';
      let state = 'Maharashtra';
      let postalCode = '';
      let mapsLink = '';
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (data.success && data.result) {
        const result = data.result;
        formattedAddress = result.formatted_address || fullDescription;
        mapsLink = result.url || '';

        if (result.geometry?.location) {
          latitude = Number(result.geometry.location.lat);
          longitude = Number(result.geometry.location.lng);
          if (!mapsLink) {
            mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
          }
        }

        const parsed = extractAddressComponents(result.address_components, formattedAddress);
        city = parsed.city;
        area = parsed.area || area;
        state = parsed.state;
        postalCode = parsed.postalCode;
      }

      setInputValue(formattedAddress);
      setIsConfirmed(true);

      onSelectAddress({
        address: formattedAddress,
        city,
        area,
        state,
        postalCode,
        latitude,
        longitude,
        mapsLink: sanitizeMapsUrl(mapsLink),
        placeId: prediction.place_id,
      });
    } catch (err) {
      console.warn('Google Place Details error:', err);
      setIsConfirmed(true);
      onSelectAddress({
        address: fullDescription,
        city: 'Pune',
        area: prediction.structured_formatting?.main_text || '',
        placeId: prediction.place_id,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setPredictions([]);
    setIsOpen(false);
    setIsConfirmed(false);
    onSelectAddress({
      address: '',
      city: '',
      area: '',
      latitude: undefined,
      longitude: undefined,
      mapsLink: '',
      placeId: '',
    });
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Label and Mode Toggle */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setIsManualEdit(!isManualEdit);
            setIsOpen(false);
          }}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
        >
          <Edit3 className="h-3 w-3" />
          <span>{isManualEdit ? 'Use Map Autocomplete' : 'Manual Edit'}</span>
        </button>
      </div>

      {/* Input container */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          ) : isConfirmed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
          )}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isManualEdit && predictions.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder={
            isManualEdit
              ? 'Type full address (Building, Street, Area, City)...'
              : placeholder
          }
          className={`w-full rounded-xl border bg-slate-900/90 py-2.5 pl-9 pr-9 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
          }`}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}

      {/* Predictions Dropdown Menu */}
      {isOpen && predictions.length > 0 && !isManualEdit && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            Google Maps Suggestions
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {predictions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectPrediction(item)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-800/80 focus:bg-slate-800 focus:outline-none group"
              >
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300 truncate">
                    {item.structured_formatting?.main_text || item.description}
                  </div>
                  {item.structured_formatting?.secondary_text && (
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
