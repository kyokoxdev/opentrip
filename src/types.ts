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
  altitude: number | null; // meters
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
  vehicleId?: string; // Links this trip to the driven vehicle
  driverName?: string; // Links this trip to a specific driver profile
}

export interface CameraAlert {
  id: string;
  type: 'speed_camera' | 'redlight_camera' | 'traffic_signal' | 'stop_sign' | 'speed_bump';
  lat: number;
  lng: number;
  speedLimit?: number; // in km/h
  description: string;
  distance?: number; // current calculated distance in meters
}

export interface Vehicle {
  id: string;
  name: string; // e.g. "My Model 3"
  type: 'car' | 'motorcycle' | 'bicycle' | 'e-scooter' | 'other';
  specificVehicle: string; // e.g. SUV, Cruiser, Mountain Bike, Kick Scooter
  manufacturer: string;
  modelYear: string;
  fuelType: 'electric' | 'gasoline' | 'diesel' | 'hybrid' | 'human' | 'other';
  imageUrl: string;
  licensePlate: string;
  purchaseDate?: string;
  manufactureDate?: string;
  engineDisplacement?: string;
  notes?: string;
  images?: string[];
}

export interface VehicleDetail {
  name: string; // e.g. "My Model 3"
  manufacturer: string; // e.g. "Tesla"
  modelYear: string; // e.g. "2023"
  fuelType: 'electric' | 'gasoline' | 'diesel' | 'hybrid' | 'human' | 'other';
  imageUrl: string; // Base64 image (primary)
  licensePlate: string; // e.g. "XYZ-1234"
  purchaseDate?: string; // YYYY-MM-DD
  manufactureDate?: string; // YYYY-MM-DD
  engineDisplacement?: string; // e.g. "2.0L", "300 kW", "250cc"
  notes?: string; // Extra notes/specifications
  images?: string[]; // Multiple base64 images/gallery
}

export interface UserProfile {
  name: string;
  avatarUrl: string; // Base64 data URL
  createdAt: string; // ISO String
  vehicles: Vehicle[]; // List of garage vehicles
  activeVehicleId: string; // Active vehicle ID
  
  // Legacy fields for compilation safety/automatic migration
  vehicleType?: 'car' | 'motorcycle' | 'bicycle' | 'e-scooter' | 'other';
  specificVehicle?: string;
  vehicleDetail?: VehicleDetail;
}

export interface AppSettings {
  units: 'metric' | 'imperial'; // metric: km/h, km. imperial: mph, miles.
  mapProvider: 'google' | 'osm'; // Google Maps vs OpenStreetMap
  theme: 'auto' | 'light' | 'dark'; // UI theme: auto follows system prefers-color-scheme
  googleMapsApiKey: string;
  soundAlerts: boolean;
  cameraRadius: number; // distance threshold in meters to trigger alerts
  gForceCalibratedOffset: { x: number; y: number }; // calibrated neutral offsets
  userProfile: UserProfile | null;
  showGForceMeter?: boolean; // Toggle visibility of G-force meter
  hudPosition?: 'top' | 'bottom'; // HUD placement preference
  speedometerStyle?: 'dial' | 'digital'; // Speedometer design style
  showCompass?: boolean; // Show compass heading letters
  showMaxAvgSpeed?: boolean; // Show max and avg speed metrics
  gaugeColor?: string; // Custom gauge accent color
  gaugesOrder?: 'speed-first' | 'gforce-first'; // Display order of speedometer vs G-Force
  gaugeSize?: 'standard' | 'large'; // Scale of numeric characters
}
