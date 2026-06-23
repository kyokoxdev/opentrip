# OpenTrip

OpenTrip is a high-performance driving telemetry, speedometer, and road camera proximity alerting application. It serves as a free, open-source alternative to TripRank, designed to track your driving dynamics and trip performance without paywalls.

Built as a Progressive Web Application (PWA) using React, TypeScript, Vite, and Vanilla CSS.

---

## Features

- **Pro-Grade Speedometer:** Accurate digital speedometer with customizable units (KM/H and MPH) and real-time compass heading tracking.
- **G-Force Dynamics Bubble:** Concentric threshold grids (0.5G, 1.0G) displaying real-time lateral cornering force and longitudinal acceleration or braking peaks.
- **Dual Map Providers:** Supports both OpenStreetMap (free, default) and Google Maps (via custom API key configuration) with live breadcrumb route tracking.
- **Safety Alerts:** Proximity-based warning beeps and visual flags for speed cameras, red light cameras, and traffic junctions.
- **Performance Share Cards:** Canvas engine that renders your driving metrics and route path outline directly into a PNG card image for sharing.
- **Simulation Mode:** Desktop testing mechanism that simulates GPS coordinates, driving speed changes, and cornering G-forces for standard browser testing.

---

## Quick Start

Ensure you have [Node.js](https://nodejs.org) installed, then run the following commands:

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open the browser at the address shown in your console (usually `http://localhost:5173`).

---

## Configuration

1. **Map Engine Setup:** By default, OpenTrip uses OpenStreetMap. To use Google Maps, enter your API Key in the **Settings** tab. The key is securely saved to your local storage.
2. **Device Calibration:** For real-world use, mount your phone securely in your vehicle, open the application, navigate to **Settings**, and select **Calibrate Accelerometer** to calibrate the G-force meter.

---

## Simulation Mode

For testing on desktop browsers where GPS and accelerometer sensors are unavailable:
1. Click **Enable Sim** in the header.
2. Select **Start Drive Logging** to begin a simulated driving route.
3. The dashboard will automatically update with simulated speeds, path coordinates, G-force bubble shifts, and camera alerts.
