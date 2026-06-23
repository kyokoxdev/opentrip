import { useState, useEffect, useRef } from 'react';
import { CameraAlert, GPSCoords, AppSettings } from '../types';
import { getMockCamerasAround, getDistanceInMeters } from '../services/mockData';

// Custom Web Audio API synthesizer for warning sounds (no file assets needed)
function synthWarningSound(type: 'warning' | 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'warning') {
      // High-pitched warning beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      // Double beep for critical alert
      const playBeep = (delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(660, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.1);
      };
      playBeep(0);
      playBeep(0.15);
    }
  } catch (error) {
    console.warn('Web Audio API was blocked or failed to initialize:', error);
  }
}

export function useCameraAlerts(
  currentCoords: GPSCoords,
  isRecording: boolean,
  settings: AppSettings
) {
  const [activeAlerts, setActiveAlerts] = useState<CameraAlert[]>([]);
  const [closestAlert, setClosestAlert] = useState<CameraAlert | null>(null);
  
  const camerasRef = useRef<CameraAlert[]>([]);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const playCooldownRef = useRef<{ [key: string]: number }>({});

  // Reload local mock speed cameras/signals whenever coordinate shifts significantly
  useEffect(() => {
    if (!isRecording) {
      setActiveAlerts([]);
      setClosestAlert(null);
      return;
    }

    const { lat, lng } = currentCoords;
    
    // Load cameras on start or if we moved far away (more than 1km)
    let shouldReload = false;
    if (!lastCoordsRef.current) {
      shouldReload = true;
    } else {
      const distMoved = getDistanceInMeters(
        lastCoordsRef.current.lat,
        lastCoordsRef.current.lng,
        lat,
        lng
      );
      if (distMoved > 1000) {
        shouldReload = true;
      }
    }

    if (shouldReload) {
      camerasRef.current = getMockCamerasAround(lat, lng);
      lastCoordsRef.current = { lat, lng };
    }

    // Calculate distance to all speed cameras
    const updatedAlerts = camerasRef.current
      .map(cam => {
        const distance = getDistanceInMeters(lat, lng, cam.lat, cam.lng);
        return { ...cam, distance: Math.round(distance) };
      })
      .filter(cam => cam.distance !== undefined && cam.distance <= settings.cameraRadius)
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

    setActiveAlerts(updatedAlerts);

    if (updatedAlerts.length > 0) {
      const closest = updatedAlerts[0];
      setClosestAlert(closest);

      // Proximity warning trigger
      const now = Date.now();
      const lastPlayed = playCooldownRef.current[closest.id] || 0;
      const cooldown = 15000; // Play sounds at most every 15s per alert

      if (now - lastPlayed > cooldown && settings.soundAlerts) {
        // Trigger sound warning
        if (closest.distance !== undefined) {
          if (closest.distance < 150) {
            synthWarningSound('alert'); // critical proximity
          } else {
            synthWarningSound('warning'); // caution proximity
          }
          playCooldownRef.current[closest.id] = now;
        }
      }
    } else {
      setClosestAlert(null);
    }
  }, [currentCoords, isRecording, settings.cameraRadius, settings.soundAlerts]);

  return { activeAlerts, closestAlert };
}
