import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyCCWonK_9QaSv9_vhRM3bKsVJUoU2e4MRM';

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('components', 'country:in');
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    const data = await response.json();

    if (data.status === 'OK' && Array.isArray(data.predictions)) {
      return NextResponse.json({
        success: true,
        predictions: data.predictions,
      });
    }

    return NextResponse.json({
      success: true,
      predictions: [],
      status: data.status,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch predictions';
    console.error('[Google Maps Autocomplete API Error]:', error);
    return NextResponse.json(
      { success: false, error: errorMsg, predictions: [] },
      { status: 500 }
    );
  }
}
