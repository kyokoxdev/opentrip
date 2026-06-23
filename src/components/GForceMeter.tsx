import React from 'react';
import { GForce } from '../types';

interface GForceMeterProps {
  gForce: GForce;
  maxG: { lat: number; acc: number; brk: number };
  onCalibrate: () => void;
  compact?: boolean;
}

export const GForceMeter: React.FC<GForceMeterProps> = ({ gForce, maxG, onCalibrate, compact }) => {
  const maxScaleG = 1.0;
  
  if (compact) {
    const compactRadius = 32; // smaller radius
    const compX = Math.max(-compactRadius, Math.min(compactRadius, (gForce.x / maxScaleG) * compactRadius));
    const compY = Math.max(-compactRadius, Math.min(compactRadius, (gForce.y / maxScaleG) * compactRadius));

    return (
      <div 
        style={{ 
          position: 'relative', 
          width: '76px', 
          height: '76px', 
          borderRadius: '50%',
          border: '1px solid var(--border-glass)',
          background: 'var(--g-bubble-bg)',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer'
        }}
        onClick={onCalibrate}
        title="G-Force Meter (Tap to Reset Zero)"
      >
        <svg width="76" height="76" style={{ pointerEvents: 'none' }}>
          <circle cx="38" cy="38" r="32" fill="none" stroke="var(--g-grid-outer)" strokeWidth="0.8" />
          <circle cx="38" cy="38" r="16" fill="none" stroke="var(--g-grid-inner)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
          <line x1="38" y1="4" x2="38" y2="72" stroke="var(--g-grid-inner)" strokeWidth="0.5" />
          <line x1="4" y1="38" x2="72" y2="38" stroke="var(--g-grid-inner)" strokeWidth="0.5" />
        </svg>
        {/* Compact Bubble */}
        <div 
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--neon-green)',
            boxShadow: '0 0 6px var(--neon-green)',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${compX}px), calc(-50% + ${compY}px))`,
            transition: 'transform 0.05s ease-out'
          }}
        />
        {/* Tiny numeric G badge */}
        <span 
          style={{ 
            position: 'absolute', 
            bottom: '2px', 
            fontSize: '0.55rem', 
            fontFamily: 'var(--mono-font)', 
            color: 'var(--text-secondary)',
            fontWeight: 'bold',
            backgroundColor: 'var(--g-badge-bg)',
            padding: '1px 4px',
            borderRadius: '4px',
            border: '1px solid var(--g-badge-border)'
          }}
        >
          {Math.max(Math.abs(gForce.x), Math.abs(gForce.y)).toFixed(1)}G
        </span>
      </div>
    );
  }

  // Convert G values to grid coordinate translations (canvas limit is 100px radius)
  const gridRadius = 90; // outer circle radius
  const xOffset = Math.max(-gridRadius, Math.min(gridRadius, (gForce.x / maxScaleG) * gridRadius));
  const yOffset = Math.max(-gridRadius, Math.min(gridRadius, (gForce.y / maxScaleG) * gridRadius));

  // Peaks coordinate translations
  const peakLeft = -(maxG.lat / maxScaleG) * gridRadius;
  const peakRight = (maxG.lat / maxScaleG) * gridRadius;
  const peakAcc = -(maxG.acc / maxScaleG) * gridRadius;
  const peakBrk = (maxG.brk / maxScaleG) * gridRadius;

  return (
    <div 
      className="card card-glowing-green" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-card-gradient-end) 100%)'
      }}
    >
      {/* Header controls row */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '1px' }}>
          G-Force Dynamics
        </h3>
        <button 
          className="btn btn-outline" 
          onClick={onCalibrate}
          style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid rgba(0, 255, 102, 0.2)' }}
        >
          RESET ZERO (TARE)
        </button>
      </div>

      {/* SVG-based Friction Circle Grid */}
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="200" height="200" style={{ pointerEvents: 'none' }}>
          {/* Outer Ring 1.0G */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--g-grid-outer)" strokeWidth="1.5" />
          {/* Inner Ring 0.5G */}
          <circle cx="100" cy="100" r="45" fill="none" stroke="var(--g-grid-inner)" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Crosshairs axis */}
          <line x1="100" y1="10" x2="100" y2="190" stroke="var(--g-grid-inner)" strokeWidth="1" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="var(--g-grid-inner)" strokeWidth="1" />

          {/* Directional labels inside grid */}
          <text x="100" y="24" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">ACCEL</text>
          <text x="100" y="184" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">BRAKE</text>
          <text x="24" y="102" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">LEFT</text>
          <text x="176" y="102" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">RIGHT</text>

          {/* Ring scale values */}
          <text x="100" y="62" fill="var(--g-grid-text)" fontSize="7" fontWeight="bold" textAnchor="middle">0.5 G</text>
          <text x="100" y="42" fill="var(--g-grid-text)" fontSize="7" fontWeight="bold" textAnchor="middle">1.0 G</text>

          {/* Render Max peak indicators on Grid */}
          {maxG.lat > 0.02 && (
            <>
              {/* Max Left */}
              <circle cx={100 + peakLeft} cy="100" r="3" fill="rgba(255, 159, 0, 0.3)" />
              {/* Max Right */}
              <circle cx={100 + peakRight} cy="100" r="3" fill="rgba(255, 159, 0, 0.3)" />
            </>
          )}
          {maxG.acc > 0.02 && (
            <circle cx="100" cy={100 + peakAcc} r="3" fill="rgba(0, 229, 255, 0.3)" />
          )}
          {maxG.brk > 0.02 && (
            <circle cx="100" cy={100 + peakBrk} r="3" fill="rgba(255, 0, 85, 0.3)" />
          )}
        </svg>

        {/* Live glowing G-force bubble */}
        <div 
          style={{
            position: 'absolute',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00ff66 0%, #00d957 70%)',
            boxShadow: '0 0 10px #00ff66, inset 0 2px 4px rgba(255,255,255,0.6)',
            left: '50%',
            top: '50%',
            // Subtracting 9px from translation to offset for center coordinates (since center is 100,100)
            transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px))`,
            transition: 'transform 0.05s ease-out'
          }}
        />

        {/* Real-time floating value ticker */}
        <div 
          style={{
            position: 'absolute',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontFamily: 'var(--mono-font)',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            pointerEvents: 'none'
          }}
        >
          {Math.abs(gForce.x).toFixed(2)}G LAT | {Math.abs(-gForce.y).toFixed(2)}G LON
        </div>
      </div>

      {/* Grid summarizing max peaks */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          width: '100%',
          marginTop: '16px',
          borderTop: '1px solid var(--border-dim)',
          paddingTop: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ borderRight: '1px solid var(--border-dim)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Max Cornering
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-orange)', marginTop: '2px' }}>
            {maxG.lat.toFixed(2)}G
          </div>
        </div>
        <div style={{ borderRight: '1px solid var(--border-dim)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Max Acceleration
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-cyan)', marginTop: '2px' }}>
            {maxG.acc.toFixed(2)}G
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Max Braking
          </div>
          <div style={{ fontFamily: 'var(--gauge-font)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-red)', marginTop: '2px' }}>
            {maxG.brk.toFixed(2)}G
          </div>
        </div>
      </div>
      
    </div>
  );
};
