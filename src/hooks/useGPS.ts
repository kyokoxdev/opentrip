import { useState, useEffect, useRef } from 'react';
import { GPSCoords } from '../types';
import { generateSimulatedRoute, getDistanceInMeters, SIMULATED_BASE_COORDS } from '../services/mockData';

export function useGPS(isSimulationActive: boolean) {
  const [currentCoords, setCurrentCoords] = useState<GPSCoords>({
    lat: SIMULATED_BASE_COORDS.lat,
    lng: SIMULATED_BASE_COORDS.lng,
    speed: 0,
    altitude: null, // null until GPS lock is acquired
    heading: 0,
    timestamp: Date.now()
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [path, setPath] = useState<GPSCoords[]>([]);
  const [distance, setDistance] = useState(0); // in km
  const [maxSpeed, setMaxSpeed] = useState(0); // in km/h
  const [duration, setDuration] = useState(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Ref tracking to avoid stale state in callbacks
  const pathRef = useRef<GPSCoords[]>([]);
  const lastCoordsRef = useRef<GPSCoords | null>(null);
  const simIndexRef = useRef<number>(0);
  const simRouteRef = useRef<GPSCoords[]>([]);
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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
    if (isRecording && !isPaused) {
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
  }, [isRecording, isPaused]);

  // 1. Simulation Tracking Effect
  useEffect(() => {
    if (!isSimulationActive) return;
    if (!isRecording || isPaused) return;

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
        setMaxSpeed(prev => Math.max(prev, nextPoint.speed));

        lastCoordsRef.current = nextPoint;
        simIndexRef.current = index + 1;
      } else {
        // Reset loop if simulation finishes
        simIndexRef.current = 0;
      }
    }, 1000); // simulation runs at 1Hz (1 GPS point per second)

    return () => clearInterval(simInterval);
  }, [isSimulationActive, isRecording, isPaused]);

  // 2. Real Geolocation Tracking Effect
  useEffect(() => {
    if (isSimulationActive) return;

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser/device.');
      return;
    }

    const handleGPSUpdate = (position: GeolocationPosition) => {
      setGpsError(null);
      const { latitude, longitude, speed: rawSpeed, altitude, heading } = position.coords;
      
      // Browser speed is in m/s (meters per second) -> convert to km/h
      let speed = rawSpeed ? rawSpeed * 3.6 : 0;
      const timestamp = position.timestamp;

      // Fallback speed calculation if API doesn't support speed directly and we are recording
      if (!rawSpeed && lastCoordsRef.current && isRecordingRef.current && !isPausedRef.current) {
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
        // Treat null or negative altitude as null — negative values indicate
        // an unreliable WGS84 ellipsoidal height reading before GPS lock
        altitude: altitude !== null && altitude >= 0 ? Math.round(altitude) : null,
        heading: heading !== null ? Math.round(heading) : null,
        timestamp
      };

      setCurrentCoords(newPoint);

      // ONLY record/accumulate stats if recording and not paused
      if (isRecordingRef.current && !isPausedRef.current) {
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

        setMaxSpeed(prev => Math.max(prev, speed));
      }

      lastCoordsRef.current = newPoint;
    };

    const handleGPSError = (error: GeolocationPositionError) => {
      console.error('GPS tracking error:', error.message);
      if (error.code === error.PERMISSION_DENIED) {
        setGpsError('GPS permission denied. Enable location in device settings.');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setGpsError('GPS signal unavailable. Ensure location is enabled and active.');
      } else if (error.code === error.TIMEOUT) {
        setGpsError('GPS connection timeout. Reconnecting...');
      } else {
        setGpsError(error.message);
      }
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
  }, [isSimulationActive]);

  const startTrip = () => {
    setIsRecording(true);
    setIsPaused(false);
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
    setIsPaused(false);
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
    setIsPaused(false);
    setPath([]);
    pathRef.current = [];
    setDistance(0);
    setMaxSpeed(0);
    setDuration(0);
    lastCoordsRef.current = null;
    simIndexRef.current = 0;
  };

  const pauseTrip = () => {
    if (isRecording) {
      setIsPaused(true);
    }
  };

  const resumeTrip = () => {
    if (isRecording) {
      setIsPaused(false);
    }
  };

  const avgSpeed = duration > 0 ? (distance / (duration / 3600)) : 0;

  return {
    currentCoords,
    isRecording,
    isPaused,
    path,
    distance,
    maxSpeed,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    duration,
    gpsError,
    startTrip,
    stopTrip,
    resetTrip,
    pauseTrip,
    resumeTrip
  };
}
