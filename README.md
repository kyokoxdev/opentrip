# OpenTrip

OpenTrip is a free, open-source telemetry tracker and clone of TripRank. It tracks driving statistics, speed, G-force dynamics, and speed camera alerts in real-time.

Built with React, TypeScript, and Leaflet (OpenStreetMap) or Google Maps.

---

## Features

- **Speedometer:** Real-time speed tracking (KM/H & MPH) and compass heading.
- **G-Force Circle:** Accel, braking, and cornering dynamics with historical peak indicators.
- **Route Tracking:** Live breadcrumb path plotting using OpenStreetMap or Google Maps.
- **Proximity Alerts:** Audio synth tones and visual warning screens for red-light and speed cameras.
- **Summary Cards:** Generates downloadable summary cards with your route outline and metrics.
- **Simulation Mode:** Mock drive simulation directly on desktop browsers to test sensors and alerts.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Mapping:** Leaflet (OpenStreetMap) & Google Maps JS API
- **Storage:** Local IndexedDB database for offline trip logs
- **Sensory APIs:** Geolocation API & HTML5 DeviceMotion (Accelerometer)
- **Audio Synthesis:** Web Audio API for custom tone warnings

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Configuration

- **Maps:** Uses OpenStreetMap by default. Paste a Google Maps API Key in **Settings** to switch providers.
- **Calibration:** Mount your phone securely and tap **Calibrate Accelerometer** in settings before driving.
- **Simulation:** Click **Enable Sim** in the header to run mock sensor and route data on desktop.
