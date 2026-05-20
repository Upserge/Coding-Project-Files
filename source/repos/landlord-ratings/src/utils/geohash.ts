import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

export function encodeGeohash(latitude: number, longitude: number): string {
  return geohashForLocation([latitude, longitude]);
}

export function getGeohashQueryBounds(
  center: [number, number],
  radiusKm: number,
): [string, string][] {
  const radiusM = radiusKm * 1000;
  return geohashQueryBounds(center, radiusM);
}

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  return distanceBetween([a.latitude, a.longitude], [b.latitude, b.longitude]);
}

export function pinColorForRating(avg: number): string {
  if (avg >= 4) return '#16a34a';
  if (avg >= 3) return '#ca8a04';
  if (avg > 0) return '#dc2626';
  return '#6b7280';
}
