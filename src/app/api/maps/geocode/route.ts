import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { success: false, error: 'lat and lng parameters are required' },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyCCWonK_9QaSv9_vhRM3bKsVJUoU2e4MRM';

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    const data = await response.json();

    if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
      return NextResponse.json({
        success: true,
        results: data.results,
        result: data.results[0],
      });
    }

    return NextResponse.json({
      success: true,
      results: [],
      status: data.status,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to reverse geocode';
    console.error('[Google Maps Geocode API Error]:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
