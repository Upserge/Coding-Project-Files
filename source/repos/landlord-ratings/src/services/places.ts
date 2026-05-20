import { googlePlacesApiKey } from '@/src/config/env';

const apiKey = googlePlacesApiKey ?? '';

export async function searchPlaces(input: string): Promise<
  Array<{
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
  }>
> {
  const term = input.trim();
  if (term.length < 3) return [];

  if (!apiKey) {
    return [
      {
        placeId: 'mock-chicago-1',
        description: '123 Main St, Chicago, IL',
        mainText: '123 Main St',
        secondaryText: 'Chicago, IL',
      },
      {
        placeId: 'mock-chicago-2',
        description: '456 Oak Ave, Chicago, IL',
        mainText: '456 Oak Ave',
        secondaryText: 'Chicago, IL',
      },
    ].filter((p) => p.description.toLowerCase().includes(term.toLowerCase()));
  }

  const url = new URL('https://places.googleapis.com/v1/places:autocomplete');
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify({
      input: term,
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
    }),
  });

  if (!response.ok) {
    console.warn('Places autocomplete failed', await response.text());
    return [];
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .map((p) => ({
      placeId: p!.placeId!,
      description: p!.text?.text ?? '',
      mainText: p!.structuredFormat?.mainText?.text ?? '',
      secondaryText: p!.structuredFormat?.secondaryText?.text ?? '',
    }));
}

export async function getPlaceDetails(placeId: string): Promise<{
  formattedAddress: string;
  latitude: number;
  longitude: number;
} | null> {
  if (!apiKey) {
    const mocks: Record<string, { formattedAddress: string; latitude: number; longitude: number }> =
      {
        'mock-chicago-1': {
          formattedAddress: '123 Main St, Chicago, IL 60601',
          latitude: 41.8819,
          longitude: -87.6278,
        },
        'mock-chicago-2': {
          formattedAddress: '456 Oak Ave, Chicago, IL 60602',
          latitude: 41.885,
          longitude: -87.62,
        },
      };
    return mocks[placeId] ?? mocks['mock-chicago-1'];
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'formattedAddress,location',
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
  };

  if (data.location?.latitude == null || data.location?.longitude == null) return null;

  return {
    formattedAddress: data.formattedAddress ?? '',
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  };
}
