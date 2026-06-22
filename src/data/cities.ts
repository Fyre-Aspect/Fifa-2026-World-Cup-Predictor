import type { HostCity } from '@/types/domain';

/**
 * The 16 official host cities for FIFA World Cup 2026, with stadium and
 * approximate venue coordinates (degrees) for globe pin placement.
 */
export const HOST_CITIES: HostCity[] = [
  { id: 'van', name: 'Vancouver', country: 'CAN', lat: 49.2768, lon: -123.1119, venue: 'BC Place' },
  { id: 'sea', name: 'Seattle', country: 'USA', lat: 47.5952, lon: -122.3316, venue: 'Lumen Field' },
  { id: 'sfo', name: 'San Francisco Bay', country: 'USA', lat: 37.403, lon: -121.9698, venue: "Levi's Stadium" },
  { id: 'lax', name: 'Los Angeles', country: 'USA', lat: 33.9535, lon: -118.3392, venue: 'SoFi Stadium' },
  { id: 'gdl', name: 'Guadalajara', country: 'MEX', lat: 20.6819, lon: -103.4626, venue: 'Estadio Akron' },
  { id: 'mex', name: 'Mexico City', country: 'MEX', lat: 19.3029, lon: -99.1505, venue: 'Estadio Azteca' },
  { id: 'mty', name: 'Monterrey', country: 'MEX', lat: 25.6692, lon: -100.2444, venue: 'Estadio BBVA' },
  { id: 'hou', name: 'Houston', country: 'USA', lat: 29.6847, lon: -95.4107, venue: 'NRG Stadium' },
  { id: 'dal', name: 'Dallas', country: 'USA', lat: 32.7473, lon: -97.0945, venue: 'AT&T Stadium' },
  { id: 'kan', name: 'Kansas City', country: 'USA', lat: 39.0489, lon: -94.4839, venue: 'Arrowhead Stadium' },
  { id: 'atl', name: 'Atlanta', country: 'USA', lat: 33.7554, lon: -84.4008, venue: 'Mercedes-Benz Stadium' },
  { id: 'mia', name: 'Miami', country: 'USA', lat: 25.958, lon: -80.2389, venue: 'Hard Rock Stadium' },
  { id: 'tor', name: 'Toronto', country: 'CAN', lat: 43.6332, lon: -79.4185, venue: 'BMO Field' },
  { id: 'bos', name: 'Boston', country: 'USA', lat: 42.0909, lon: -71.2643, venue: 'Gillette Stadium' },
  { id: 'phi', name: 'Philadelphia', country: 'USA', lat: 39.9008, lon: -75.1675, venue: 'Lincoln Financial Field' },
  { id: 'nyc', name: 'New York / New Jersey', country: 'USA', lat: 40.8135, lon: -74.0745, venue: 'MetLife Stadium' },
];
