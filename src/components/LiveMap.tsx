import React, { useEffect, useRef, useState } from 'react';
import { GPSCoords, CameraAlert } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
  currentCoords: GPSCoords;
  path: GPSCoords[];
  activeAlerts: CameraAlert[];
  googleMapsApiKey: string;
  mapProvider: 'google' | 'osm';
  height?: string; // Optional custom height (e.g. 100% for fullscreen)
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
  googleMapsApiKey,
  mapProvider,
  height
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Google Maps state and refs
  const [isGoogleMapsScriptLoaded, setIsGoogleMapsScriptLoaded] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState(false);
  const googleMapInstanceRef = useRef<any>(null);
  const googleVehicleMarkerRef = useRef<any>(null);
  const googlePathPolylineRef = useRef<any>(null);
  const googleAlertMarkersRef = useRef<any[]>([]);

  // Leaflet / OpenStreetMap refs
  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const leafletVehicleMarkerRef = useRef<L.Marker | null>(null);
  const leafletPathPolylineRef = useRef<L.Polyline | null>(null);
  const leafletAlertMarkersRef = useRef<L.CircleMarker[]>([]);

  // Handle switching map provider (destroy previous instances)
  const destroyMaps = () => {
    // Destroy Google Maps
    if (googleVehicleMarkerRef.current) googleVehicleMarkerRef.current.setMap(null);
    if (googlePathPolylineRef.current) googlePathPolylineRef.current.setMap(null);
    googleAlertMarkersRef.current.forEach(m => m.setMap(null));
    googleAlertMarkersRef.current = [];
    googleMapInstanceRef.current = null;

    // Destroy Leaflet Map
    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
    }
    leafletVehicleMarkerRef.current = null;
    leafletPathPolylineRef.current = null;
    leafletAlertMarkersRef.current = [];
  };

  // Trigger cleanup when provider changes
  useEffect(() => {
    destroyMaps();
  }, [mapProvider]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      destroyMaps();
    };
  }, []);

  // 1. Google Maps Script Loader
  useEffect(() => {
    if (mapProvider !== 'google' || !googleMapsApiKey || isGoogleMapsScriptLoaded) return;

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initMapSuccess = () => {
      setIsGoogleMapsScriptLoaded(true);
      setGoogleLoadError(false);
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
        setGoogleLoadError(true);
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).google && (window as any).google.maps) {
        initMapSuccess();
      } else {
        script.addEventListener('load', initMapSuccess);
      }
    }
  }, [googleMapsApiKey, mapProvider, isGoogleMapsScriptLoaded]);

  // 2. Main Map Render & Update Effect
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapProvider === 'google') {
      // --- GOOGLE MAPS ENGINE ---
      if (!isGoogleMapsScriptLoaded || !(window as any).google) return;
      const google = (window as any).google;

      // Initialize map instance if not loaded
      if (!googleMapInstanceRef.current) {
        const mapOptions = {
          center: { lat: currentCoords.lat, lng: currentCoords.lng },
          zoom: 16,
          styles: GOOGLE_MAPS_DARK_THEME,
          disableDefaultUI: true,
          zoomControl: false
        };

        const map = new google.maps.Map(mapContainerRef.current, mapOptions);
        googleMapInstanceRef.current = map;

        // Vehicle Icon Symbol
        const vehicleIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#00e5ff',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        };

        googleVehicleMarkerRef.current = new google.maps.Marker({
          position: { lat: currentCoords.lat, lng: currentCoords.lng },
          map: map,
          icon: vehicleIcon,
          title: 'Current Position'
        });

        // Path / Breadcrumb Line
        googlePathPolylineRef.current = new google.maps.Polyline({
          path: path.map(p => ({ lat: p.lat, lng: p.lng })),
          geodesic: true,
          strokeColor: '#00ff66',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map
        });
      }

      // Update google map updates
      const map = googleMapInstanceRef.current;
      const pos = { lat: currentCoords.lat, lng: currentCoords.lng };
      map.panTo(pos);

      // Rotate/Update Vehicle Marker
      if (googleVehicleMarkerRef.current) {
        googleVehicleMarkerRef.current.setPosition(pos);
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
          googleVehicleMarkerRef.current.setIcon(rotationIcon);
        }
      }

      // Update Trail Line
      if (googlePathPolylineRef.current) {
        googlePathPolylineRef.current.setPath(path.map(p => ({ lat: p.lat, lng: p.lng })));
      }

      // Refresh camera markers
      googleAlertMarkersRef.current.forEach(marker => marker.setMap(null));
      googleAlertMarkersRef.current = [];

      activeAlerts.forEach(alert => {
        const marker = new google.maps.Marker({
          position: { lat: alert.lat, lng: alert.lng },
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: alert.type.includes('camera') ? '#ff0055' : '#ff9f00',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1.5
          },
          title: alert.description
        });
        googleAlertMarkersRef.current.push(marker);
      });

    } else {
      // --- OPENSTREETMAP (LEAFLET) ENGINE ---
      if (!leafletMapInstanceRef.current) {
        // Initialize Leaflet Map
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          fadeAnimation: true,
          zoomAnimation: true
        }).setView([currentCoords.lat, currentCoords.lng], 16);

        leafletMapInstanceRef.current = map;

        // Load Dark Mode Tiles from CartoDB (Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        // Vehicle Custom Indicator (Glowing HTML dot)
        const rotation = currentCoords.heading ?? 0;
        const vehicleHtmlIcon = L.divIcon({
          className: 'leaflet-vehicle-marker-container',
          html: `<div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: var(--neon-cyan);
            border: 2px solid #ffffff;
            box-shadow: var(--glow-cyan);
            transform: rotate(${rotation}deg);
            transition: transform 0.1s ease;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        leafletVehicleMarkerRef.current = L.marker([currentCoords.lat, currentCoords.lng], {
          icon: vehicleHtmlIcon
        }).addTo(map);

        // Breadcrumb Trail Polyline
        leafletPathPolylineRef.current = L.polyline(
          path.map(p => [p.lat, p.lng]), 
          {
            color: '#00ff66',
            weight: 4,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }
        ).addTo(map);
      }

      // Update OSM Map center dynamically
      const map = leafletMapInstanceRef.current;
      map.panTo([currentCoords.lat, currentCoords.lng]);

      // Update Vehicle Marker Pos & Heading
      if (leafletVehicleMarkerRef.current) {
        leafletVehicleMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
        const rotation = currentCoords.heading ?? 0;
        const nextIcon = L.divIcon({
          className: 'leaflet-vehicle-marker-container',
          html: `<div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: var(--neon-cyan);
            border: 2px solid #ffffff;
            box-shadow: var(--glow-cyan);
            transform: rotate(${rotation}deg);
            transition: transform 0.1s ease;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        leafletVehicleMarkerRef.current.setIcon(nextIcon);
      }

      // Update Trail Line
      if (leafletPathPolylineRef.current) {
        leafletPathPolylineRef.current.setLatLngs(path.map(p => [p.lat, p.lng]));
      }

      // Clear & Refresh OSM camera markers
      leafletAlertMarkersRef.current.forEach(m => map.removeLayer(m));
      leafletAlertMarkersRef.current = [];

      activeAlerts.forEach(alert => {
        const markerColor = alert.type.includes('camera') ? '#ff0055' : '#ff9f00';
        const markerGlow = alert.type.includes('camera') ? 'var(--glow-red)' : 'var(--glow-orange)';
        
        // Custom HTML marker for cameras
        const cameraIcon = L.divIcon({
          className: 'leaflet-camera-marker-container',
          html: `<div style="
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: ${markerColor};
            border: 1.5px solid #ffffff;
            box-shadow: ${markerGlow};
          "></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const marker = L.marker([alert.lat, alert.lng], { icon: cameraIcon }).addTo(map);
        leafletAlertMarkersRef.current.push(marker as any);
      });
    }
  }, [currentCoords, path, activeAlerts, mapProvider, isGoogleMapsScriptLoaded]);

  // Display Fallback setup if Google Maps is chosen but Key is missing
  const showGoogleError = mapProvider === 'google' && (!googleMapsApiKey || googleLoadError);

  return (
    <div 
      className="map-container"
      style={height ? { height, borderRadius: 0, border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : undefined}
    >
      {/* Target Mount Div for Google/OSM Map frameworks */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Badge indicators */}
      <div className="map-badge" style={{ zIndex: 5 }}>
        <span 
          style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--neon-green)' 
          }} 
        />
        {mapProvider === 'google' ? 'GOOGLE MAPS' : 'OPENSTREETMAP'}
      </div>

      {/* Google map error helper message */}
      {showGoogleError && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #16161c 0%, #0c0c0e 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            zIndex: 10
          }}
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--neon-red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            Google Maps Locked
          </span>
          <p style={{ fontSize: '0.8rem', maxWidth: '300px', marginBottom: '16px' }}>
            Please check your API key in Settings, or toggle back to OpenStreetMap (free tile layer).
          </p>
        </div>
      )}
    </div>
  );
};
