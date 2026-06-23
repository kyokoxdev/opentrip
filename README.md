# OpenTrip

OpenTrip is a free, open-source clone of TripRank. It tracks driving telemetry, speed, G-force, and road camera alerts in real-time.

Built with React, TypeScript, and Leaflet (OpenStreetMap) / Google Maps.

## Features

- Digital speedometer (KM/H & MPH) and compass heading.
- G-Force friction circle with peak markers.
- Live route tracking on Google Maps or OpenStreetMap.
- Speed and red-light camera alerts with audio warnings.
- Summary cards (export to PNG).
- Simulation mode for desktop browser testing.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Configuration

- **Maps:** Uses OpenStreetMap by default. Add a Google Maps API Key in **Settings** to switch providers.
- **Calibration:** Mount your phone securely and tap **Calibrate Accelerometer** in settings before driving.
- **Simulation:** Click **Enable Sim** in the header to run mock sensor and route data on desktop.
