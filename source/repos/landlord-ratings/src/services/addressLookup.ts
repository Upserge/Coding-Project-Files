import { getPlaceDetails } from '@/src/services/places';
import { findPropertyByPlaceId } from '@/src/services/properties';
import type { Property } from '@/src/types';

export interface ResolvedPlace {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export type AddressLookupResult =
  | { kind: 'has_reviews'; property: Property }
  | { kind: 'no_reviews'; property: Property | null; place: ResolvedPlace }
  | { kind: 'error'; message: string };

export async function lookupAddressByPlaceId(placeId: string): Promise<AddressLookupResult> {
  const details = await getPlaceDetails(placeId);
  if (!details) {
    return { kind: 'error', message: 'Could not load address details.' };
  }

  const place: ResolvedPlace = {
    placeId,
    formattedAddress: details.formattedAddress,
    latitude: details.latitude,
    longitude: details.longitude,
  };

  const property = await findPropertyByPlaceId(placeId);
  if (property && property.reviewCount > 0) {
    return { kind: 'has_reviews', property };
  }

  return { kind: 'no_reviews', property, place };
}
