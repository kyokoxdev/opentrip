import { CameraAlert } from '../types';

// Haversine distance helper
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function fetchOSMAlerts(lat: number, lng: number, radiusMeters: number = 1500): Promise<CameraAlert[]> {
  // Query Overpass API for speed cameras, traffic signals, stop signs, and speed bumps
  const query = `
    [out:json][timeout:15];
    (
      node["highway"="speed_camera"](around:${radiusMeters}, ${lat}, ${lng});
      node["highway"="traffic_signals"](around:${radiusMeters}, ${lat}, ${lng});
      node["highway"="stop"](around:${radiusMeters}, ${lat}, ${lng});
      node["highway"="speed_bump"](around:${radiusMeters}, ${lat}, ${lng});
      node["traffic_calming"="bump"](around:${radiusMeters}, ${lat}, ${lng});
    );
    out body;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Overpass API response error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.elements) return [];

    return data.elements.map((element: any): CameraAlert => {
      let type: CameraAlert['type'] = 'traffic_signal';
      let description = 'Traffic Alert';
      let speedLimit: number | undefined = undefined;

      const tags = element.tags || {};
      
      // Determine alert type and details based on OSM tags
      if (tags.highway === 'speed_camera') {
        type = 'speed_camera';
        description = tags.description || 'Speed Camera';
        if (tags.maxspeed) {
          speedLimit = parseInt(tags.maxspeed, 10);
          description = `Fixed Speed Camera (${speedLimit} km/h)`;
        }
      } else if (tags.highway === 'traffic_signals') {
        // Check if there is redlight surveillance tag on the traffic signal
        const isRedLightCam = 
          tags.camera === 'yes' || 
          tags['surveillance'] === 'yes' || 
          tags['surveillance:type'] === 'traffic_light' || 
          tags['surveillance:type'] === 'redlight';

        type = isRedLightCam ? 'redlight_camera' : 'traffic_signal';
        description = isRedLightCam ? 'Red Light Camera' : 'Traffic Light';
      } else if (tags.highway === 'stop') {
        type = 'stop_sign';
        description = 'Stop Sign';
      } else if (tags.highway === 'speed_bump' || tags.traffic_calming === 'bump') {
        type = 'speed_bump';
        description = 'Speed Bump';
      }

      return {
        id: `osm-${element.id}`,
        type,
        lat: element.lat,
        lng: element.lon,
        speedLimit,
        description,
        distance: Math.round(calculateDistance(lat, lng, element.lat, element.lon))
      };
    });
  } catch (error) {
    console.error('Failed to fetch alerts from OpenStreetMap Overpass API:', error);
    throw error;
  }
}
