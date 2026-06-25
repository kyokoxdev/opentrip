import React from 'react';
import { AppSettings } from '../types';
import { Settings as SettingsIcon, Save, RefreshCw, Eye, EyeOff, ShieldAlert, Trash2, Sliders } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onCalibrate: () => void;
  onClearHistory: () => Promise<void>;
}

const getGlowClass = (color: string): string => {
  if (color.includes('green')) return 'card-glowing-green';
  if (color.includes('orange')) return 'card-glowing-orange';
  if (color.includes('red')) return 'card-glowing-red';
  if (color.includes('purple')) return 'card-glowing-purple';
  if (color.includes('white')) return 'card-glowing-white';
  return 'card-glowing-cyan';
};

const getTextOnAccent = (color: string): string => {
  const isLight = document.getElementById('root')?.classList.contains('light-theme');
  if (isLight) {
    return '#ffffff';
  } else {
    if (color.includes('purple')) return '#ffffff';
    return '#000000';
  }
};

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onCalibrate,
  onClearHistory
}) => {
  const [apiKey, setApiKey] = React.useState(settings.googleMapsApiKey);
  const [units, setUnits] = React.useState(settings.units);
  const [mapProvider, setMapProvider] = React.useState(settings.mapProvider);
  const [theme, setTheme] = React.useState(settings.theme);
  const [sound, setSound] = React.useState(settings.soundAlerts);
  const [radius, setRadius] = React.useState(settings.cameraRadius);
  
  // Cockpit/Dashboard layout customization states
  const [showGForceMeter, setShowGForceMeter] = React.useState(settings.showGForceMeter !== false);
  const [hudPosition, setHudPosition] = React.useState(settings.hudPosition || 'bottom');
  const [speedometerStyle, setSpeedometerStyle] = React.useState(settings.speedometerStyle || 'dial');
  const [showCompass, setShowCompass] = React.useState(settings.showCompass !== false);
  const [showMaxAvgSpeed, setShowMaxAvgSpeed] = React.useState(settings.showMaxAvgSpeed !== false);
  const [gaugeColor, setGaugeColor] = React.useState(settings.gaugeColor || 'var(--neon-cyan)');
  const [gaugesOrder, setGaugesOrder] = React.useState(settings.gaugesOrder || 'speed-first');
  const [gaugeSize, setGaugeSize] = React.useState(settings.gaugeSize || 'standard');

  const [showKey, setShowKey] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState('');

  const handleSaveAppSettings = () => {
    const keyChanged = apiKey !== settings.googleMapsApiKey;
    onSaveSettings({
      ...settings,
      units,
      mapProvider,
      theme,
      googleMapsApiKey: apiKey,
      soundAlerts: sound,
      cameraRadius: Number(radius)
    });
    
    if (keyChanged) {
      setStatusMsg('API Key Updated. Reloading application...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setStatusMsg('App Settings Saved!');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleSaveDashboardSettings = () => {
    onSaveSettings({
      ...settings,
      showGForceMeter,
      hudPosition,
      speedometerStyle,
      showCompass,
      showMaxAvgSpeed,
      gaugeColor,
      gaugesOrder,
      gaugeSize
    });
    setStatusMsg('Dashboard Layout Saved!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleResetData = async () => {
    if (window.confirm('Are you absolutely sure you want to clear your entire trip history? This action is irreversible.')) {
      await onClearHistory();
      setStatusMsg('All Trip History Cleared!');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const colors = [
    { name: 'Cyan', value: 'var(--neon-cyan)' },
    { name: 'Green', value: 'var(--neon-green)' },
    { name: 'Orange', value: 'var(--neon-orange)' },
    { name: 'Red', value: 'var(--neon-red)' },
    { name: 'Purple', value: 'var(--neon-purple)' },
    { name: 'White', value: 'var(--neon-white)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <SettingsIcon size={24} style={{ color: 'var(--neon-cyan)' }} />
        <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', margin: 0 }}>App Settings</h2>
      </div>

      {/* Main settings form */}
      <div className="card">
        {/* Unit preference */}
        <div className="form-group">
          <label className="form-label">Measurement Units</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${units === 'metric' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '10px' }}
              onClick={() => setUnits('metric')}
            >
              Metric (km/h, km)
            </button>
            <button
              className={`btn ${units === 'imperial' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '10px' }}
              onClick={() => setUnits('imperial')}
            >
              Imperial (mph, miles)
            </button>
          </div>
        </div>

        {/* Map Provider preference */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Map Engine Provider</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${mapProvider === 'osm' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '10px' }}
              onClick={() => setMapProvider('osm')}
            >
              OpenStreetMap (Free)
            </button>
            <button
              className={`btn ${mapProvider === 'google' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '10px' }}
              onClick={() => setMapProvider('google')}
            >
              Google Maps (Paid API)
            </button>
          </div>
        </div>

        {/* Theme preference toggle */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-dim)', paddingTop: '16px' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Light Theme Mode</label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Enable clean slate daylight theme instead of dark HUD glow
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Audio Toggles */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', borderTop: '1px solid var(--border-dim)', paddingTop: '16px' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Sound Alerts</label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audio warning beeps on camera approach</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => setSound(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Warning Radius */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Camera Alert Distance</span>
            <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--mono-font)' }}>{radius} meters</span>
          </label>
          <input
            type="range"
            min="200"
            max="1000"
            step="50"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: 'var(--neon-cyan)',
              background: 'var(--border-dim)'
            }}
          />
        </div>

        {/* Google Maps API Key input */}
        <div className="form-group" style={{ position: 'relative', marginBottom: '16px' }}>
          <label className="form-label">Google Maps API Key</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter API Key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Needed for Google Maps layout view. You can retrieve an API key from Google Cloud Console.
          </span>
        </div>

        {/* Save button */}
        <button
          className="btn btn-primary"
          onClick={handleSaveAppSettings}
          style={{ width: '100%', marginTop: '8px', padding: '12px' }}
        >
          <Save size={18} />
          <span>Save App Settings</span>
        </button>
      </div>

      {/* Cockpit Customization Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
        <Sliders size={24} style={{ color: gaugeColor }} />
        <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', margin: 0 }}>Cockpit Customization</h2>
      </div>

      {/* Cockpit Customization Card */}
      <div className={`card ${getGlowClass(gaugeColor)}`}>
        {/* Speedometer Accent Color */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Speedometer Accent Color</label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            {colors.map((c) => {
              const isSelected = gaugeColor === c.value;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setGaugeColor(c.value)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    border: isSelected ? '2px solid var(--text-primary)' : '2px solid transparent',
                    boxShadow: isSelected ? `0 0 12px ${c.value}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  title={c.name}
                >
                  {isSelected && (
                    <span style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--bg-card)', 
                      display: 'inline-block' 
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Speed Number Size */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Speed Number Size</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '280px' }}>
              Adjust scale of the speed text digits
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
            <button
              type="button"
              onClick={() => setGaugeSize('standard')}
              style={{
                background: gaugeSize === 'standard' ? 'var(--bg-card)' : 'transparent',
                color: gaugeSize === 'standard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setGaugeSize('large')}
              style={{
                background: gaugeSize === 'large' ? 'var(--bg-card)' : 'transparent',
                color: gaugeSize === 'large' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Large
            </button>
          </div>
        </div>

        {/* Gauges Order placement */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Gauges Layout Order</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '280px' }}>
              Determine horizontal sequence of cockpit gauges
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
            <button
              type="button"
              onClick={() => setGaugesOrder('speed-first')}
              style={{
                background: gaugesOrder === 'speed-first' ? 'var(--bg-card)' : 'transparent',
                color: gaugesOrder === 'speed-first' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Speed Left
            </button>
            <button
              type="button"
              onClick={() => setGaugesOrder('gforce-first')}
              style={{
                background: gaugesOrder === 'gforce-first' ? 'var(--bg-card)' : 'transparent',
                color: gaugesOrder === 'gforce-first' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              G-Force Left
            </button>
          </div>
        </div>

        {/* G-Force toggle */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>G-Force Bubble Gauge</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '280px' }}>
              Show real-time G-force forces (accelerometer meter) on cockpit card
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={showGForceMeter}
              onChange={(e) => setShowGForceMeter(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* HUD Position selection buttons */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Gauges Placement</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '280px' }}>
              Choose where speedometer & G-Force gauges are rendered
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
            <button
              type="button"
              onClick={() => setHudPosition('bottom')}
              style={{
                background: hudPosition === 'bottom' ? 'var(--bg-card)' : 'transparent',
                color: hudPosition === 'bottom' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Bottom
            </button>
            <button
              type="button"
              onClick={() => setHudPosition('top')}
              style={{
                background: hudPosition === 'top' ? 'var(--bg-card)' : 'transparent',
                color: hudPosition === 'top' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Top HUD
            </button>
          </div>
        </div>

        {/* Speedometer Theme style dial/digital selection */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Speedometer Theme</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '280px' }}>
              Visual rendering design of the speedometer dial
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
            <button
              type="button"
              onClick={() => setSpeedometerStyle('dial')}
              style={{
                background: speedometerStyle === 'dial' ? 'var(--bg-card)' : 'transparent',
                color: speedometerStyle === 'dial' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Dial Arc
            </button>
            <button
              type="button"
              onClick={() => setSpeedometerStyle('digital')}
              style={{
                background: speedometerStyle === 'digital' ? 'var(--bg-card)' : 'transparent',
                color: speedometerStyle === 'digital' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Digital
            </button>
          </div>
        </div>

        {/* Compass Heading toggler */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Compass Direction</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '320px' }}>Show heading letters (N, NE, E, etc.) inside speed gauge</span>
          </div>
          <input
            type="checkbox"
            checked={showCompass}
            onChange={(e) => setShowCompass(e.target.checked)}
            style={{
              width: '40px',
              height: '22px',
              cursor: 'pointer',
              accentColor: gaugeColor
            }}
          />
        </div>

        {/* Max/Avg speed column toggler */}
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Max & Avg Speeds</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '320px' }}>Show trip average and max speed stats next to gauge</span>
          </div>
          <input
            type="checkbox"
            checked={showMaxAvgSpeed}
            onChange={(e) => setShowMaxAvgSpeed(e.target.checked)}
            style={{
              width: '40px',
              height: '22px',
              cursor: 'pointer',
              accentColor: gaugeColor
            }}
          />
        </div>

        {/* Save button for Cockpit Configuration */}
        <button
          className="btn btn-primary"
          onClick={handleSaveDashboardSettings}
          style={{ width: '100%', marginTop: '16px', padding: '12px', background: gaugeColor, borderColor: gaugeColor, color: getTextOnAccent(gaugeColor) }}
        >
          <Save size={18} />
          <span>Save Dashboard Layout</span>
        </button>
      </div>

      {/* Sensor Calibration widget card */}
      <div className="card card-glowing-green">
        <h3 style={{ textTransform: 'uppercase', color: 'var(--neon-green)', fontSize: '0.95rem', letterSpacing: '1px', marginBottom: '8px' }}>
          Sensor Calibration Panel
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Mount your phone securely in your car holder, place it flat/vertical as you would drive, and press Calibrate to zero out gravity readings.
        </p>
        <button
          className="btn btn-success"
          onClick={onCalibrate}
          style={{ width: '100%' }}
        >
          <RefreshCw size={16} />
          <span>Calibrate Accelerometer</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card card-glowing-red" style={{ borderColor: 'rgba(255,0,85,0.1)' }}>
        <h3 style={{ textTransform: 'uppercase', color: 'var(--neon-red)', fontSize: '0.95rem', letterSpacing: '1px', marginBottom: '8px' }}>
          Danger Zone
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Delete all recorded telemetry profiles and paths. This resets local IndexedDB tables.
        </p>
        <button
          className="btn btn-danger"
          onClick={handleResetData}
          style={{ width: '100%' }}
        >
          <Trash2 size={16} />
          <span>Reset All Trip History</span>
        </button>
      </div>

      {/* Status messages popup */}
      {statusMsg && (
        <div 
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 229, 255, 0.95)',
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: 'var(--glow-cyan)',
            zIndex: 1000,
            animation: 'pulse-orange 1s infinite'
          }}
        >
          {statusMsg}
        </div>
      )}

    </div>
  );
};
