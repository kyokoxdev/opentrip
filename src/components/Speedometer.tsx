import React from 'react';

interface SpeedometerProps {
  speed: number; // in km/h
  maxSpeed: number;
  avgSpeed: number;
  heading: number | null;
  units: 'metric' | 'imperial';
  isRecording: boolean;
  compact?: boolean;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  maxSpeed,
  avgSpeed,
  heading,
  units,
  isRecording,
  compact
}) => {
  const isImperial = units === 'imperial';
  const displaySpeed = isImperial ? speed * 0.621371 : speed;
  const displayMax = isImperial ? maxSpeed * 0.621371 : maxSpeed;
  const displayAvg = isImperial ? avgSpeed * 0.621371 : avgSpeed;

  const roundedSpeed = Math.round(displaySpeed);
  const roundedMax = Math.round(displayMax);
  const roundedAvg = Math.round(displayAvg);
  const speedUnit = isImperial ? 'MPH' : 'KM/H';
  
  // Speed Dial arc scaling
  const maxScaleSpeed = isImperial ? 120 : 180;
  const speedPercent = Math.min(100, (roundedSpeed / maxScaleSpeed) * 100);

  if (compact) {
    const compactRadius = 40;
    const compCircumference = 2 * Math.PI * compactRadius;
    const compArcLength = compCircumference * 0.75;
    const compDashoffset = compArcLength - (speedPercent / 100) * compArcLength;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Compact Speedometer Dial */}
        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg style={{ width: '100px', height: '100px' }}>
            <circle
              cx="50"
              cy="50"
              r={compactRadius}
              fill="none"
              stroke="var(--border-dim)"
              strokeWidth="4"
              strokeDasharray={`${compArcLength} ${compCircumference}`}
              strokeLinecap="round"
              transform="rotate(135 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r={compactRadius}
              fill="none"
              stroke="var(--neon-cyan)"
              strokeWidth="4"
              strokeDasharray={`${compArcLength} ${compCircumference}`}
              strokeDashoffset={compDashoffset}
              strokeLinecap="round"
              transform="rotate(135 50 50)"
              style={{
                transition: 'stroke-dashoffset 0.15s ease-out',
                filter: 'drop-shadow(0 0 4px var(--neon-cyan))'
              }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--gauge-font)', fontSize: '2.5rem', fontWeight: 700, lineHeight: '0.9', color: 'var(--text-primary)' }}>
              {roundedSpeed}
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
              {speedUnit}
            </span>
          </div>
        </div>

        {/* Floating statistics column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <div>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Average</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--gauge-font)' }}>
              {roundedAvg} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{speedUnit.toLowerCase()}</span>
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Maximum</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neon-orange)', fontFamily: 'var(--gauge-font)' }}>
              {roundedMax} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{speedUnit.toLowerCase()}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate dial parameters
  const radius = 85;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 270 degrees (3/4 of a circle)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (speedPercent / 100) * arcLength;

  const getCompassDirection = (deg: number | null): string => {
    if (deg === null) return 'N';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  // Generate tick marks around the gauge
  const renderTicks = () => {
    const ticks = [];
    const totalTicks = 21; // every 5%
    for (let i = 0; i < totalTicks; i++) {
      // Rotation angle from -135deg to +135deg (total 270deg)
      const angle = -135 + (i / (totalTicks - 1)) * 270;
      const isMajor = i % 5 === 0;
      ticks.push(
        <line
          key={i}
          x1="100"
          y1="10"
          x2="100"
          y2={isMajor ? "20" : "15"}
          stroke={isMajor ? "var(--tick-major)" : "var(--tick-minor)"}
          strokeWidth={isMajor ? "2" : "1"}
          transform={`rotate(${angle} 100 100)`}
        />
      );
    }
    return ticks;
  };

  return (
    <div 
      className="card card-glowing-cyan" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '24px 16px',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-card-gradient-end) 100%)'
      }}
    >
      {/* Top Banner Indicator Row */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isRecording ? 'var(--neon-red)' : 'var(--text-muted)',
              boxShadow: isRecording ? 'var(--glow-red)' : 'none',
              display: 'inline-block'
            }}
          />
          <span style={{ color: isRecording ? 'var(--neon-red)' : 'var(--text-secondary)' }}>
            {isRecording ? 'RECORDING TELEMETRY' : 'GPS STANDBY'}
          </span>
        </div>

        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--neon-cyan)',
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
            border: '1px solid rgba(0, 229, 255, 0.1)'
          }}
        >
          <span>HEADING {getCompassDirection(heading)}</span>
          {heading !== null && <span style={{ color: 'var(--text-muted)' }}>({heading}°)</span>}
        </div>
      </div>

      {/* Speedometer Circle Dial */}
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg style={{ width: '200px', height: '200px' }}>
          {/* Tick Marks Layer */}
          {renderTicks()}
          
          {/* Dial Arc Background */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-dim)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
          />
          {/* Active Dial Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--neon-cyan)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
            style={{
              transition: 'stroke-dashoffset 0.15s ease-out',
              filter: 'drop-shadow(0 0 6px var(--neon-cyan))'
            }}
          />
        </svg>

        {/* Speed text reading center */}
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span 
            style={{
              fontFamily: 'var(--gauge-font)',
              fontSize: '5rem',
              fontWeight: 700,
              lineHeight: '0.9',
              color: 'var(--text-primary)',
              textShadow: '0 0 10px rgba(0, 229, 255, 0.2)'
            }}
          >
            {roundedSpeed}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '2px', marginTop: '4px' }}>
            {speedUnit}
          </span>
        </div>
      </div>

      {/* Max & Average Speeds footer columns (TripRank Style) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
          marginTop: '16px',
          borderTop: '1px solid var(--border-dim)',
          paddingTop: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ borderRight: '1px solid var(--border-dim)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Average Speed
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {roundedAvg} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{speedUnit.toLowerCase()}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Maximum Speed
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--neon-orange)', marginTop: '2px' }}>
            {roundedMax} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{speedUnit.toLowerCase()}</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};
