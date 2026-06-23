import { useState, useEffect, useRef } from 'react';
import { GForce } from '../types';

export function useDeviceMotion(
  isSimulationActive: boolean,
  simSpeed: number,      // km/h
  simHeading: number     // degrees
) {
  const [gForce, setGForce] = useState<GForce>({ x: 0, y: 0 });
  const [calibratedOffset, setCalibratedOffset] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 9.8 });
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // For smoothing G-forces (low-pass filter)
  const gForceRef = useRef<GForce>({ x: 0, y: 0 });
  const lastSimSpeedRef = useRef<number>(0);
  const lastSimHeadingRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());

  // Calibrate current readings as neutral (tare)
  const calibrate = () => {
    // In real mode, we will tare based on actual readings.
    // For now, reset offset to standard gravity
    setCalibratedOffset({ x: 0, y: 0, z: 9.8 });
    setGForce({ x: 0, y: 0 });
    gForceRef.current = { x: 0, y: 0 };
  };

  // Request permissions for DeviceMotion (needed for iOS)
  const requestPermission = async (): Promise<boolean> => {
    if (
      typeof window !== 'undefined' &&
      'DeviceMotionEvent' in window &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        const granted = response === 'granted';
        setPermissionGranted(granted);
        return granted;
      } catch (error) {
        console.error('Error requesting motion permission:', error);
        setPermissionGranted(false);
        return false;
      }
    } else {
      // Permission not required or not supported
      setPermissionGranted(true);
      return true;
    }
  };

  useEffect(() => {
    if (isSimulationActive) {
      // Simulation mode G-Force generation
      const interval = setInterval(() => {
        const now = Date.now();
        const dt = (now - lastTimeRef.current) / 1000; // seconds
        lastTimeRef.current = now;

        if (dt <= 0) return;

        // 1. Longitudinal G-Force: based on acceleration/deceleration
        const speedDiffMps = ((simSpeed - lastSimSpeedRef.current) / 3.6); // km/h to m/s
        const accelMps2 = speedDiffMps / dt;
        let longitudinalG = accelMps2 / 9.8; // Convert to Gs

        // 2. Lateral G-Force: based on cornering (rate of heading change)
        let headingDiff = simHeading - lastSimHeadingRef.current;
        if (headingDiff > 180) headingDiff -= 360;
        if (headingDiff < -180) headingDiff += 360;
        const turnRateDps = headingDiff / dt; // degrees per second
        
        // Lateral G is roughly proportional to turn rate * speed
        const speedMps = simSpeed / 3.6;
        const angularVelocityRps = (turnRateDps * Math.PI) / 180;
        let lateralG = (speedMps * angularVelocityRps) / 9.8;

        // Apply limits and scaling for realistic simulation experience
        longitudinalG = Math.max(-1.2, Math.min(0.8, longitudinalG));
        lateralG = Math.max(-1.0, Math.min(1.0, lateralG));

        // Add small vibration/jitter to G-force bubble to feel alive (car engine vibrations)
        const jitterX = (Math.random() - 0.5) * 0.03;
        const jitterY = (Math.random() - 0.5) * 0.03;

        // Smooth with low pass filter (90% last G, 10% new G)
        const smoothedX = gForceRef.current.x * 0.9 + (lateralG + jitterX) * 0.1;
        const smoothedY = gForceRef.current.y * 0.9 + (longitudinalG + jitterY) * 0.1;

        const nextG = { x: smoothedX, y: smoothedY };
        gForceRef.current = nextG;
        setGForce({ ...nextG });

        lastSimSpeedRef.current = simSpeed;
        lastSimHeadingRef.current = simHeading;
      }, 100);

      return () => clearInterval(interval);
    } else {
      // Real Device Motion tracking
      const handleMotion = (event: DeviceMotionEvent) => {
        const accel = event.accelerationIncludingGravity;
        if (!accel) return;

        const rawX = accel.x ?? 0;
        const rawY = accel.y ?? 0;
        const rawZ = accel.z ?? 0;

        // Standard device G calculations
        // Subtract calibration offsets
        const relativeX = rawX - calibratedOffset.x;
        const relativeY = rawY - calibratedOffset.y;
        
        // Simple conversion to G-forces (m/s2 to G)
        let targetX = relativeX / 9.8;
        let targetY = relativeY / 9.8;

        // Smooth output to eliminate micro vibrations
        const filterFactor = 0.15; // responsive yet smooth
        const smoothedX = gForceRef.current.x * (1 - filterFactor) + targetX * filterFactor;
        const smoothedY = gForceRef.current.y * (1 - filterFactor) + targetY * filterFactor;

        // Store
        const nextG = { x: smoothedX, y: -smoothedY }; // negate Y so accelerating moves bubble UP/DOWN correctly
        gForceRef.current = nextG;
        setGForce(nextG);
      };

      window.addEventListener('devicemotion', handleMotion);
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, [isSimulationActive, simSpeed, simHeading, calibratedOffset]);

  return { gForce, calibrate, permissionGranted, requestPermission };
}
