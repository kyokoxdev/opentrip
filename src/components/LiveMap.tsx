import React, { useEffect, useRef, useState } from 'react';
import { GPSCoords, CameraAlert } from '../types';

interface LiveMapProps {
  currentCoords: GPSCoords;
  path: GPSCoords[];
  activeAlerts: CameraAlert[];
  googleMapsApiKey: string;
}

// Dark Mode Theme JSON for Google Maps
const GOOGLE_MAPS_DARK_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#16161c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#16161c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e9f' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#00e5ff' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#12251a' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#00ff66' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#262632' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1b1b22' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8e8e9f' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d3d' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#00e5ff', weight: 0.5 }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0c0c0e' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#57576c' }]
  }
];

export const LiveMap: React.FC<LiveMapProps> = ({
  currentCoords,
  path,
  activeAlerts,
  googleMapsApiKey
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  const googleMapInstanceRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const pathPolylineRef = useRef<any>(null);
  const alertMarkersRef = useRef<any[]>([]);

  // Load Google Maps API Script
  useEffect(() => {
    if (!googleMapsApiKey || isMapsLoaded) return;

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initMapSuccess = () => {
      setIsMapsLoaded(true);
      setLoadError(false);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMapSuccess;
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setLoadError(true);
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).google && (window as any).google.maps) {
        initMapSuccess();
      } else {
        script.addEventListener('load', initMapSuccess);
      }
    }

    return () => {
      // Clean up listeners if still loading
      if (script) {
        script.removeEventListener('load', initMapSuccess);
      }
    };
  }, [googleMapsApiKey, isMapsLoaded]);

  // Initialize Map Instance
  useEffect(() => {
    if (!isMapsLoaded || !mapRef.current || !(window as any).google) return;

    const google = (window as any).google;
    const mapOptions = {
      center: { lat: currentCoords.lat, lng: currentCoords.lng },
      zoom: 16,
      styles: GOOGLE_MAPS_DARK_THEME,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };

    const map = new google.maps.Map(mapRef.current, mapOptions);
    googleMapInstanceRef.current = map;

    // Vehicle Marker (Cyan glowing circle)
    const vehicleIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#00e5ff',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };

    vehicleMarkerRef.current = new google.maps.Marker({
      position: { lat: currentCoords.lat, lng: currentCoords.lng },
      map: map,
      icon: vehicleIcon,
      title: 'Current Position'
    });

    // Trail Breadcrumbs (Neon Green Path Line)
    pathPolylineRef.current = new google.maps.Polyline({
      path: path.map(p => ({ lat: p.lat, lng: p.lng })),
      geodesic: true,
      strokeColor: '#00ff66',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map
    });

    return () => {
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.setMap(null);
      if (pathPolylineRef.current) pathPolylineRef.current.setMap(null);
      googleMapInstanceRef.current = null;
    };
  }, [isMapsLoaded]);

  // Update Map Position, Path, and Alert Markers dynamically
  useEffect(() => {
    if (!googleMapInstanceRef.current || !(window as any).google) return;
    const google = (window as any).google;
    const map = googleMapInstanceRef.current;
    const pos = { lat: currentCoords.lat, lng: currentCoords.lng };

    // Pan map to follow vehicle
    map.panTo(pos);

    // Update vehicle marker position
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setPosition(pos);
      
      // Dynamic heading rotation icon if heading is available
      if (currentCoords.heading !== null) {
        const rotationIcon = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#00e5ff',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          rotation: currentCoords.heading
        };
        vehicleMarkerRef.current.setIcon(rotationIcon);
      }
    }

    // Update trail line path
    if (pathPolylineRef.current) {
      pathPolylineRef.current.setPath(path.map(p => ({ lat: p.lat, lng: p.lng })));
    }

    // Clear old alert markers
    alertMarkersRef.current.forEach(marker => marker.setMap(null));
    alertMarkersRef.current = [];

    // Add new camera markers in radius
    activeAlerts.forEach(alert => {
      const alertIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: alert.type === 'speed_camera' || alert.type === 'redlight_camera' ? '#ff0055' : '#ff9f00',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 1.5
      };

      const marker = new google.maps.Marker({
        position: { lat: alert.lat, lng: alert.lng },
        map: map,
        icon: alertIcon,
        title: alert.description
      });

      alertMarkersRef.current.push(marker);
    });

  }, [currentCoords, path, activeAlerts]);

  // If map is configured and successfully loaded
  if (googleMapsApiKey && !loadError) {
    return (
      <div className="map-container">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        <div className="map-badge">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--neon-green)' }} />
          GPS TRACKING
        </div>
      </div>
    );
  }

  // Cyberpunk HUD Radar Alternate Render if Key is missing
  // Generates coordinate grid relative to current point
  return (
    <div className="map-container" style={{ borderStyle: 'dashed' }}>
      <div className="map-placeholder">
        {/* Animated Radar scan circle */}
        <div 
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            position: 'relative',
            background: 'radial-gradient(circle, rgba(0,229,255,0.02) 0%, rgba(0,0,0,0.5) 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Circular Scan lines */}
          <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px dotted rgba(0, 229, 255, 0.1)' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px dotted rgba(0, 229, 255, 0.05)' }} />

          {/* Compass grid lines */}
          <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(0, 229, 255, 0.05)' }} />
          <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(0, 229, 255, 0.05)' }} />

          {/* Radar Sweep Animation overlay */}
          <div 
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(0, 229, 255, 0.15) 0deg, transparent 90deg)',
              transform: `rotate(${(Date.now() / 20) % 360}deg)`
            }}
          />

          {/* Vehicle position center dot */}
          <div 
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--neon-cyan)',
              boxShadow: 'var(--glow-cyan)'
            }}
          />

          {/* Render relative mock cameras as dots on radar grid */}
          {activeAlerts.map((alert, idx) => {
            // Convert relative lat/lng to px offsets (scale 1deg ~ 50000px)
            const dLat = alert.lat - currentCoords.lat;
            const dLng = alert.lng - currentCoords.lng;
            
            // Map offsets to coordinates
            const scale = 12000; 
            const topOffset = Math.max(-50, Math.min(50, -dLat * scale));
            const leftOffset = Math.max(-50, Math.min(50, dLng * scale));

            return (
              <div 
                key={alert.id || idx}
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: alert.type.includes('camera') ? 'var(--neon-red)' : 'var(--neon-orange)',
                  boxShadow: alert.type.includes('camera') ? 'var(--glow-red)' : 'var(--glow-orange)',
                  top: `calc(50% + ${topOffset}px - 3px)`,
                  left: `calc(50% + ${leftOffset}px - 3px)`
                }}
              />
            );
          })}
        </div>

        <div style={{ padding: '0 20px', zIndex: 1 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Telemetry Coordinate: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Google Maps API Key is required for map tiles. Configure your key in Settings.
          </p>
        </div>
      </div>
      <div className="map-badge" style={{ color: 'var(--neon-orange)', borderColor: 'rgba(255, 159, 0, 0.3)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--neon-orange)' }} />
        RADAR HUD MODE
      </div>
    </div>
  );
};
