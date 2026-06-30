import { useState, useEffect, useRef } from 'react';
import { CameraAlert, GPSCoords, AppSettings } from '../types';
import { getDistanceInMeters } from '../services/mockData';
import { fetchOSMAlerts } from '../services/osm';

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
  const [cameras, setCameras] = useState<CameraAlert[]>([]);
  
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const playedAlertsRef = useRef<{ [key: string]: { warning?: boolean; alert?: boolean } }>({});

  // Reload speed cameras/signals whenever coordinate shifts significantly
  useEffect(() => {
    if (!isRecording) {
      setCameras([]);
      lastCoordsRef.current = null;
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
      lastCoordsRef.current = { lat, lng };
      
      fetchOSMAlerts(lat, lng, settings.cameraRadius * 3)
        .then(alerts => {
          setCameras(alerts || []);
        })
        .catch(err => {
          console.error('OSM Overpass query failed:', err);
          setCameras([]);
        });
    }
  }, [currentCoords.lat, currentCoords.lng, isRecording, settings.cameraRadius]);

  // Filter, sort, and display warnings based on current coordinates
  useEffect(() => {
    if (!isRecording || cameras.length === 0) {
      setActiveAlerts([]);
      setClosestAlert(null);
      playedAlertsRef.current = {};
      return;
    }

    const { lat, lng } = currentCoords;

    const updatedAlerts = cameras
      .map(cam => {
        const distance = getDistanceInMeters(lat, lng, cam.lat, cam.lng);
        return { ...cam, distance: Math.round(distance) };
      })
      .filter(cam => cam.distance !== undefined && cam.distance <= settings.cameraRadius)
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

    setActiveAlerts(updatedAlerts);

    // Clean up played states for alerts that are no longer active
    const activeAlertIds = new Set(updatedAlerts.map(cam => cam.id));
    for (const id in playedAlertsRef.current) {
      if (!activeAlertIds.has(id)) {
        delete playedAlertsRef.current[id];
      }
    }

    if (updatedAlerts.length > 0) {
      const closest = updatedAlerts[0];
      setClosestAlert(closest);

      // Proximity warning trigger
      if (settings.soundAlerts && closest.distance !== undefined) {
        const state = playedAlertsRef.current[closest.id] || {};

        if (closest.distance < 150) {
          if (!state.alert) {
            synthWarningSound('alert'); // critical proximity
            playedAlertsRef.current[closest.id] = { ...state, alert: true };
          }
        } else {
          if (!state.warning) {
            synthWarningSound('warning'); // caution proximity
            playedAlertsRef.current[closest.id] = { ...state, warning: true };
          }
        }
      }
    } else {
      setClosestAlert(null);
    }
  }, [currentCoords, isRecording, cameras, settings.cameraRadius, settings.soundAlerts]);

  return { activeAlerts, closestAlert };
}
