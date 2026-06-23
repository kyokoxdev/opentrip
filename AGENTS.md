# OpenTrip: Open-Source TripRank Clone - Rules & Specs

OpenTrip is a clean, free, open-source alternative to TripRank. It tracks driving telemetry, GPS speed, and trip statistics, and provides real-time traffic camera and speed alerts, all without a paywall.

## 🚀 Technology Stack
1. **Frontend Framework:** React (TypeScript) + Vite
2. **Styling:** Vanilla CSS (no Tailwind, using modern CSS variables, neon accents, and glassmorphism)
3. **Telemetry & Sensors:** 
   - Geolocation API (Latitude, Longitude, Altitude, Speed, Heading)
   - DeviceMotion / DeviceOrientation API (G-force acceleration, cornering, and braking detection)
4. **Mapping:** Google Maps JavaScript API (for route tracking and navigation display)
5. **Storage:** IndexedDB (via `idb` or LocalForage) for local trip logs, telemetry, and paths
6. **Data & Alerts:** OpenStreetMap Overpass API (for traffic light and camera alerts) + local mock database fallback
7. **PWA Support:** `vite-plugin-pwa` for installation as a mobile app with offline sensor access

---

## 📱 Feature Specifications

### 1. Dashboards & Telemetry View (Mobile First)
- **Speedometer:** Large, high-contrast digital speed display. Support for switching units (km/h vs. mph).
- **G-Force Meter:** Bubble gauge showing real-time longitudinal (braking/acceleration) and lateral (cornering) G-forces.
- **Stats Card:** Live counters for current trip duration, distance, average speed, max speed, and maximum Gs.
- **Sensor Calibration:** Button to tare/calibrate the accelerometer when the phone is mounted in a car.

### 2. Live Map & Navigation
- Real-time location tracking using Google Maps.
- Route drawing (breadcrumbs) showing where the user has driven during the current session.
- Visual overlays for upcoming traffic cameras, speed traps, and traffic lights.

### 3. Camera & Road Alerts
- Real-time proximity warnings for speed cameras, red light cameras, stop signs, and speed bumps.
- Audio and visual alerts when approaching a camera within a 500m radius.
- Fallback mock warning simulator for testing in browser environments.

### 4. Trip History & Performance Logging
- List of saved trips with key metrics (date, duration, distance, avg/max speed, max positive/negative Gs).
- Detailed view of a past trip with a Google Maps route path and telemetry charts (speed over time, G-force plot).
- Delete/Export options.

### 5. Social Sharing Card Generator
- A clean, dark-mode summary card that displays trip telemetry (map snippet, max speed, max G-force, distance).
- Option to download the summary card as an image for sharing.

---

## 🎨 UI/UX Design Guidelines (Premium Aesthetics)
- **Palette:** Dark mode baseline (`#0b0b0d` bg, `#16161c` surface) with vibrant neon accents:
  - Neon Green (`#00ff66`) for steady state, safety, and GPS status.
  - Neon Cyan (`#00e5ff`) for trip progress and maps.
  - Neon Orange (`#ff8c00`) for acceleration/cornering warnings.
  - Neon Red (`#ff0055`) for braking warnings and speed camera alerts.
- **Typography:** Large, readable sans-serif typefaces (e.g., *Inter* or *Rajdhani* for digital gauges).
- **Interactions:** Subtle scale animations on press, smooth transitions between tab views, pulsing radar animations, and glowing neon alerts.

---

## 📁 Directory Structure
```
opentrip/
├── public/
│   └── manifest.json       # PWA Manifest
├── src/
│   ├── assets/             # SVGs, audio alert files
│   ├── components/         # Modular UI elements (Speedometer, GForceMeter, LiveMap, etc.)
│   ├── hooks/              # Sensor tracking hooks (useGPS.ts, useDeviceMotion.ts)
│   ├── services/           # DB service, mock overlays
│   ├── utils/              # Conversion functions, G-Force smoothing math
│   ├── App.tsx             # Main layout & router/tabs
│   ├── index.css           # Design tokens, global CSS
│   └── main.tsx
├── AGENTS.md               # This file
├── vite.config.ts
└── package.json
```

---

## ⚙️ Development Rules & Constraints
1. **No Tailwind CSS:** Style using `index.css` and standard CSS modules or global utility classes. Utilize CSS custom properties for theme colors.
2. **Desktop Testing Fallback:** Since desktop browsers do not have GPS speed or actual car accelerometer motion, implement a **Simulation Mode** toggle in the app header. This will simulate a trip with moving GPS coordinates, speed changes, and G-force movements, making it easy to test on a local machine.
3. **Google Maps API Key:** Allow the user to configure their Google Maps API Key via an `.env` file or direct input in the settings panel (saved to `localStorage` for convenience).
4. **Maintain Documentation:** Keep functions and hooks well-documented. Do not erase instructions.
