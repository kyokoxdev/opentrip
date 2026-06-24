import React from 'react';

const getCompassDirection = (deg: number | null): string => {
  if (deg === null) return 'N';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
};

interface SpeedometerProps {
  speed: number; // in km/h
  maxSpeed: number;
  avgSpeed: number;
  heading: number | null;
  units: 'metric' | 'imperial';
  isRecording: boolean;
  compact?: boolean;
  customStyle?: 'dial' | 'digital';
  showCompass?: boolean;
  showMaxAvgSpeed?: boolean;
  gaugeColor?: string;
  gaugeSize?: 'standard' | 'large';
}

const getGlowStyles = (color: string) => {
  const isLight = document.getElementById('root')?.classList.contains('light-theme');
  if (color.includes('green')) {
    return {
      dropShadow: isLight ? 'drop-shadow(0 2px 4px rgba(5, 150, 105, 0.25))' : 'drop-shadow(0 0 6px rgba(0, 255, 102, 0.45))',
      textShadow: isLight ? '0 1px 3px rgba(5, 150, 105, 0.2)' : '0 0 10px rgba(0, 255, 102, 0.25)',
      rgba005: isLight ? 'rgba(5, 150, 105, 0.05)' : 'rgba(0, 255, 102, 0.05)',
      rgba01: isLight ? 'rgba(5, 150, 105, 0.1)' : 'rgba(0, 255, 102, 0.1)'
    };
  }
  if (color.includes('orange')) {
    return {
      dropShadow: isLight ? 'drop-shadow(0 2px 4px rgba(234, 88, 12, 0.25))' : 'drop-shadow(0 0 6px rgba(255, 159, 0, 0.45))',
      textShadow: isLight ? '0 1px 3px rgba(234, 88, 12, 0.2)' : '0 0 10px rgba(255, 159, 0, 0.25)',
      rgba005: isLight ? 'rgba(234, 88, 12, 0.05)' : 'rgba(255, 159, 0, 0.05)',
      rgba01: isLight ? 'rgba(234, 88, 12, 0.1)' : 'rgba(255, 159, 0, 0.1)'
    };
  }
  if (color.includes('red')) {
    return {
      dropShadow: isLight ? 'drop-shadow(0 2px 4px rgba(220, 38, 38, 0.25))' : 'drop-shadow(0 0 6px rgba(255, 0, 85, 0.45))',
      textShadow: isLight ? '0 1px 3px rgba(220, 38, 38, 0.2)' : '0 0 10px rgba(255, 0, 85, 0.25)',
      rgba005: isLight ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255, 0, 85, 0.05)',
      rgba01: isLight ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 0, 85, 0.1)'
    };
  }
  if (color.includes('purple')) {
    return {
      dropShadow: isLight ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.25))' : 'drop-shadow(0 0 6px rgba(189, 0, 255, 0.45))',
      textShadow: isLight ? '0 1px 3px rgba(124, 58, 237, 0.2)' : '0 0 10px rgba(189, 0, 255, 0.25)',
      rgba005: isLight ? 'rgba(124, 58, 237, 0.05)' : 'rgba(189, 0, 255, 0.05)',
      rgba01: isLight ? 'rgba(124, 58, 237, 0.1)' : 'rgba(189, 0, 255, 0.1)'
    };
  }
  if (color.includes('white')) {
    return {
      dropShadow: isLight ? 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.25))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.45))',
      textShadow: isLight ? '0 1px 3px rgba(15, 23, 42, 0.2)' : '0 0 10px rgba(255, 255, 255, 0.25)',
      rgba005: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)',
      rgba01: isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)'
    };
  }
  // Default is cyan
  return {
    dropShadow: isLight ? 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.25))' : 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.45))',
    textShadow: isLight ? '0 1px 3px rgba(2, 132, 199, 0.2)' : '0 0 10px rgba(0, 229, 255, 0.25)',
    rgba005: isLight ? 'rgba(2, 132, 199, 0.05)' : 'rgba(0, 229, 255, 0.05)',
    rgba01: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 229, 255, 0.1)'
  };
};

