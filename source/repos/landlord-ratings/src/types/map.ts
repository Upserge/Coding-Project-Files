/** Map viewport — shared between native maps and web fallback (no react-native-maps import). */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
