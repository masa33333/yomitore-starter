export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  trivia: string[];
  photoTier: 'full' | 'stock' | 'none';
}

export interface Story {
  id: string;
  title: string;
  enText: string;
  jpText?: string;
  vocabLevel: number;
  genre: string;
  mood: string;
  tone?: string;
  createdAt: string;
}