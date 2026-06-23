export interface GForce {
  x: number; // Lateral G-Force (positive = right, negative = left)
  y: number; // Longitudinal G-Force (positive = acceleration, negative = braking)
}

export interface GPSCoords {
  lat: number;
  lng: number;
  speed: number; // in km/h or m/s? We will store as km/h internally
  altitude: number | null; // meters
  heading: number | null; // degrees
  timestamp: number;
}

export interface TelemetryLog {
  timestamp: number;
  speed: number; // km/h
  gForce: GForce;
}

export interface Trip {
  id: string;
  date: string; // ISO string
  duration: number; // in seconds
  distance: number; // in km
  maxSpeed: number; // in km/h
  avgSpeed: number; // in km/h
  maxGForce: {
    lat: number; // max lateral G (absolute)
    acc: number; // max acceleration G
    brk: number; // max braking G (absolute value, positive number)
  };
  path: GPSCoords[];
  telemetryLogs: TelemetryLog[];
}

export interface CameraAlert {
  id: string;
  type: 'speed_camera' | 'redlight_camera' | 'traffic_signal' | 'stop_sign';
  lat: number;
  lng: number;
  speedLimit?: number; // in km/h
  description: string;
  distance?: number; // current calculated distance in meters
}

export interface AppSettings {
  units: 'metric' | 'imperial'; // metric: km/h, km. imperial: mph, miles.
  mapProvider: 'google' | 'osm'; // Google Maps vs OpenStreetMap
  theme: 'light' | 'dark'; // UI theme toggle
  googleMapsApiKey: string;
  soundAlerts: boolean;
  cameraRadius: number; // distance threshold in meters to trigger alerts
  gForceCalibratedOffset: { x: number; y: number }; // calibrated neutral offsets
}
