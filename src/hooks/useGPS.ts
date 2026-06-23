import { useState, useEffect, useRef } from 'react';
import { GPSCoords } from '../types';
import { generateSimulatedRoute, getDistanceInMeters, SIMULATED_BASE_COORDS } from '../services/mockData';

export function useGPS(isSimulationActive: boolean) {
  const [currentCoords, setCurrentCoords] = useState<GPSCoords>({
    lat: SIMULATED_BASE_COORDS.lat,
    lng: SIMULATED_BASE_COORDS.lng,
    speed: 0,
    altitude: 0,
    heading: 0,
    timestamp: Date.now()
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [path, setPath] = useState<GPSCoords[]>([]);
  const [distance, setDistance] = useState(0); // in km
  const [maxSpeed, setMaxSpeed] = useState(0); // in km/h
  const [duration, setDuration] = useState(0); // in seconds
  
  // Ref tracking to avoid stale state in callbacks
  const pathRef = useRef<GPSCoords[]>([]);
  const lastCoordsRef = useRef<GPSCoords | null>(null);
  const simIndexRef = useRef<number>(0);
  const simRouteRef = useRef<GPSCoords[]>([]);
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize simulation path if simulation is active
  useEffect(() => {
    if (isSimulationActive) {
      simRouteRef.current = generateSimulatedRoute(7200); // 2 hours of data
      simIndexRef.current = 0;
    } else {
      simRouteRef.current = [];
    }
  }, [isSimulationActive]);

  // Duration Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Main Tracking Effect
  useEffect(() => {
    if (isSimulationActive) {
      // Simulation Loop
      if (!isRecording) return;

      const simInterval = setInterval(() => {
        const route = simRouteRef.current;
        const index = simIndexRef.current;

        if (index < route.length) {
          const nextPoint = route[index];
          
          // Update Coordinates
          setCurrentCoords(nextPoint);
          
          // Track distance & path
          if (lastCoordsRef.current) {
            const stepDistMeters = getDistanceInMeters(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lng,
              nextPoint.lat,
              nextPoint.lng
            );
            const stepDistKm = stepDistMeters / 1000;
            setDistance(prev => prev + stepDistKm);
          }

          setPath(prev => {
            const nextPath = [...prev, nextPoint];
            pathRef.current = nextPath;
            return nextPath;
          });

          // Max Speed
          if (nextPoint.speed > maxSpeed) {
            setMaxSpeed(nextPoint.speed);
          }

          lastCoordsRef.current = nextPoint;
          simIndexRef.current = index + 1;
        } else {
          // Reset loop if simulation finishes
          simIndexRef.current = 0;
        }
      }, 1000); // simulation runs at 1Hz (1 GPS point per second)

      return () => clearInterval(simInterval);
    } else {
      // Real Geolocation
      if (!isRecording) return;

      const handleGPSUpdate = (position: GeolocationPosition) => {
        const { latitude, longitude, speed: rawSpeed, altitude, heading } = position.coords;
        
        // Browser speed is in m/s (meters per second)
        // Convert to km/h
        let speed = rawSpeed ? rawSpeed * 3.6 : 0;
        
        const timestamp = position.timestamp;

        // Fallback speed calculation if API doesn't support speed directly
        if (!rawSpeed && lastCoordsRef.current) {
          const mDist = getDistanceInMeters(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lng,
            latitude,
            longitude
          );
          const dtSeconds = (timestamp - lastCoordsRef.current.timestamp) / 1000;
          if (dtSeconds > 0) {
            speed = (mDist / dtSeconds) * 3.6; // convert m/s to km/h
          }
        }

        const newPoint: GPSCoords = {
          lat: latitude,
          lng: longitude,
          speed: Math.round(speed * 10) / 10,
          altitude: altitude !== null ? Math.round(altitude) : null,
          heading: heading !== null ? Math.round(heading) : null,
          timestamp
        };

        setCurrentCoords(newPoint);

        // Update stats
        if (lastCoordsRef.current) {
          const stepDistMeters = getDistanceInMeters(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lng,
            latitude,
            longitude
          );
          // Filter GPS jitter: ignore steps less than 2 meters
          if (stepDistMeters > 2) {
            const stepDistKm = stepDistMeters / 1000;
            setDistance(prev => prev + stepDistKm);
          }
        }

        setPath(prev => {
          const nextPath = [...prev, newPoint];
          pathRef.current = nextPath;
          return nextPath;
        });

        if (speed > maxSpeed) {
          setMaxSpeed(speed);
        }

        lastCoordsRef.current = newPoint;
      };

      const handleGPSError = (error: GeolocationPositionError) => {
        console.error('GPS tracking error:', error.message);
      };

      // Watch Position
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleGPSUpdate,
        handleGPSError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }
  }, [isRecording, isSimulationActive, maxSpeed]);

  const startTrip = () => {
    setIsRecording(true);
    setPath([]);
    pathRef.current = [];
    setDistance(0);
    setMaxSpeed(0);
    setDuration(0);
    lastCoordsRef.current = null;
    if (isSimulationActive) {
      simIndexRef.current = 0;
    }
  };

  const stopTrip = (): { path: GPSCoords[]; distance: number; maxSpeed: number; duration: number } => {
    setIsRecording(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    return {
      path: pathRef.current,
      distance,
      maxSpeed,
      duration
    };
  };

  const resetTrip = () => {
    setIsRecording(false);
    setPath([]);
    pathRef.current = [];
    setDistance(0);
    setMaxSpeed(0);
    setDuration(0);
    lastCoordsRef.current = null;
    simIndexRef.current = 0;
  };

  const avgSpeed = duration > 0 ? (distance / (duration / 3600)) : 0;

  return {
    currentCoords,
    isRecording,
    path,
    distance,
    maxSpeed,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    duration,
    startTrip,
    stopTrip,
    resetTrip
  };
}
