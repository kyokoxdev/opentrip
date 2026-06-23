import React from 'react';
import { AppSettings } from '../types';
import { Settings as SettingsIcon, Save, RefreshCw, Eye, EyeOff, ShieldAlert, Trash2 } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onCalibrate: () => void;
  onClearHistory: () => Promise<void>;
}

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
  const [showKey, setShowKey] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState('');

  const handleSave = () => {
    onSaveSettings({
      units,
      mapProvider,
      theme,
      googleMapsApiKey: apiKey,
      soundAlerts: sound,
      cameraRadius: Number(radius),
      gForceCalibratedOffset: settings.gForceCalibratedOffset
    });
    setStatusMsg('Settings Saved Successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleResetData = async () => {
    if (window.confirm('Are you absolutely sure you want to clear your entire trip history? This action is irreversible.')) {
      await onClearHistory();
      setStatusMsg('All Trip History Cleared!');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

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
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <div>
            <label className="form-label" style={{ margin: 0 }}>Sound Alerts</label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audio warning beeps on camera approach</span>
          </div>
          <input
            type="checkbox"
            checked={sound}
            onChange={(e) => setSound(e.target.checked)}
            style={{
              width: '44px',
              height: '24px',
              cursor: 'pointer',
              accentColor: 'var(--neon-cyan)'
            }}
          />
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
        <div className="form-group" style={{ position: 'relative' }}>
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
          onClick={handleSave}
          style={{ width: '100%', marginTop: '8px', padding: '12px' }}
        >
          <Save size={18} />
          <span>Save Changes</span>
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
