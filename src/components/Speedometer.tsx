import React from 'react';

interface SpeedometerProps {
  speed: number; // in km/h
  heading: number | null;
  units: 'metric' | 'imperial';
  isRecording: boolean;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  heading,
  units,
  isRecording
}) => {
  // Convert speed if imperial
  const displaySpeed = units === 'imperial' ? speed * 0.621371 : speed;
  const roundedSpeed = Math.round(displaySpeed);
  const speedUnit = units === 'imperial' ? 'MPH' : 'KM/H';
  
  // Calculate dial parameters
  const maxDialSpeed = units === 'imperial' ? 120 : 180; // scale limit
  const speedPercent = Math.min(100, (roundedSpeed / maxDialSpeed) * 100);
  
  // Circle parameters for dial SVG
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // We want a semi-circle or 3/4 circle. Let's do a 3/4 circle.
  const strokeDashoffset = circumference - (speedPercent / 100) * circumference * 0.75;
  const dashArrayValue = `${circumference * 0.75} ${circumference}`;

  // Compass heading lookup
  const getCompassDirection = (deg: number | null): string => {
    if (deg === null) return 'N';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <div className="card card-glowing-cyan" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      
      {/* Recording status dot */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: isRecording ? 'var(--neon-red)' : 'var(--text-muted)'
        }}
      >
        <span 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isRecording ? 'var(--neon-red)' : 'rgba(255,255,255,0.2)',
            boxShadow: isRecording ? 'var(--glow-red)' : 'none',
            display: 'inline-block'
          }}
        />
        {isRecording ? 'LIVE REC' : 'READY'}
      </div>

      {/* Compass Badge */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--neon-cyan)',
          backgroundColor: 'rgba(0, 229, 255, 0.08)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          padding: '2px 8px',
          borderRadius: '20px'
        }}
      >
        <span>COMPASS: {getCompassDirection(heading)}</span>
        {heading !== null && <span style={{ color: 'var(--text-secondary)' }}>({heading}°)</span>}
      </div>

      {/* Speed Dial SVG */}
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
        <svg style={{ transform: 'rotate(-225deg)', width: '200px', height: '200px' }}>
          {/* Dial Background Ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-dim)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Dial Active/Glowing Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--neon-cyan)"
            strokeWidth={strokeWidth}
            strokeDasharray={dashArrayValue}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.15s ease-out',
              filter: 'drop-shadow(0 0 4px var(--neon-cyan))'
            }}
          />
        </svg>

        {/* Speed Number Display Container */}
        <div 
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span 
            style={{
              fontFamily: 'var(--gauge-font)',
              fontSize: '4.8rem',
              fontWeight: 700,
              lineHeight: '1',
              color: '#ffffff',
              textShadow: '0 0 15px rgba(0, 229, 255, 0.3)'
            }}
          >
            {roundedSpeed}
          </span>
          <span 
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginTop: '4px'
            }}
          >
            {speedUnit}
          </span>
        </div>
      </div>
    </div>
  );
};
