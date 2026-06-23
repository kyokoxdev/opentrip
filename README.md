# 🚗 OpenTrip — Free & Open-Source Driving Telemetry Tracker

OpenTrip is a high-performance driving telemetry, speedometer, and road camera proximity alerting application. It serves as a fully free, open-source alternative (clone) to TripRank, designed to track your driving dynamics and trip performance without paywalls.

Developed as a Progressive Web Application (PWA) using **React (TypeScript)**, **Vite**, and **Vanilla CSS** with a high-contrast dark cyberpunk aesthetic.

---

## ✨ Features

- **Pro-Grade Speedometer:** Accurate digital speedometer with customizable units (KM/H and MPH) and real-time compass heading tracker.
- **Dynamic G-Force Cockpit Bubble:** Concentric threshold grids (0.5G, 1.0G) displaying real-time lateral cornering force and longitudinal acceleration/braking peaks.
- **Google Maps Route breadcrumbs:** Live route tracking map rendering your path during trips, complete with a dark dashboard map theme.
- **Radar HUD Fallback:** Cyberpunk grid visualization that activates if no Google Maps API key is provided, so you can still track trips, lines, and alerts.
- **Safety alerts:** Approaching warning beeps and visual hazard flags for speed cameras, red light cameras, and traffic junctions.
- **Performance share cards:** Offscreen canvas engine that draws your driving metrics and route path outline directly into a PNG card image for social sharing.
- **Simulation Mode:** Desktop testing mechanism that simulates coordinates driving speed changes, and cornering G-forces, letting you test alerts and gauges in standard browsers.

---

## 🛠️ Tech Stack

1. **Frontend:** React (TypeScript) + Vite
2. **Icons:** Lucide React
3. **Database:** IndexedDB (Native browser store) for secure, offline trip logs
4. **Sensors:** HTML5 Geolocation API + DeviceMotionEvent (Accelerometer G-forces)
5. **Maps:** Google Maps JavaScript API
6. **Alert Sound Synth:** HTML5 Web Audio API (Synthesized tone alerts)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) installed on your system.

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-link>
   cd opentrip
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the hot-reloading development server:
```bash
npm run dev
```
Open the browser at the address shown in your console (usually `http://localhost:5173`).

### Configuration
1. **Google Maps API Key:** You can input your Google Maps API Key directly into the **Settings** tab. The key will be saved to your device's local storage and used to fetch maps.
2. **Phone Mounting:** For real-world use, mount your phone securely in your car's dash holder, open the app, go to Settings, and tap **Calibrate Accelerometer** to zero the G-force meter.

---

## 🏎️ Desktop Testing: Simulation Mode
If you are running the app on a desktop browser, real-world Geolocation speed and accelerometer device motion sensors are unavailable.
1. Click the **"Enable Sim"** button in the header.
2. Click **"Start Trip Logging"** to begin a mock drive.
3. The dashboard will automatically update with simulated speeds, path coordinates, G-force bubble shifts, and speed camera alarms as you drive!
