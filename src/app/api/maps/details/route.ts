import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json(
      { success: false, error: 'place_id is required' },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyCCWonK_9QaSv9_vhRM3bKsVJUoU2e4MRM';

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set(
      'fields',
      'name,formatted_address,address_components,geometry,url,plus_code'
    );
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return NextResponse.json({
        success: true,
        result: data.result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        status: data.status,
        error: data.error_message || 'Place not found',
      },
      { status: 404 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch place details';
    console.error('[Google Maps Details API Error]:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
