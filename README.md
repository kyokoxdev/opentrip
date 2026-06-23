# OpenTrip

OpenTrip is a free, open-source driving telemetry tracker. It monitors speed, G-force dynamics, route progression, and provides road camera alerts in real-time.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)]()

The application is built using React, TypeScript, Leaflet, and the Google Maps API. It runs fully client-side and stores all trip records locally in the browser.

---

## Features

* **Speedometer & Compass:** Accurate speed tracking supporting imperial (MPH) and metric (KM/H) units alongside compass heading indicators.
* **G-Force Dynamics:** Acceleration, deceleration, and cornering friction-circle G-force meter with peak logging thresholds.
* **Dual-Engine Mapping:** Choose between OpenStreetMap (Leaflet) and Google Maps API to draw breadcrumb trail progression.
* **Camera Alarms:** Audio tone warnings and visual alerts triggered by speed cameras, traffic signals, and red-light junctions.
* **Export Cards:** Canvas rendering pipeline to download trip statistics and route outline shapes as PNG share cards.
* **Simulation Mode:** Desktop telemetry playback engine to test sensor logic, alerts, and map routing directly in the browser.

---

## Technical Architecture

* **Framework:** React 19 + TypeScript + Vite
* **Storage Layer:** IndexedDB (offline browser database)
* **Audio Synthesis:** Web Audio API (real-time warning tone synthesizer)
* **Sensor Integration:** W3C Geolocation API & HTML5 DeviceMotion API

---

## Quick Start

### Installation

Install package dependencies:

```bash
npm install
```

### Development

Run the local development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

Create a production-ready client bundle:

```bash
npm run build
```

---

## Configuration

### Maps
OpenStreetMap is active by default. To use Google Maps, insert your API key under the **Settings** panel. The key is stored locally on your device.

### Accelerometer Calibration
For real-world tracking, mount your device securely in the vehicle, open the application, go to **Settings**, and select **Calibrate Accelerometer** to zero the device sensors.

### Simulation Mode
Click **Enable Sim** in the header on desktop browsers to bypass hardware sensor requirements and simulate driving coordinates and telemetry.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
