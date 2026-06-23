import { useState, useEffect } from 'react';
import { AppSettings, Trip } from './types';
import { initDB, getTrips, saveTrip, deleteTrip, getSettings, saveSettings } from './services/db';
import { useGPS } from './hooks/useGPS';
import { useDeviceMotion } from './hooks/useDeviceMotion';
import { useCameraAlerts } from './hooks/useCameraAlerts';

// Components
import { Speedometer } from './components/Speedometer';
import { GForceMeter } from './components/GForceMeter';
import { LiveMap } from './components/LiveMap';
import { AlertWidget } from './components/AlertWidget';
import { Settings } from './components/Settings';
import { TripHistory } from './components/TripHistory';

// Icons
import { Gauge, History, Settings as SettingsIcon, Play, Square } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    units: 'metric',
    mapProvider: 'osm',
    theme: 'dark',
    googleMapsApiKey: '',
    soundAlerts: true,
    cameraRadius: 500,
    gForceCalibratedOffset: { x: 0, y: 0 }
  });

  // G-Force peaks state for active recording
  const [maxG, setMaxG] = useState({ lat: 0, acc: 0, brk: 0 });

  // Initialize DB and load settings/trips on startup
  useEffect(() => {
    async function loadData() {
      try {
        await initDB();
        const loadedSettings = await getSettings();
        const loadedTrips = await getTrips();
        setSettings(loadedSettings);
        setTripsList(loadedTrips);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    }
    loadData();
  }, []);

  // Apply theme class to HTML root element dynamically
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      if (settings.theme === 'light') {
        rootElement.classList.add('light-theme');
      } else {
        rootElement.classList.remove('light-theme');
      }
    }
  }, [settings.theme]);

  // GPS telemetrics hook
  const gps = useGPS(isSimulationMode);

  // Accelerometer telemetry hook
  const motion = useDeviceMotion(
    isSimulationMode,
    gps.currentCoords.speed,
    gps.currentCoords.heading ?? 0
  );

  // Road camera alerts hook
  const alerts = useCameraAlerts(gps.currentCoords, gps.isRecording, settings);

  // Monitor and accumulate maximum G-forces during recording
  useEffect(() => {
    if (gps.isRecording) {
      setMaxG(prev => {
        const lat = Math.max(prev.lat, Math.abs(motion.gForce.x));
        const acc = Math.max(prev.acc, motion.gForce.y > 0 ? motion.gForce.y : 0);
        const brk = Math.max(prev.brk, motion.gForce.y < 0 ? Math.abs(motion.gForce.y) : 0);
        return { lat, acc, brk };
      });
    }
  }, [motion.gForce, gps.isRecording]);

  // Start drive logging
  const handleStartTrip = () => {
    setMaxG({ lat: 0, acc: 0, brk: 0 });
    // Attempt motion permissions (relevant for Safari iOS)
    motion.requestPermission();
    gps.startTrip();
  };

  // Stop drive logging and compile performance card
  const handleStopTrip = async () => {
    const tripSummary = gps.stopTrip();
    
    // Save to IndexedDB if some distance was covered
    if (tripSummary.path.length > 1) {
      const newTrip: Trip = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        duration: tripSummary.duration,
        distance: tripSummary.distance,
        maxSpeed: tripSummary.maxSpeed,
        avgSpeed: tripSummary.duration > 0 ? (tripSummary.distance / (tripSummary.duration / 3600)) : 0,
        maxGForce: {
          lat: maxG.lat,
          acc: maxG.acc,
          brk: maxG.brk
        },
        path: tripSummary.path,
        telemetryLogs: []
      };

      try {
        await saveTrip(newTrip);
        const updatedTrips = await getTrips();
        setTripsList(updatedTrips);
      } catch (error) {
        console.error('Error saving trip:', error);
      }
    } else {
      alert('Trip stopped: Not enough GPS path markers recorded to compile a trip card.');
    }
  };

  // Settings modification
  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      await saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Delete individual trip record
  const handleDeleteTrip = async (id: string) => {
    try {
      await deleteTrip(id);
      const updatedTrips = await getTrips();
      setTripsList(updatedTrips);
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  // Clear all database files
  const handleClearHistory = async () => {
    try {
      for (const trip of tripsList) {
        await deleteTrip(trip.id);
      }
      setTripsList([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Format active trip display timing
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format active trip distance
  const isImperial = settings.units === 'imperial';
  const displayDistance = isImperial ? gps.distance * 0.621371 : gps.distance;
  const distLabel = isImperial ? 'MI' : 'KM';

  return (
    <>
      {/* Top Header & Simulation Toggle */}
      <header className="sim-header">
        <h1 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '2px' }}>OpenTrip</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSimulationMode ? (
            <span className="sim-badge sim-badge-on">Sim Mode</span>
          ) : (
            <span className="sim-badge sim-badge-off">Real GPS</span>
          )}
          <button 
            className="btn"
            onClick={() => {
              gps.resetTrip();
              setIsSimulationMode(!isSimulationMode);
            }}
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            {isSimulationMode ? 'Disable Sim' : 'Enable Sim'}
          </button>
        </div>
      </header>

      {/* Main Tab Views Content */}
      <main className="app-content">
        
        {activeTab === 'dashboard' && (
          <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 50px - 72px)', overflow: 'hidden' }}>
            
            {/* Google or OpenStreetMap full height route view */}
            <LiveMap 
              currentCoords={gps.currentCoords}
              path={gps.path}
              activeAlerts={alerts.activeAlerts}
              googleMapsApiKey={settings.googleMapsApiKey}
              mapProvider={settings.mapProvider}
              theme={settings.theme}
              height="100%"
            />

            {/* Top Floating HUD: Speedometer (left) & G-Force Meter (right) */}
            <div 
              className="card" 
              style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '12px', 
                right: '12px', 
                zIndex: 10, 
                margin: 0,
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '116px',
                background: 'rgba(22, 22, 28, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Core Speed Gauges widgets in compact mode */}
              <Speedometer 
                speed={gps.currentCoords.speed}
                maxSpeed={gps.maxSpeed}
                avgSpeed={gps.avgSpeed}
                heading={gps.currentCoords.heading}
                units={settings.units}
                isRecording={gps.isRecording}
                compact={true}
              />

              {/* G Force Bubble gauge in compact mode */}
              <GForceMeter 
                gForce={motion.gForce}
                maxG={maxG}
                onCalibrate={motion.calibrate}
                compact={true}
              />
            </div>

            {/* Speed Camera warnings floating above control card */}
            {alerts.closestAlert && (
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: '150px', 
                  left: '12px', 
                  right: '12px', 
                  zIndex: 10,
                  margin: 0 
                }}
              >
                <AlertWidget closestAlert={alerts.closestAlert} />
              </div>
            )}

            {/* Floating Recording Controls Card at the bottom */}
            <div 
              className="card" 
              style={{ 
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                zIndex: 10,
                margin: 0,
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                background: 'rgba(22, 22, 28, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Trip status labels */}
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--gauge-font)', color: '#ffffff' }}>
                    {displayDistance.toFixed(2)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginLeft: '2px' }}>{distLabel}</span>
                  </div>
                </div>
                
                <div style={{ width: '1px', background: 'var(--border-dim)' }} />
                
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Elapsed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--gauge-font)', color: '#ffffff' }}>
                    {formatTimer(gps.duration)}
                  </div>
                </div>
              </div>

              {/* Start/Stop Button trigger */}
              {gps.isRecording ? (
                <button 
                  className="btn btn-danger" 
                  onClick={handleStopTrip}
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '10px' }}
                >
                  <Square size={16} fill="#ffffff" />
                  <span>STOP DRIVE</span>
                </button>
              ) : (
                <button 
                  className="btn btn-success" 
                  onClick={handleStartTrip}
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '10px' }}
                >
                  <Play size={16} fill="#000000" />
                  <span>START DRIVE LOGGING</span>
                </button>
              )}
            </div>

          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ padding: '16px', height: 'calc(100vh - 50px - 72px)', overflowY: 'auto', paddingBottom: '90px' }}>
            <TripHistory 
              trips={tripsList}
              settings={settings}
              onDeleteTrip={handleDeleteTrip}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '16px', height: 'calc(100vh - 50px - 72px)', overflowY: 'auto', paddingBottom: '90px' }}>
            <Settings 
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onCalibrate={motion.calibrate}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

      </main>

      {/* Bottom Floating Navigation Tabs Bar */}
      <nav className="bottom-nav">
        <div 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Gauge size={22} />
          <span>Dashboard</span>
        </div>
        <div 
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={22} />
          <span>History</span>
        </div>
        <div 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={22} />
          <span>Settings</span>
        </div>
      </nav>
    </>
  );
}

export default App;
