import React, { useEffect, useRef, useState } from 'react';
import { GPSCoords } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PastTripMapProps {
  path: GPSCoords[];
  mapProvider: 'google' | 'osm';
  googleMapsApiKey: string;
  theme: 'light' | 'dark';
  activeTelemetryIndex: number | null;
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

export const PastTripMap: React.FC<PastTripMapProps> = ({
  path,
  mapProvider,
  googleMapsApiKey,
  theme,
  activeTelemetryIndex
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Maps instances & refs
  const [isGoogleMapsScriptLoaded, setIsGoogleMapsScriptLoaded] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState(false);
  
  const googleMapInstanceRef = useRef<any>(null);
  const googlePathPolylineRef = useRef<any>(null);
  const googleStartMarkerRef = useRef<any>(null);
  const googleEndMarkerRef = useRef<any>(null);
  const googleActiveMarkerRef = useRef<any>(null);

  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const leafletPathPolylineRef = useRef<L.Polyline | null>(null);
  const leafletStartMarkerRef = useRef<L.Marker | null>(null);
  const leafletEndMarkerRef = useRef<L.Marker | null>(null);
  const leafletActiveMarkerRef = useRef<L.Marker | null>(null);

  const destroyMaps = () => {
    // Destroy Google Maps
    if (googleStartMarkerRef.current) googleStartMarkerRef.current.setMap(null);
    if (googleEndMarkerRef.current) googleEndMarkerRef.current.setMap(null);
    if (googleActiveMarkerRef.current) googleActiveMarkerRef.current.setMap(null);
    if (googlePathPolylineRef.current) googlePathPolylineRef.current.setMap(null);
    googleMapInstanceRef.current = null;

    // Destroy Leaflet Map
    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
    }
    leafletPathPolylineRef.current = null;
    leafletStartMarkerRef.current = null;
    leafletEndMarkerRef.current = null;
    leafletActiveMarkerRef.current = null;
  };

  // Clean up on provider or theme change, or unmount
  useEffect(() => {
    destroyMaps();
    return () => {
      destroyMaps();
    };
  }, [mapProvider, theme]);

  // Load Google Maps Script
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

  // Map Setup
  useEffect(() => {
    if (!mapContainerRef.current || path.length === 0) return;

    if (mapProvider === 'google') {
      try {
        if (!isGoogleMapsScriptLoaded || !(window as any).google) return;
        const google = (window as any).google;

        if (!googleMapInstanceRef.current) {
          const bounds = new google.maps.LatLngBounds();
          path.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));

          const mapOptions = {
            styles: theme === 'light' ? [] : GOOGLE_MAPS_DARK_THEME,
            disableDefaultUI: true,
            zoomControl: true,
            maxZoom: 18,
            minZoom: 2
          };

          const map = new google.maps.Map(mapContainerRef.current, mapOptions);
          googleMapInstanceRef.current = map;
          map.fitBounds(bounds);

          // Path
          googlePathPolylineRef.current = new google.maps.Polyline({
            path: path.map(p => ({ lat: p.lat, lng: p.lng })),
            geodesic: true,
            strokeColor: '#00e5ff',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: map
          });

          // Start Point Marker
          googleStartMarkerRef.current = new google.maps.Marker({
            position: { lat: path[0].lat, lng: path[0].lng },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#00ff66',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1.5
            },
            title: 'Start Location'
          });

          // End Point Marker
          googleEndMarkerRef.current = new google.maps.Marker({
            position: { lat: path[path.length - 1].lat, lng: path[path.length - 1].lng },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#ff0055',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1.5
            },
            title: 'End Location'
          });

          // Active scrubbing marker
          googleActiveMarkerRef.current = new google.maps.Marker({
            position: { lat: path[0].lat, lng: path[0].lng },
            map: map,
            visible: false,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#00e5ff',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            },
            zIndex: 999
          });
        }
      } catch (e) {
        console.error("Failed executing PastTripMap Google Maps logic:", e);
        setGoogleLoadError(true);
      }
    } else {
      // Leaflet Setup
      if (!leafletMapInstanceRef.current) {
        const startPt = path[0];
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([startPt.lat, startPt.lng], 15);

        leafletMapInstanceRef.current = map;

        const tileUrl = theme === 'light'
          ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        L.tileLayer(tileUrl, {
          maxZoom: 20
        }).addTo(map);

        // Draw trail polyline
        const latlngs = path.map(p => [p.lat, p.lng] as [number, number]);
        const polyline = L.polyline(latlngs, {
          color: 'var(--neon-cyan)',
          weight: 4,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
        leafletPathPolylineRef.current = polyline;

        // Auto zoom and fit to bounds
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });

        // Start custom element
        const startIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;border-radius:50%;background-color:var(--neon-green);border:2px solid #ffffff;box-shadow:var(--glow-green);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          className: ''
        });
        leafletStartMarkerRef.current = L.marker([path[0].lat, path[0].lng], { icon: startIcon }).addTo(map);

        // End custom element
        const endIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;border-radius:50%;background-color:var(--neon-red);border:2px solid #ffffff;box-shadow:var(--glow-red);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          className: ''
        });
        leafletEndMarkerRef.current = L.marker([path[path.length - 1].lat, path[path.length - 1].lng], { icon: endIcon }).addTo(map);

        // Active custom indicator
        const activeIcon = L.divIcon({
          html: `<div style="width:16px;height:16px;border-radius:50%;background-color:var(--neon-cyan);border:2px.5px solid #ffffff;box-shadow:var(--glow-cyan);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          className: ''
        });
        leafletActiveMarkerRef.current = L.marker([path[0].lat, path[0].lng], { icon: activeIcon });
      }
    }
  }, [path, mapProvider, isGoogleMapsScriptLoaded, theme]);

  // Update position of scrubbing marker
  useEffect(() => {
    if (activeTelemetryIndex === null || activeTelemetryIndex < 0 || activeTelemetryIndex >= path.length) {
      if (googleActiveMarkerRef.current) googleActiveMarkerRef.current.setVisible(false);
      if (leafletMapInstanceRef.current && leafletActiveMarkerRef.current) {
        leafletActiveMarkerRef.current.remove();
      }
      return;
    }

    const activePoint = path[activeTelemetryIndex];
    const latlng = { lat: activePoint.lat, lng: activePoint.lng };

    if (mapProvider === 'google' && googleActiveMarkerRef.current) {
      googleActiveMarkerRef.current.setPosition(latlng);
      googleActiveMarkerRef.current.setVisible(true);
      
      // Optionally center map on the active marker while scrubbing
      const map = googleMapInstanceRef.current;
      if (map) {
        map.panTo(latlng);
      }
    } else if (mapProvider === 'osm' && leafletMapInstanceRef.current && leafletActiveMarkerRef.current) {
      leafletActiveMarkerRef.current.setLatLng([activePoint.lat, activePoint.lng]);
      if (!leafletMapInstanceRef.current.hasLayer(leafletActiveMarkerRef.current)) {
        leafletActiveMarkerRef.current.addTo(leafletMapInstanceRef.current);
      }
      leafletMapInstanceRef.current.panTo([activePoint.lat, activePoint.lng]);
    }
  }, [activeTelemetryIndex, path, mapProvider]);

  const showGoogleError = mapProvider === 'google' && (!googleMapsApiKey || googleLoadError);

  return (
    <div className="map-container" style={{ height: '220px', marginTop: '4px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      
      <div className="map-badge" style={{ zIndex: 5 }}>
        <span 
          style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--neon-cyan)' 
          }} 
        />
        {mapProvider === 'google' ? 'GOOGLE MAPS' : 'OPENSTREETMAP'}
      </div>

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
          <span style={{ fontSize: '1rem', color: 'var(--neon-red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            Google Maps Unavailable
          </span>
          <p style={{ fontSize: '0.75rem', maxWidth: '250px' }}>
            Check Settings for API Key or switch map settings to OSM.
          </p>
        </div>
      )}
    </div>
  );
};
