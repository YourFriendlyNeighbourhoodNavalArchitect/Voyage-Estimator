export type Coordinates = [longitude: number, latitude: number];

export interface Position {
  latitude: number;
  longitude: number;
}

const NAUTICAL_MILES_PER_DEGREE = 60;

export function greatCircle(from: Position, to: Position): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const haversine =
    Math.sin(radians(to.latitude - from.latitude) / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(radians(to.longitude - from.longitude) / 2) ** 2;
  return ((2 * Math.asin(Math.sqrt(haversine)) * 180) / Math.PI) * NAUTICAL_MILES_PER_DEGREE;
}

export function insidePolygon([longitude, latitude]: Coordinates, polygon: readonly Coordinates[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [cornerLongitude, cornerLatitude] = polygon[index];
    const [previousLongitude, previousLatitude] = polygon[previous];
    const straddles = cornerLatitude > latitude !== previousLatitude > latitude;
    if (straddles && longitude < cornerLongitude + ((latitude - cornerLatitude) * (previousLongitude - cornerLongitude)) / (previousLatitude - cornerLatitude)) {
      inside = !inside;
    }
  }
  return inside;
}