const getGlowClass = (color: string): string => {
  if (color.includes('green')) return 'card-glowing-green';
  if (color.includes('orange')) return 'card-glowing-orange';
  if (color.includes('red')) return 'card-glowing-red';
  if (color.includes('purple')) return 'card-glowing-purple';
  if (color.includes('white')) return 'card-glowing-white';
  return 'card-glowing-cyan';
};

export const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  maxSpeed,
  avgSpeed,
  heading,
  units,
  isRecording,
  compact,
  customStyle = 'dial',
  showCompass = true,
  showMaxAvgSpeed = true,
  gaugeColor = 'var(--neon-cyan)',
  gaugeSize = 'standard'
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

  const glow = getGlowStyles(gaugeColor);
  const cardGlowClass = getGlowClass(gaugeColor);

  if (compact) {
    const dialWidthHeight = gaugeSize === 'large' ? 120 : 100;
    const centerVal = dialWidthHeight / 2;
    const compactRadius = gaugeSize === 'large' ? 48 : 40;
    const compCircumference = 2 * Math.PI * compactRadius;
    const compArcLength = compCircumference * 0.75;
    const compDashoffset = compArcLength - (speedPercent / 100) * compArcLength;

    const compassDirection = getCompassDirection(heading);

    const digitalFontSize = gaugeSize === 'large' ? '4.0rem' : '3.0rem';
    const dialFontSize = gaugeSize === 'large' ? '3.4rem' : '2.6rem';

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: showMaxAvgSpeed ? 'space-between' : 'center', 
        flex: '1 1 auto',
        width: '100%',
        maxWidth: gaugeSize === 'large' ? '460px' : '360px',
        gap: gaugeSize === 'large' ? '20px' : '12px'
      }}>
        {/* Speedometer Render Selection */}
        {customStyle === 'digital' ? (
          /* Minimalist Digital Display */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '4px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-dim)',
            borderRadius: '12px',
            minWidth: gaugeSize === 'large' ? '135px' : '105px',
            height: gaugeSize === 'large' ? '108px' : '90px',
            flexShrink: 0
          }}>
            <span style={{ 
              fontFamily: 'var(--gauge-font)', 
              fontSize: digitalFontSize, 
              fontWeight: 800, 
              lineHeight: '1', 
              color: gaugeColor, 
              filter: glow.dropShadow 
            }}>
              {roundedSpeed}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ fontSize: gaugeSize === 'large' ? '0.7rem' : '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                {speedUnit}
              </span>
              {showCompass && (
                <>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>·</span>
                  <span style={{ fontSize: gaugeSize === 'large' ? '0.7rem' : '0.6rem', fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'var(--mono-font)' }}>
                    {compassDirection}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Sports Dial Arc Display */
          <div style={{ position: 'relative', width: `${dialWidthHeight}px`, height: `${dialWidthHeight}px`, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <svg style={{ width: `${dialWidthHeight}px`, height: `${dialWidthHeight}px` }}>
              <circle
                cx={centerVal}
                cy={centerVal}
                r={compactRadius}
                fill="none"
                stroke="var(--border-dim)"
                strokeWidth="4"
                strokeDasharray={`${compArcLength} ${compCircumference}`}
                strokeLinecap="round"
                transform={`rotate(135 ${centerVal} ${centerVal})`}
              />
              <circle
                cx={centerVal}
                cy={centerVal}
                r={compactRadius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="4"
                strokeDasharray={`${compArcLength} ${compCircumference}`}
                strokeDashoffset={compDashoffset}
                strokeLinecap="round"
                transform={`rotate(135 ${centerVal} ${centerVal})`}
                style={{
                  transition: 'stroke-dashoffset 0.15s ease-out',
                  filter: glow.dropShadow
                }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', top: gaugeSize === 'large' ? '30px' : '24px' }}>
              <span style={{ 
                fontFamily: 'var(--gauge-font)', 
                fontSize: dialFontSize, 
                fontWeight: 700, 
                lineHeight: '0.9', 
                color: 'var(--text-primary)' 
              }}>
                {roundedSpeed}
              </span>
              <span style={{ fontSize: gaugeSize === 'large' ? '0.6rem' : '0.5rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginTop: '2px' }}>
                {speedUnit}
              </span>
              {showCompass && (
                <span style={{ fontSize: gaugeSize === 'large' ? '0.65rem' : '0.55rem', fontWeight: 800, color: 'var(--neon-green)', marginTop: '2px', fontFamily: 'var(--mono-font)' }}>
                  {compassDirection}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Vertical Divider line between Gauge and Stats */}
        {showMaxAvgSpeed && (
          <div style={{ 
            width: '1px', 
            height: gaugeSize === 'large' ? '64px' : '52px', 
            background: 'linear-gradient(to bottom, transparent, var(--border-dim) 30%, var(--border-dim) 70%, transparent)',
            flexShrink: 0
          }} />
        )}

        {/* Floating statistics column */}
        {showMaxAvgSpeed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: gaugeSize === 'large' ? '6px' : '4px', textAlign: 'left', flexShrink: 0, minWidth: '95px' }}>
            <div>
              <span style={{ fontSize: gaugeSize === 'large' ? '0.8rem' : '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Average</span>
              <span style={{ fontSize: gaugeSize === 'large' ? '1.6rem' : '1.3rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--gauge-font)', lineHeight: '1.1' }}>
                {roundedAvg} <span style={{ fontSize: gaugeSize === 'large' ? '0.9rem' : '0.8rem', color: 'var(--text-muted)' }}>{speedUnit.toLowerCase()}</span>
              </span>
            </div>
            <div>
              <span style={{ fontSize: gaugeSize === 'large' ? '0.8rem' : '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Maximum</span>
              <span style={{ fontSize: gaugeSize === 'large' ? '1.6rem' : '1.3rem', fontWeight: 700, color: 'var(--neon-orange)', fontFamily: 'var(--gauge-font)', lineHeight: '1.1' }}>
                {roundedMax} <span style={{ fontSize: gaugeSize === 'large' ? '0.9rem' : '0.8rem', color: 'var(--text-muted)' }}>{speedUnit.toLowerCase()}</span>
              </span>
            </div>
          </div>
        )}
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

  const speedFontSize = gaugeSize === 'large' ? '6.5rem' : '5rem';

  return (
    <div 
      className={`card ${cardGlowClass}`} 
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
            color: gaugeColor,
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: glow.rgba005,
            border: `1px solid ${glow.rgba01}`
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
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
            style={{
              transition: 'stroke-dashoffset 0.15s ease-out',
              filter: glow.dropShadow
            }}
          />
        </svg>

        {/* Speed text reading center */}
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span 
            style={{
              fontFamily: 'var(--gauge-font)',
              fontSize: speedFontSize,
              fontWeight: 700,
              lineHeight: '0.9',
              color: 'var(--text-primary)',
              textShadow: glow.textShadow
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
          <div style={{ fontSize: gaugeSize === 'large' ? '0.85rem' : '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Average Speed
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: gaugeSize === 'large' ? '2.0rem' : '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.1' }}>
            {roundedAvg} <span style={{ fontSize: gaugeSize === 'large' ? '1.0rem' : '0.85rem', color: 'var(--text-secondary)' }}>{speedUnit.toLowerCase()}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: gaugeSize === 'large' ? '0.85rem' : '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Maximum Speed
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: gaugeSize === 'large' ? '2.0rem' : '1.7rem', fontWeight: 700, color: 'var(--neon-orange)', marginTop: '2px', lineHeight: '1.1' }}>
            {roundedMax} <span style={{ fontSize: gaugeSize === 'large' ? '1.0rem' : '0.85rem', color: 'var(--text-secondary)' }}>{speedUnit.toLowerCase()}</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};
