import { useState, useEffect, useRef } from 'react';
import { AppSettings, Trip, TelemetryLog, UserProfile } from './types';
import { initDB, getTrips, saveTrip, deleteTrip, getSettings, saveSettings, saveProfile, getProfiles } from './services/db';
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
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { ProfileLogin } from './components/ProfileLogin';
import { Ranks } from './components/Ranks';

import { Gauge, History, Settings as SettingsIcon, Play, Square, Sun, Moon, Pause, User, Trophy } from 'lucide-react';

const isActualMobileDevice = typeof window !== 'undefined' && 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ranks' | 'profile' | 'settings'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    units: 'metric',
    mapProvider: 'osm',
    theme: 'dark',
    googleMapsApiKey: '',
    soundAlerts: true,
    cameraRadius: 500,
    gForceCalibratedOffset: { x: 0, y: 0 },
    userProfile: null,
    showGForceMeter: true,
    hudPosition: 'bottom',
    speedometerStyle: 'dial',
    showCompass: true,
    showMaxAvgSpeed: true,
    gaugeColor: 'var(--neon-cyan)',
    gaugesOrder: 'speed-first',
    gaugeSize: 'standard'
  });

  // G-Force peaks state for active recording
  const [maxG, setMaxG] = useState({ lat: 0, acc: 0, brk: 0 });

  // Accumulate telemetry logs during active drive
  const telemetryLogsRef = useRef<TelemetryLog[]>([]);

  // Initialize DB and load settings/trips on startup
  useEffect(() => {
    async function loadData() {
      try {
        await initDB();
        const loadedSettings = await getSettings();
        if (loadedSettings.showGForceMeter === undefined) {
          loadedSettings.showGForceMeter = true;
        }
        if (loadedSettings.hudPosition === undefined) {
          loadedSettings.hudPosition = 'bottom';
        }
        if (loadedSettings.speedometerStyle === undefined) {
          loadedSettings.speedometerStyle = 'dial';
        }
        if (loadedSettings.showCompass === undefined) {
          loadedSettings.showCompass = true;
        }
        if (loadedSettings.showMaxAvgSpeed === undefined) {
          loadedSettings.showMaxAvgSpeed = true;
        }
        if (loadedSettings.gaugeColor === undefined) {
          loadedSettings.gaugeColor = 'var(--neon-cyan)';
        }
        if (loadedSettings.gaugesOrder === undefined) {
          loadedSettings.gaugesOrder = 'speed-first';
        }
        if (loadedSettings.gaugeSize === undefined) {
          loadedSettings.gaugeSize = 'standard';
        }
        const loadedTrips = await getTrips();
        
        // Auto-migrate userProfile if it is present but in legacy format
        if (loadedSettings.userProfile && !loadedSettings.userProfile.vehicles) {
          const legacy = loadedSettings.userProfile;
          const defaultId = 'legacy-vehicle-id';
          const convertedVehicle = {
            id: defaultId,
            name: legacy.vehicleDetail?.name || 'My Ride',
            type: legacy.vehicleType || 'car',
            specificVehicle: legacy.specificVehicle || 'sedan',
            manufacturer: legacy.vehicleDetail?.manufacturer || 'Unknown',
            modelYear: legacy.vehicleDetail?.modelYear || new Date().getFullYear().toString(),
            fuelType: legacy.vehicleDetail?.fuelType || 'electric',
            imageUrl: legacy.vehicleDetail?.imageUrl || '',
            licensePlate: legacy.vehicleDetail?.licensePlate || 'N/A',
            purchaseDate: legacy.vehicleDetail?.purchaseDate,
            manufactureDate: legacy.vehicleDetail?.manufactureDate,
            engineDisplacement: legacy.vehicleDetail?.engineDisplacement,
            notes: legacy.vehicleDetail?.notes,
            images: legacy.vehicleDetail?.images || []
          };
          
          const migratedProfile = {
            name: legacy.name,
            avatarUrl: legacy.avatarUrl,
            createdAt: legacy.createdAt || new Date().toISOString(),
            vehicles: [convertedVehicle],
            activeVehicleId: defaultId
          };
          
          const migratedSettings = {
            ...loadedSettings,
            userProfile: migratedProfile
          };
          
          await saveSettings(migratedSettings);
          setSettings(migratedSettings);
        } else {
          setSettings(loadedSettings);
        }
        
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

  const isSimActive = isSimulationMode && !isActualMobileDevice;

  // GPS telemetrics hook
  const gps = useGPS(isSimActive);

  // Accelerometer telemetry hook
  const motion = useDeviceMotion(
    isSimActive,
    gps.currentCoords.speed,
    gps.currentCoords.heading ?? 0
  );

  // Road camera alerts hook
  const alerts = useCameraAlerts(gps.currentCoords, gps.isRecording, settings);

  // Monitor and accumulate maximum G-forces during recording
  useEffect(() => {
    if (gps.isRecording && !gps.isPaused) {
      setMaxG(prev => {
        const lat = Math.max(prev.lat, Math.abs(motion.gForce.x));
        const acc = Math.max(prev.acc, motion.gForce.y > 0 ? motion.gForce.y : 0);
        const brk = Math.max(prev.brk, motion.gForce.y < 0 ? Math.abs(motion.gForce.y) : 0);
        return { lat, acc, brk };
      });
    }
  }, [motion.gForce, gps.isRecording, gps.isPaused]);

  // Record telemetry logs at each GPS update while recording
  useEffect(() => {
    if (gps.isRecording && !gps.isPaused) {
      telemetryLogsRef.current.push({
        timestamp: gps.currentCoords.timestamp,
        speed: gps.currentCoords.speed,
        gForce: {
          x: motion.gForce.x,
          y: motion.gForce.y
        }
      });
    }
  }, [gps.currentCoords, gps.isRecording, gps.isPaused, motion.gForce]);

  // Start drive logging
  const handleStartTrip = () => {
    setMaxG({ lat: 0, acc: 0, brk: 0 });
    telemetryLogsRef.current = [];
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
        telemetryLogs: [...telemetryLogsRef.current],
        vehicleId: settings.userProfile?.activeVehicleId || undefined,
        driverName: settings.userProfile?.name || undefined
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

  // Update profile data in settings and profile store
  const handleUpdateProfile = async (profileData: UserProfile) => {
    try {
      await saveProfile(profileData);
    } catch (err) {
      console.error('Error saving profile to store:', err);
    }
    const newSettings: AppSettings = {
      ...settings,
      userProfile: profileData
    };
    await handleSaveSettings(newSettings);
    setShowOnboarding(false);
  };

  const handleLogin = async (profile: UserProfile) => {
    const newSettings: AppSettings = {
      ...settings,
      userProfile: profile
    };
    await handleSaveSettings(newSettings);
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    // If logging out, make sure any recording is stopped/reset
    gps.resetTrip();
    const newSettings: AppSettings = {
      ...settings,
      userProfile: null
    };
    await handleSaveSettings(newSettings);
    setActiveTab('dashboard');
    setShowOnboarding(false);
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

  // Clear all database files for active profile
  const handleClearHistory = async () => {
    try {
      for (const trip of filteredTripsList) {
        await deleteTrip(trip.id);
      }
      const updatedTrips = await getTrips();
      setTripsList(updatedTrips);
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

  // Filter trips dynamically per driver profile
  const filteredTripsList = tripsList.filter(t => !t.driverName || t.driverName === settings.userProfile?.name);

  // Format active trip distance
  const isImperial = settings.units === 'imperial';
  const displayDistance = isImperial ? gps.distance * 0.621371 : gps.distance;
  const distLabel = isImperial ? 'MI' : 'KM';

  if (settings.userProfile === null) {
    if (showOnboarding) {
      return (
        <Onboarding 
          onComplete={handleUpdateProfile} 
          onCancel={() => setShowOnboarding(false)} 
        />
      );
    }
    return (
      <ProfileLogin 
        onLogin={handleLogin} 
        onCreateNew={() => setShowOnboarding(true)} 
      />
    );
  }

  return (
    <>
      {/* Top Header & Simulation Toggle */}
      <header className="sim-header">
        <h1 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '2px' }}>OpenTrip</h1>
        {!isActualMobileDevice && (
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
        )}
      </header>

      {/* Main Tab Views Content */}
      <main className="app-content" style={{ position: 'relative', overflow: 'hidden' }}>
        
        <div 
          className={`tab-pane ${activeTab === 'dashboard' ? 'active' : ''}`}
          style={{ overflow: 'hidden', display: activeTab === 'dashboard' ? 'block' : 'none' }}
        >
          {/* Google or OpenStreetMap full height route view */}
          <LiveMap 
            currentCoords={gps.currentCoords}
            path={gps.path}
            activeAlerts={alerts.activeAlerts}
            googleMapsApiKey={settings.googleMapsApiKey}
            mapProvider={settings.mapProvider}
            theme={settings.theme}
            height="100%"
            hudPosition={settings.hudPosition}
            gaugeSize={settings.gaugeSize}
          />

          {/* Top Floating Glass HUD (Conditional) */}
          {settings.hudPosition === 'top' && (
            <div 
              className="card" 
              style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 24px)',
                maxWidth: settings.gaugeSize === 'large' ? '700px' : '550px',
                zIndex: 10, 
                margin: 0,
                padding: settings.gaugeSize === 'large' ? '12px 24px' : '8px 16px',
                display: 'flex',
                flexDirection: settings.gaugesOrder === 'gforce-first' ? 'row-reverse' : 'row',
                justifyContent: settings.showGForceMeter !== false ? 'space-between' : 'center',
                alignItems: 'center',
                height: settings.gaugeSize === 'large' ? '136px' : '116px',
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-glass)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
              }}
            >
              <Speedometer 
                speed={gps.currentCoords.speed}
                maxSpeed={gps.maxSpeed}
                avgSpeed={gps.avgSpeed}
                heading={gps.currentCoords.heading}
                units={settings.units}
                isRecording={gps.isRecording}
                compact={true}
                customStyle={settings.speedometerStyle}
                showCompass={settings.showCompass}
                showMaxAvgSpeed={settings.showMaxAvgSpeed}
                gaugeColor={settings.gaugeColor}
                gaugeSize={settings.gaugeSize}
              />

              {settings.showGForceMeter !== false && (
                <GForceMeter 
                  gForce={motion.gForce}
                  maxG={maxG}
                  onCalibrate={motion.calibrate}
                  compact={true}
                  gaugeSize={settings.gaugeSize}
                />
              )}
            </div>
          )}

          {/* Speed Camera warnings floating above integrated controls card */}
          {alerts.closestAlert && (
            <div 
              style={{ 
                position: 'absolute', 
                bottom: settings.hudPosition === 'top' ? '150px' : '260px', 
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 24px)',
                maxWidth: settings.gaugeSize === 'large' ? '700px' : '550px',
                zIndex: 10,
                margin: 0,
                transition: 'bottom 0.3s ease'
              }}
            >
              <AlertWidget closestAlert={alerts.closestAlert} />
            </div>
          )}

          {/* Floating Integrated Dashboard & Recording Controls Card at the bottom */}
          <div 
            className="card" 
            style={{ 
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 24px)',
              maxWidth: settings.gaugeSize === 'large' ? '700px' : '550px',
              zIndex: 10,
              margin: 0,
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              background: 'var(--bg-card-glass)',
              border: '1px solid var(--border-glass)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Core Speed G-Force Instrument Cluster Row (Integrated Mode) */}
            {settings.hudPosition === 'bottom' && (
              <div style={{ 
                display: 'flex', 
                flexDirection: settings.gaugesOrder === 'gforce-first' ? 'row-reverse' : 'row',
                justifyContent: settings.showGForceMeter !== false ? 'space-between' : 'center', 
                alignItems: 'center', 
                paddingBottom: '8px', 
                borderBottom: '1px solid var(--border-dim)' 
              }}>
                <Speedometer 
                  speed={gps.currentCoords.speed}
                  maxSpeed={gps.maxSpeed}
                  avgSpeed={gps.avgSpeed}
                  heading={gps.currentCoords.heading}
                  units={settings.units}
                  isRecording={gps.isRecording}
                  compact={true}
                  customStyle={settings.speedometerStyle}
                  showCompass={settings.showCompass}
                  showMaxAvgSpeed={settings.showMaxAvgSpeed}
                  gaugeColor={settings.gaugeColor}
                  gaugeSize={settings.gaugeSize}
                />

                {settings.showGForceMeter !== false && (
                  <GForceMeter 
                    gForce={motion.gForce}
                    maxG={maxG}
                    onCalibrate={motion.calibrate}
                    compact={true}
                    gaugeSize={settings.gaugeSize}
                  />
                )}
              </div>
            )}
            {/* Trip status labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)' }}>
                  {displayDistance.toFixed(2)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginLeft: '2px' }}>{distLabel}</span>
                </div>
              </div>
              
              <div style={{ width: '1px', background: 'var(--border-dim)' }} />
              
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Elapsed</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)' }}>
                  {formatTimer(gps.duration)}
                </div>
              </div>
            </div>

            {/* Start/Stop/Pause Button trigger */}
            {gps.isRecording ? (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                {gps.isPaused ? (
                  <button 
                    className="btn btn-success" 
                    onClick={gps.resumeTrip}
                    style={{ flex: 1, padding: '10px', fontSize: '0.9rem', borderRadius: '10px' }}
                  >
                    <Play size={16} fill="#000000" />
                    <span>RESUME</span>
                  </button>
                ) : (
                  <button 
                    className="btn" 
                    onClick={gps.pauseTrip}
                    style={{ flex: 1, padding: '10px', fontSize: '0.9rem', borderRadius: '10px', background: 'var(--neon-orange)', borderColor: 'var(--neon-orange)', color: '#000000' }}
                  >
                    <Pause size={16} fill="#000000" stroke="#000000" />
                    <span>PAUSE</span>
                  </button>
                )}
                <button 
                  className="btn btn-danger" 
                  onClick={handleStopTrip}
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', borderRadius: '10px' }}
                >
                  <Square size={16} fill="#ffffff" />
                  <span>STOP</span>
                </button>
              </div>
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

        <div 
          className={`tab-pane ${activeTab === 'history' ? 'active' : ''}`}
          style={{ overflowY: 'auto', padding: '16px', display: activeTab === 'history' ? 'block' : 'none' }}
        >
          <TripHistory 
            trips={filteredTripsList}
            settings={settings}
            onDeleteTrip={handleDeleteTrip}
          />
        </div>

        <div 
          className={`tab-pane ${activeTab === 'ranks' ? 'active' : ''}`}
          style={{ overflowY: 'auto', padding: '16px', display: activeTab === 'ranks' ? 'block' : 'none' }}
        >
          {settings.userProfile && (
            <Ranks 
              tripsList={filteredTripsList}
              profile={settings.userProfile}
            />
          )}
        </div>

        <div 
          className={`tab-pane ${activeTab === 'settings' ? 'active' : ''}`}
          style={{ overflowY: 'auto', padding: '16px', display: activeTab === 'settings' ? 'block' : 'none' }}
        >
          <Settings 
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onCalibrate={motion.calibrate}
            onClearHistory={handleClearHistory}
          />
        </div>

        <div 
          className={`tab-pane ${activeTab === 'profile' ? 'active' : ''}`}
          style={{ overflowY: 'auto', padding: '16px', display: activeTab === 'profile' ? 'block' : 'none' }}
        >
          <Profile 
            trips={filteredTripsList}
            settings={settings}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        </div>

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
          className={`nav-tab ${activeTab === 'ranks' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranks')}
        >
          <Trophy size={22} />
          <span>Ranks</span>
        </div>
        <div 
          className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={22} />
          <span>Profile</span>
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
