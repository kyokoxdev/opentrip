import { CameraAlert, GPSCoords } from '../types';

// Pre-defined path for simulation mode (e.g. driving around San Francisco or a custom scenic route)
// We will generate a base coordinate and then trace a nice winding loop or straight run.
export const SIMULATED_BASE_COORDS = {
  lat: 37.774929,
  lng: -122.419416, // San Francisco Civic Center
};

// Generates a path of coordinates for the simulation mode
export function generateSimulatedRoute(durationSeconds: number = 3600): GPSCoords[] {
  const coordsList: GPSCoords[] = [];
  const startLat = 37.774929;
  const startLng = -122.419416;
  
  // Winding path through Golden Gate Park
  for (let i = 0; i < durationSeconds; i++) {
    // T is time in seconds
    const t = i;
    // Speed varies between 30 km/h and 95 km/h
    const speed = 45 + Math.sin(t / 50) * 15 + Math.cos(t / 15) * 5 + (t % 300 > 250 ? -25 : 10); // slow down periodically
    
    // Calculate new position
    // Earth's radius is ~6371km, 1 deg lat = 111km, 1 deg lng = 111 * cos(lat)
    const latOffset = (Math.sin(t / 100) * 0.005) + (t * 0.000008);
    const lngOffset = (Math.cos(t / 200) * 0.008) - (t * 0.00001);
    
    const lat = startLat + latOffset;
    const lng = startLng + lngOffset;
    
    coordsList.push({
      lat,
      lng,
      speed: Math.max(0, speed),
      altitude: 40 + Math.sin(t / 80) * 10,
      heading: (t * 3.5) % 360,
      timestamp: Date.now() + (t * 1000)
    });
  }
  
  return coordsList;
}

// Generate static camera alerts around a focal point
export function getMockCamerasAround(lat: number, lng: number): CameraAlert[] {
  // Generate 4-5 cameras in a grid relative to the current position
  return [
    {
      id: 'cam-1',
      type: 'speed_camera',
      lat: lat + 0.0015,
      lng: lng + 0.0012,
      speedLimit: 60,
      description: 'Fixed Speed Camera (60 km/h)'
    },
    {
      id: 'cam-2',
      type: 'redlight_camera',
      lat: lat - 0.0018,
      lng: lng - 0.0015,
      description: 'Red Light & Speed Camera'
    },
    {
      id: 'cam-3',
      type: 'traffic_signal',
      lat: lat + 0.003,
      lng: lng - 0.002,
      description: 'Smart Traffic Intersection'
    },
    {
      id: 'cam-4',
      type: 'stop_sign',
      lat: lat - 0.0025,
      lng: lng + 0.0025,
      description: 'Blind Stop Junction'
    },
    {
      id: 'cam-5',
      type: 'speed_camera',
      lat: lat + 0.004,
      lng: lng + 0.004,
      speedLimit: 80,
      description: 'Mobile Speed Trap Spot'
    }
  ];
}

// Haversine formula to compute distance in meters between two points
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}
