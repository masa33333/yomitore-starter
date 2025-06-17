export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  trivia: string[];
  photoTier: 'full' | 'stock' | 'none';
}